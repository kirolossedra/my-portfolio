#!/usr/bin/env python3
"""
Portfolio GitHub RAG pipeline — Step 2 v2: evidence-aware retrieval-document compilation.

ZERO-ARGUMENT USAGE
-------------------
Place this script in the project root beside `rag-corpus/` and run:

    python build-rag-retrieval-documents-v2.py

INPUT
-----
    rag-corpus/repositories.jsonl

OUTPUT
------
    rag-corpus/retrieval-documents-v2/documents.jsonl
    rag-corpus/retrieval-documents-v2/document-catalog.json
    rag-corpus/retrieval-documents-v2/document-manifest.json
    rag-corpus/retrieval-documents-v2/document-validation-report.txt
    rag-corpus/retrieval-documents-v2/excluded-source-units.jsonl
    rag-corpus/retrieval-documents-v2/by-repository/repo-XXX.documents.jsonl

WHY THIS REPLACES THE OLD STEP 2
--------------------------------
The original Step 2 treated nearly every Markdown section as an embedding unit.
That preserved text faithfully, but it produced many tiny, repeated, template-
heavy vectors. In this corpus that can make generic analytical scaffolding rank
above concrete project evidence.

This v2 compiler instead:
- reparses Step 1 `raw_analysis` into non-overlapping source sections;
- detects repeated boilerplate at block level across the complete corpus;
- NEVER deletes or edits the Step 1 canonical corpus;
- removes repeated boilerplate only from the derived retrieval payload;
- classifies evidence as direct evidence, interpretation, limitation,
  chronology, or metadata;
- labels polarity (positive / negative / mixed / neutral);
- distinguishes concrete implementation evidence from conceptual/methodology
  text;
- groups related source blocks into coherent evidence documents rather than
  arbitrary tiny chunks;
- keeps exact source-file and line provenance for every retained fragment;
- keeps short documents when they are concrete (e.g. a concise API-design
  section), while suppressing short generic scaffolding;
- validates 134/134 repository coverage and every retained source fragment;
- writes outputs atomically only after validation succeeds.

IMPORTANT FOR STEP 3 v2
-----------------------
Embed `embedding_text` from `documents.jsonl`.
Keep `text` and `source_fragments` for employer-facing evidence/citations.
Do not embed the old `rag-corpus/chunks/chunks.jsonl` after switching to v2.

No network, API key, paid service, external package, or model training is used
by this script. Python standard library only.
"""

from __future__ import annotations

import hashlib
import json
import math
import re
import shutil
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from statistics import median
from typing import Any, Iterable


# ---------------------------------------------------------------------------
# Paths / schema
# ---------------------------------------------------------------------------

SCRIPT_NAME = Path(__file__).name
BASE_DIR = Path(__file__).resolve().parent
RAG_DIR = BASE_DIR / "rag-corpus"
INPUT_PATH = RAG_DIR / "repositories.jsonl"
OUTPUT_DIR = RAG_DIR / "retrieval-documents-v2"
TEMP_OUTPUT_DIR = RAG_DIR / ".retrieval-documents-v2.tmp"
BY_REPO_DIRNAME = "by-repository"

SCHEMA_VERSION = "2.0.0"
EXPECTED_INPUT_SCHEMA_MAJOR = "1"
EXPECTED_REPOSITORY_TOTAL = 134

# Retrieval-document sizing. The compiler groups evidence blocks up to this
# target and never intentionally exceeds HARD_MAX_WORDS.
TARGET_WORDS = 380
SOFT_MIN_WORDS = 70
HARD_MAX_WORDS = 650
DOCUMENT_MAX_WORDS = 820  # includes structural section labels added to authoritative text

# A block seen in many distinct repositories is corpus scaffolding, not unique
# evidence. Threshold deliberately scales with corpus size as well as an
# absolute floor.
TEMPLATE_REPO_FRACTION = 0.055
TEMPLATE_REPO_MIN = 7
TEMPLATE_MIN_WORDS = 7

# High-frequency headings are not automatically removed: only their repeated
# body blocks are. The frequency is used as an additional low-specificity cue.
GENERIC_TITLE_REPO_FRACTION = 0.25

HEADING_RE = re.compile(r"^(?P<marks>#{2,6})\s+(?P<title>.+?)\s*$", re.MULTILINE)
WORD_RE = re.compile(r"\S+")
TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9_+.#/-]{1,}")
MARKDOWN_LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]*\)")
URL_RE = re.compile(r"https?://\S+", re.IGNORECASE)
HEX_RE = re.compile(r"\b[0-9a-f]{7,64}\b", re.IGNORECASE)
NUMBER_RE = re.compile(r"(?<![A-Za-z])\d+(?:[.,:/-]\d+)*(?:%|ms|s|mb|gb|kb|hz|mhz|ghz)?", re.IGNORECASE)
CODE_RE = re.compile(r"`([^`]+)`")
BLANK_SPLIT_RE = re.compile(r"\n[ \t]*\n+")
SENTENCE_BOUNDARY_RE = re.compile(r"(?<=[.!?])(?:[\"')\]]*)\s+(?=[A-Z0-9`*_(\[])")


# ---------------------------------------------------------------------------
# Classification constants
# ---------------------------------------------------------------------------

LIMITATION_CATEGORIES = {
    "limitations", "weaknesses_debt", "failure_modes", "production_evolution"
}
DIRECT_CATEGORIES = {
    "skills", "architecture", "testing", "security_privacy", "deployment_cicd",
    "engineering_decisions", "responsibility", "strengths", "technical_scope"
}
CHRONOLOGY_CATEGORIES = {"chronology", "longitudinal"}
METADATA_CATEGORIES = {"rag_metadata", "identity", "repository_hygiene", "documentation"}
INTERPRETATION_CATEGORIES = {
    "maturity", "portfolio_weight", "career_signal", "engineering_judgment",
    "evidence_inference", "business_domain", "scale", "human_impact"
}

LIMITATION_TITLE_TERMS = (
    "what remains bounded", "what this repository does not prove", "weakness",
    "debt", "failure", "limitation", "missing production", "not demonstrated",
    "n/a", "unknown", "risk", "gap ledger", "unsafe inflation", "counterfactual",
    "negative", "evidence ceiling", "main limiting factor"
)
DIRECT_TITLE_TERMS = (
    "what the evidence shows", "primary implementation evidence", "direct skill",
    "skill evidence", "architecture", "api design", "authentication", "authorization",
    "security", "testing", "verification", "deployment", "ci/cd", "responsibility",
    "engineering decisions", "strengths", "technical scope", "artifact-to-skill",
    "demonstrated responsibility", "implementation", "data-flow", "data flow"
)
CHRONOLOGY_TITLE_TERMS = (
    "chronology", "lifecycle", "trajectory", "longitudinal", "career state",
    "first / previous / current", "recency", "development character"
)
METADATA_TITLE_TERMS = (
    "rag metadata", "project identity", "repository hygiene", "documentation",
    "retrieval tags", "inspection method", "provenance"
)

NEGATIVE_PHRASES = (
    "not evidenced", "not demonstrated", "no substantive implementation",
    "no implementation", "does not prove", "do not prove", "cannot prove",
    "absent / n/a", "absent", "missing", "none observed", "no executable",
    "conceptual exposure", "under guidance", "assistant-generated", "unknown",
    "not inspectable", "not visible", "not stored", "maturity ceiling",
    "should not be framed", "do not frame", "not production"
)
POSITIVE_PHRASES = (
    "implemented", "implements", "authored", "built", "created", "designed",
    "exposes", "requires", "enforces", "supports", "integrates", "uses",
    "validated", "tested", "deployed", "operates", "provides", "demonstrates",
    "direct evidence", "observed", "configured", "protects", "routes", "persists"
)
CONCEPTUAL_PHRASES = (
    "conceptual exposure", "course", "lab exposure", "tutorial", "guided",
    "assistant-generated", "recommendations", "study artifact", "learning artifact"
)

# Explicit boilerplate patterns catch near-template language whose variable
# repository-specific phrase prevents an exact cross-repository fingerprint.
KNOWN_TEMPLATE_PHRASES = (
    "the architecture section exists to make the artifact queryable",
    "count only the directly visible implementation or executed-learning signal",
    "preserve course/platform/generated provenance beside the claim",
    "treat absent evidence as absent rather than filling gaps",
    "do not convert local experimentation into production ownership",
    "claim remains bounded by repository scope and provenance",
    "assess at repository scope; no enterprise-scale claim is implied",
    "this ledger stress-tests the",
    "it is intentionally explicit so later retrieval cannot collapse",
    "architecture is reviewed as a set of boundaries rather than a buzzword",
    "the following checks are applied even when the answer is",
    "the strongest explanation should name one concrete artifact, one limitation",
    "preserve the distinction between what was authored, what was executed under guidance",
    "this section exists to make",
    "safe positive retrieval",
    "unsafe retrieval pattern",
    "unsafe inflation examples",
    "counterfactual retrieval guardrails",
)

# Words removed when deriving lightweight topic labels from headings.

SYNTHETIC_SCAFFOLD_TITLE_TERMS = (
    "rag anti-inflation warnings",
    "expanded direct-skill evidence ledger",
    "explicit n/a / unknown register",
    "counterfactual retrieval guardrails",
    "safe positive phrasing",
    "safe limitation phrasing",
    "unsafe inflation examples",
    "expanded longitudinal summary vector",
    "standardized product / engineering evaluation matrix",
    "standard evaluation matrix",
    "first / previous / current / corpus-max ledger update",
    "full analytical-schema applicability audit",
    "architecture review checklist",
    "retrieval-query stress test",
    "career-rag claim calibration ledger",
    "evidence micro-ledger",
    "retrieval-grade evidence stress test",
    "repository-specific production review checklist",
    "production-readiness gap ledger",
    "extended failure-mode and misuse register",
    "recommended rag retrieval phrasing",
)

TOPIC_STOPWORDS = {
    "the", "and", "or", "of", "to", "for", "a", "an", "in", "on", "with",
    "this", "that", "repository", "project", "evidence", "analysis", "review",
    "expanded", "direct", "current", "overall", "main", "primary", "secondary",
    "what", "does", "not", "shows", "section", "rating", "ratings", "matrix",
    "update", "summary", "standardized", "explicit", "safe", "unsafe",
    "retrieval", "rag", "grade", "ledger", "checklist", "register"
}


# ---------------------------------------------------------------------------
# Data classes / errors
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class AtomicUnit:
    unit_id: str
    section_id: str | None
    level: int | None
    title: str
    normalized_title: str
    path: list[str]
    text: str
    raw_char_start: int
    raw_char_end: int
    source_line_start: int
    source_line_end: int
    canonical_categories: list[str]
    related_skill_ratings: list[dict[str, Any]]


@dataclass(frozen=True)
class SourceBlock:
    block_id: str
    repository_index: int
    unit_id: str
    section_id: str | None
    section_title: str
    section_path: list[str]
    canonical_categories: list[str]
    related_skill_ratings: list[dict[str, Any]]
    text: str
    raw_char_start: int
    raw_char_end: int
    source_line_start: int
    source_line_end: int
    fingerprint: str
    word_count: int


@dataclass(frozen=True)
class EvidenceFragment:
    block: SourceBlock
    retrieval_class: str
    polarity: str
    evidence_level: str
    specificity_score: float
    concrete_hits: int
    template_repo_frequency: int


class PipelineError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# Basic helpers
# ---------------------------------------------------------------------------

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def stable_json(obj: Any, *, pretty: bool = False) -> str:
    if pretty:
        return json.dumps(obj, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def word_count(text: str) -> int:
    return sum(1 for _ in WORD_RE.finditer(text))


def strip_numbering(title: str) -> str:
    value = re.sub(r"^\s*\d+(?:\.\d+)*[.)]?\s*", "", title).strip()
    return value


def line_at(raw: str, base_source_line: int, char_offset: int) -> int:
    char_offset = max(0, min(char_offset, len(raw)))
    return base_source_line + raw.count("\n", 0, char_offset)


def trimmed_span(text: str, start: int, end: int) -> tuple[int, int]:
    while start < end and text[start].isspace():
        start += 1
    while end > start and text[end - 1].isspace():
        end -= 1
    return start, end


def skill_names(skills: Iterable[dict[str, Any]]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for skill in skills:
        name = str(skill.get("skill", "")).strip()
        key = name.casefold()
        if name and key not in seen:
            seen.add(key)
            result.append(name)
    return result


def unique_preserving(items: Iterable[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for item in items:
        value = str(item).strip()
        key = value.casefold()
        if value and key not in seen:
            seen.add(key)
            result.append(value)
    return result


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8-sig") as f:
        for line_no, line in enumerate(f, start=1):
            if not line.strip():
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as exc:
                raise PipelineError(f"Invalid JSON at {path} line {line_no}: {exc}") from exc
            if not isinstance(value, dict):
                raise PipelineError(f"Expected JSON object at input line {line_no}.")
            rows.append(value)
    if not rows:
        raise PipelineError(f"Input is empty: {path}")
    return rows


# ---------------------------------------------------------------------------
# Step 1 validation / reconstruction
# ---------------------------------------------------------------------------

def validate_input_records(records: list[dict[str, Any]]) -> int:
    required = {
        "schema_version", "repository_index", "repository_total", "repository_name",
        "source", "chronology_summary", "classification_summary", "metadata",
        "retrieval_tags", "skill_ratings", "canonical_sections", "sections",
        "raw_analysis"
    }
    indexes: list[int] = []
    totals: Counter[int] = Counter()

    for row_no, record in enumerate(records, start=1):
        missing = sorted(required - set(record))
        if missing:
            raise PipelineError(f"Input record {row_no} missing fields: {missing}")
        schema = str(record.get("schema_version", ""))
        if schema.split(".", 1)[0] != EXPECTED_INPUT_SCHEMA_MAJOR:
            raise PipelineError(
                f"Repo {record.get('repository_index', '?')}: unsupported Step 1 schema {schema!r}."
            )
        try:
            idx = int(record["repository_index"])
            total = int(record["repository_total"])
        except (TypeError, ValueError) as exc:
            raise PipelineError(f"Input record {row_no} has invalid index/total.") from exc
        indexes.append(idx)
        totals[total] += 1
        raw = record.get("raw_analysis")
        if not isinstance(raw, str) or not raw.strip():
            raise PipelineError(f"Repo {idx:03d}: raw_analysis is empty.")
        source = record.get("source")
        if not isinstance(source, dict):
            raise PipelineError(f"Repo {idx:03d}: source metadata invalid.")
        for key in ("file", "line_start", "line_end", "sha256"):
            if key not in source:
                raise PipelineError(f"Repo {idx:03d}: source.{key} missing.")
        if sha256_text(raw) != str(source["sha256"]):
            raise PipelineError(f"Repo {idx:03d}: raw_analysis SHA-256 mismatch.")

    if len(set(indexes)) != len(indexes):
        dup = sorted(i for i, n in Counter(indexes).items() if n > 1)
        raise PipelineError(f"Duplicate repository indexes: {dup}")
    if len(totals) != 1:
        raise PipelineError(f"Conflicting repository_total values: {dict(totals)}")
    total = next(iter(totals))
    expected = set(range(1, total + 1))
    actual = set(indexes)
    if expected != actual:
        raise PipelineError(
            f"Repository coverage mismatch. Missing={sorted(expected-actual)} extra={sorted(actual-expected)}"
        )
    if len(records) != total:
        raise PipelineError(f"Expected {total} repository records, loaded {len(records)}.")
    if total != EXPECTED_REPOSITORY_TOTAL:
        raise PipelineError(
            f"This corpus is expected to contain {EXPECTED_REPOSITORY_TOTAL} repositories; found {total}."
        )
    return total


def build_section_category_map(record: dict[str, Any]) -> dict[str, list[str]]:
    mapping: dict[str, list[str]] = defaultdict(list)
    canonical = record.get("canonical_sections") or {}
    if not isinstance(canonical, dict):
        return {}
    for category, data in canonical.items():
        if not isinstance(data, dict):
            continue
        for section_id in data.get("section_ids", []) or []:
            sid = str(section_id)
            if str(category) not in mapping[sid]:
                mapping[sid].append(str(category))
    return dict(mapping)


def build_skill_map(record: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    mapping: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for skill in record.get("skill_ratings", []) or []:
        if isinstance(skill, dict) and skill.get("source_section_id"):
            mapping[str(skill["source_section_id"])].append(skill)
    return dict(mapping)


def section_lookup(record: dict[str, Any]) -> dict[tuple[int, str], dict[str, Any]]:
    lookup: dict[tuple[int, str], dict[str, Any]] = {}
    for section in record.get("sections", []) or []:
        if not isinstance(section, dict):
            continue
        try:
            line = int(section["source_line_start"])
        except (KeyError, TypeError, ValueError):
            continue
        lookup[(line, str(section.get("title", "")).strip())] = section
    return lookup


def reconstruct_atomic_units(record: dict[str, Any]) -> list[AtomicUnit]:
    """Every heading owns only text until the next heading, avoiding hierarchy duplication."""
    raw = record["raw_analysis"]
    base_line = int(record["source"]["line_start"])
    matches = list(HEADING_RE.finditer(raw))
    expected_headings = len(record.get("sections", []) or [])
    if len(matches) != expected_headings:
        raise PipelineError(
            f"Repo {int(record['repository_index']):03d}: raw heading count {len(matches)} "
            f"!= Step 1 section count {expected_headings}."
        )

    lookup = section_lookup(record)
    category_map = build_section_category_map(record)
    skill_map = build_skill_map(record)
    units: list[AtomicUnit] = []
    stack: list[tuple[int, str]] = []

    # Unique introduction before the first ## heading, if any.
    first_nl = raw.find("\n")
    body_start = first_nl + 1 if first_nl >= 0 else len(raw)
    intro_end = matches[0].start() if matches else len(raw)
    is_, ie = trimmed_span(raw, body_start, intro_end)
    if is_ < ie:
        units.append(AtomicUnit(
            unit_id="intro", section_id=None, level=None,
            title="Repository introduction", normalized_title="Repository introduction",
            path=["Repository introduction"], text=raw[is_:ie],
            raw_char_start=is_, raw_char_end=ie,
            source_line_start=line_at(raw, base_line, is_),
            source_line_end=line_at(raw, base_line, max(is_, ie-1)),
            canonical_categories=["summary"], related_skill_ratings=[]
        ))

    for i, match in enumerate(matches):
        level = len(match.group("marks"))
        title = match.group("title").strip()
        heading_line = line_at(raw, base_line, match.start())
        while stack and stack[-1][0] >= level:
            stack.pop()
        path = [t for _, t in stack] + [title]
        stack.append((level, title))
        next_start = matches[i+1].start() if i+1 < len(matches) else len(raw)
        start, end = trimmed_span(raw, match.end(), next_start)
        if start >= end:
            continue
        existing = lookup.get((heading_line, title))
        if existing is None:
            raise PipelineError(
                f"Repo {int(record['repository_index']):03d}: cannot map heading {title!r} "
                f"at source line {heading_line}."
            )
        sid = str(existing["id"])
        units.append(AtomicUnit(
            unit_id=sid, section_id=sid, level=level, title=title,
            normalized_title=str(existing.get("normalized_title") or strip_numbering(title)),
            path=path, text=raw[start:end], raw_char_start=start, raw_char_end=end,
            source_line_start=line_at(raw, base_line, start),
            source_line_end=line_at(raw, base_line, max(start, end-1)),
            canonical_categories=category_map.get(sid, []),
            related_skill_ratings=skill_map.get(sid, [])
        ))
    return units


# ---------------------------------------------------------------------------
# Structural source blocks and template detection
# ---------------------------------------------------------------------------

def _paragraph_spans(text: str) -> list[tuple[int, int]]:
    spans: list[tuple[int, int]] = []
    start = 0
    for m in BLANK_SPLIT_RE.finditer(text):
        s, e = trimmed_span(text, start, m.start())
        if s < e:
            spans.append((s, e))
        start = m.end()
    s, e = trimmed_span(text, start, len(text))
    if s < e:
        spans.append((s, e))
    return spans


def _split_table_or_list_block(text: str, base_start: int) -> list[tuple[int, int]]:
    """Split highly regular Markdown tables/lists so repeated rows can be detected."""
    lines = text.splitlines(keepends=True)
    if len(lines) < 3:
        return [(base_start, base_start + len(text))]
    stripped = [ln.strip() for ln in lines if ln.strip()]
    if not stripped:
        return []
    table_ratio = sum(s.startswith("|") and s.endswith("|") for s in stripped) / len(stripped)
    bullet_ratio = sum(bool(re.match(r"^(?:[-*+] |\d+[.)] )", s)) for s in stripped) / len(stripped)
    if table_ratio < 0.70 and bullet_ratio < 0.80:
        return [(base_start, base_start + len(text))]

    spans: list[tuple[int, int]] = []
    pos = 0
    for line in lines:
        local_start = pos
        local_end = pos + len(line)
        pos = local_end
        s, e = trimmed_span(text, local_start, local_end)
        if s >= e:
            continue
        value = text[s:e]
        # Markdown table separators contain no evidence.
        if re.fullmatch(r"\|?[\s:|-]+\|?", value):
            continue
        spans.append((base_start + s, base_start + e))
    return spans or [(base_start, base_start + len(text))]


def semantic_split_spans(text: str, max_words: int = HARD_MAX_WORDS) -> list[tuple[int, int]]:
    """Split an oversized text span while preserving exact character spans."""
    if word_count(text) <= max_words:
        return [(0, len(text))]
    spans: list[tuple[int, int]] = []
    start = 0
    while start < len(text):
        while start < len(text) and text[start].isspace():
            start += 1
        if start >= len(text):
            break
        words = list(WORD_RE.finditer(text, start))
        if len(words) <= max_words:
            end = len(text)
        else:
            max_end = words[max_words-1].end()
            target_n = min(TARGET_WORDS, max_words)
            target_end = words[target_n-1].end()
            # Prefer paragraph, sentence, then line boundaries near target.
            candidates: list[int] = []
            for m in re.finditer(r"\n[ \t]*\n+", text[start:max_end]):
                candidates.append(start + m.end())
            for m in SENTENCE_BOUNDARY_RE.finditer(text, start, max_end):
                candidates.append(m.end())
            if candidates:
                valid = [c for c in candidates if c > start and c <= max_end]
                end = min(valid, key=lambda c: abs(c-target_end)) if valid else max_end
            else:
                line = text.rfind("\n", start+1, max_end+1)
                end = line+1 if line > start else max_end
        s, e = trimmed_span(text, start, end)
        if s < e:
            spans.append((s, e))
        start = end
    return spans


def template_fingerprint(text: str, record: dict[str, Any]) -> str:
    value = text
    # Remove Markdown destinations while keeping visible labels.
    value = MARKDOWN_LINK_RE.sub(r"\1", value)
    value = URL_RE.sub(" <url> ", value)
    value = HEX_RE.sub(" <hash> ", value)
    # Replace repository-specific identities before cross-repo comparison.
    for candidate in (
        str(record.get("repository_name", "")),
        str(record.get("repository_slug", "")),
        str(record.get("repository_url", "")),
    ):
        if candidate:
            value = re.sub(re.escape(candidate), " <repo> ", value, flags=re.IGNORECASE)
    # Preserve short technology code spans, but normalize path/hash-like spans.
    def code_repl(m: re.Match[str]) -> str:
        inner = m.group(1)
        if "/" in inner or "\\" in inner or len(inner) > 40 or HEX_RE.fullmatch(inner):
            return " <code> "
        return f" {inner} "
    value = CODE_RE.sub(code_repl, value)
    value = NUMBER_RE.sub(" <num> ", value)
    value = re.sub(r"[*_>#~]", " ", value)
    value = value.casefold()
    value = re.sub(r"\s+", " ", value).strip(" |:-")
    return value


def build_blocks_for_unit(record: dict[str, Any], unit: AtomicUnit) -> list[SourceBlock]:
    raw = record["raw_analysis"]
    base_source_line = int(record["source"]["line_start"])
    blocks: list[SourceBlock] = []
    block_number = 0

    for p_start, p_end in _paragraph_spans(unit.text):
        paragraph = unit.text[p_start:p_end]
        structural = _split_table_or_list_block(paragraph, p_start)
        for s0, e0 in structural:
            relative_text = unit.text[s0:e0]
            for sub_start, sub_end in semantic_split_spans(relative_text):
                local_start = s0 + sub_start
                local_end = s0 + sub_end
                text = unit.text[local_start:local_end].strip()
                if not text:
                    continue
                # Recover exact trim offsets after .strip().
                abs_local_start, abs_local_end = trimmed_span(unit.text, local_start, local_end)
                raw_start = unit.raw_char_start + abs_local_start
                raw_end = unit.raw_char_start + abs_local_end
                block_number += 1
                blocks.append(SourceBlock(
                    block_id=f"repo-{int(record['repository_index']):03d}-{unit.unit_id}-b{block_number:03d}",
                    repository_index=int(record["repository_index"]),
                    unit_id=unit.unit_id,
                    section_id=unit.section_id,
                    section_title=unit.title,
                    section_path=unit.path,
                    canonical_categories=unit.canonical_categories,
                    related_skill_ratings=unit.related_skill_ratings,
                    text=raw[raw_start:raw_end],
                    raw_char_start=raw_start,
                    raw_char_end=raw_end,
                    source_line_start=line_at(raw, base_source_line, raw_start),
                    source_line_end=line_at(raw, base_source_line, max(raw_start, raw_end-1)),
                    fingerprint=template_fingerprint(raw[raw_start:raw_end], record),
                    word_count=word_count(raw[raw_start:raw_end]),
                ))
    return blocks


def known_template_match(text: str) -> bool:
    low = normalize_ws(text).casefold()
    return any(phrase in low for phrase in KNOWN_TEMPLATE_PHRASES)


def compute_template_stats(
    records: list[dict[str, Any]],
    units_by_repo: dict[int, list[AtomicUnit]],
) -> tuple[dict[int, list[SourceBlock]], Counter[str], Counter[str]]:
    blocks_by_repo: dict[int, list[SourceBlock]] = {}
    fingerprint_repos: dict[str, set[int]] = defaultdict(set)
    title_repos: dict[str, set[int]] = defaultdict(set)

    records_by_idx = {int(r["repository_index"]): r for r in records}
    for idx, units in units_by_repo.items():
        record = records_by_idx[idx]
        repo_blocks: list[SourceBlock] = []
        for unit in units:
            title_repos[strip_numbering(unit.normalized_title).casefold()].add(idx)
            unit_blocks = build_blocks_for_unit(record, unit)
            repo_blocks.extend(unit_blocks)
            for block in unit_blocks:
                if block.word_count >= TEMPLATE_MIN_WORDS and block.fingerprint:
                    fingerprint_repos[block.fingerprint].add(idx)
        blocks_by_repo[idx] = repo_blocks

    fp_counts = Counter({fp: len(repos) for fp, repos in fingerprint_repos.items()})
    title_counts = Counter({title: len(repos) for title, repos in title_repos.items()})
    return blocks_by_repo, fp_counts, title_counts


# ---------------------------------------------------------------------------
# Evidence classification / specificity
# ---------------------------------------------------------------------------

def classify_retrieval_class(title: str, categories: list[str]) -> str:
    low = strip_numbering(title).casefold()
    cats = set(categories)
    if any(term in low for term in LIMITATION_TITLE_TERMS) or cats & LIMITATION_CATEGORIES:
        return "limitation"
    if any(term in low for term in CHRONOLOGY_TITLE_TERMS) or cats & CHRONOLOGY_CATEGORIES:
        return "chronology"
    if any(term in low for term in DIRECT_TITLE_TERMS) or cats & DIRECT_CATEGORIES:
        return "direct_evidence"
    if any(term in low for term in METADATA_TITLE_TERMS) or cats & METADATA_CATEGORIES:
        return "metadata"
    if cats & INTERPRETATION_CATEGORIES:
        return "interpretation"
    return "interpretation"


def classify_polarity(text: str, retrieval_class: str, title: str) -> str:
    low = f"{title}\n{text}".casefold()
    neg = sum(low.count(p) for p in NEGATIVE_PHRASES)
    pos = sum(low.count(p) for p in POSITIVE_PHRASES)
    if retrieval_class == "limitation":
        return "negative" if pos == 0 or neg >= pos else "mixed"
    if neg and pos:
        if neg >= pos * 2:
            return "negative"
        if pos >= neg * 2:
            return "positive"
        return "mixed"
    if neg:
        return "negative"
    if pos or retrieval_class == "direct_evidence":
        return "positive"
    return "neutral"


def concrete_signal_count(text: str, record: dict[str, Any]) -> int:
    low = text.casefold()
    hits = 0
    patterns = [
        r"`[^`]{1,80}`",                                   # concrete code/file/symbol
        r"\b(?:GET|POST|PUT|PATCH|DELETE)\s+/[A-Za-z0-9_/{}/.-]+\b",
        r"\b[A-Za-z0-9_.-]+\.(?:py|ts|tsx|js|jsx|java|cpp|c|h|cs|go|rs|sql|json|ya?ml|toml|html|css|md)\b",
        r"\b\d+(?:\.\d+)?\s*(?:ms|s|sec|seconds?|mb|gb|kb|hz|mhz|ghz|%|users?|commits?|tests?|runs?)\b",
        r"\b(?:firebase|cloudflare|hono|react|typescript|javascript|python|java|spring|django|azure|gcp|aws|docker|kafka|sql|postgres|mysql|sqlite|playwright|vitest|github actions|oauth|iam|rbac|jwt|session|sha-?256|opencv|pytorch|tensorflow|zephyr|nrf|uart|i2c|spi|ble|wifi|5g)\b",
        r"\b(?:implements?|implemented|authored|built|created|designed|exposes?|requires?|enforces?|protects?|validates?|persists?|routes?|integrates?|configured|deployed|tested)\b",
    ]
    for pat in patterns:
        if re.search(pat, text, flags=re.IGNORECASE):
            hits += 1
    # Repo retrieval tags count only when actually present in this block.
    tag_hits = 0
    for tag in record.get("retrieval_tags", []) or []:
        tag_s = str(tag).strip().casefold()
        if len(tag_s) >= 4 and tag_s in low:
            tag_hits += 1
    hits += min(2, tag_hits)
    return hits


def classify_evidence_level(
    text: str,
    retrieval_class: str,
    polarity: str,
    concrete_hits: int,
    related_skills: list[dict[str, Any]],
    is_template: bool,
) -> tuple[str, float]:
    low = text.casefold()
    conceptual = any(p in low for p in CONCEPTUAL_PHRASES)
    max_rating = 0.0
    for skill in related_skills:
        try:
            max_rating = max(max_rating, float(skill.get("rating_5") or 0.0))
        except (TypeError, ValueError):
            pass

    if is_template:
        return "methodology_template", 0.02
    if retrieval_class == "limitation":
        score = min(1.0, 0.42 + 0.08 * concrete_hits + (0.08 if word_count(text) >= 25 else 0.0))
        return "repository_limitation", score
    if conceptual and concrete_hits <= 1:
        return "conceptual_exposure", 0.26
    if retrieval_class == "direct_evidence" and (concrete_hits >= 3 or (max_rating >= 3.0 and concrete_hits >= 1)):
        score = min(1.0, 0.68 + 0.055 * concrete_hits + min(max_rating, 5.0) * 0.02)
        return "implemented_or_concrete", score
    if retrieval_class == "direct_evidence" and concrete_hits >= 1:
        return "repository_specific", min(0.82, 0.50 + 0.07 * concrete_hits)
    if concrete_hits >= 2:
        return "repository_specific", min(0.78, 0.44 + 0.07 * concrete_hits)
    if polarity == "negative" and concrete_hits == 0:
        return "repository_limitation", 0.34
    return "interpretive", 0.34 + min(0.18, 0.04 * concrete_hits)


def topic_labels_for_document(
    record: dict[str, Any], fragments: list[EvidenceFragment]
) -> list[str]:
    text = "\n".join(f.block.text for f in fragments)
    low = text.casefold()
    titles = " ".join(" ".join(f.block.section_path) for f in fragments)
    labels: list[str] = []

    # Skill names are strongest topic labels.
    for fragment in fragments:
        labels.extend(skill_names(fragment.block.related_skill_ratings))

    # Repo-level retrieval tags only apply if at least one meaningful token from
    # the tag appears in the document itself/title. This avoids stamping every
    # repo tag onto every document.
    searchable = f"{low} {titles.casefold()}"
    for tag in record.get("retrieval_tags", []) or []:
        tag_s = str(tag).strip()
        terms = [
            t.casefold() for t in TOKEN_RE.findall(tag_s)
            if len(t) >= 4 and t.casefold() not in TOPIC_STOPWORDS and not t.isdigit()
        ]
        if terms and (tag_s.casefold() in searchable or any(t in searchable for t in terms)):
            labels.append(tag_s)

    # Add useful heading terms as compact fallback topics.
    for token in TOKEN_RE.findall(titles):
        t = token.casefold().strip("-_/.")
        if len(t) >= 4 and t not in TOPIC_STOPWORDS and not t.isdigit():
            labels.append(t)

    return unique_preserving(labels)[:24]


# ---------------------------------------------------------------------------
# Build evidence fragments / documents
# ---------------------------------------------------------------------------

def root_heading(path: list[str]) -> str:
    if not path:
        return "Repository evidence"
    return strip_numbering(path[0]) or path[0]


def infer_semantic_area(fragment: EvidenceFragment) -> str:
    """Map repository analysis fragments into stable employer-query evidence areas."""
    b = fragment.block
    text = " ".join(b.section_path) + " " + b.section_title
    low = strip_numbering(text).casefold()
    cats = set(b.canonical_categories)

    if fragment.retrieval_class == "limitation":
        return "limitations_risks"
    if fragment.retrieval_class == "chronology":
        return "chronology_growth"

    # Access-control/security must outrank generic architecture so an
    # authorization question does not collapse into every architecture section.
    if re.search(r"\b(?:authori[sz]|authenticat|identity|iam|rbac|permission|role|access control|session|security|privacy|trust boundary)\b", low):
        return "identity_access_security"
    if "security_privacy" in cats:
        return "identity_access_security"

    if re.search(r"\b(?:test|testing|verification|quality gate|coverage|e2e|unit test|integration test|reliability|defensive)\b", low):
        return "testing_quality"
    if "testing" in cats:
        return "testing_quality"

    if re.search(r"\b(?:deploy|deployment|ci/cd|pipeline|devops|infrastructure|observability|cloud|container|hosting|operations?)\b", low):
        return "deployment_operations"
    if "deployment_cicd" in cats:
        return "deployment_operations"

    if re.search(r"\b(?:architecture|api|backend|database|data-flow|data flow|service boundary|distributed|frontend architecture|system design)\b", low):
        return "architecture_system_design"
    if "architecture" in cats:
        return "architecture_system_design"

    if re.search(r"\b(?:skill|implementation|technical scope|algorithm|frontend|backend|embedded|wireless|machine learning|ml|data processing|programming)\b", low):
        return "implementation_skills"
    if cats & {"skills", "technical_scope", "strengths"}:
        return "implementation_skills"

    if re.search(r"\b(?:origin|contribution|attribution|authorship|provenance|inspection method|evidence basis|evidence vs|inference)\b", low):
        return "authorship_provenance"
    if cats & {"authorship_attribution", "evidence_inference"}:
        return "authorship_provenance"

    if re.search(r"\b(?:responsibility|ownership|stakeholder|product|business|domain|operator workflow|user workflow)\b", low):
        return "product_responsibility"
    if cats & {"responsibility", "business_domain", "portfolio_weight", "career_signal"}:
        return "product_responsibility"

    if re.search(r"\b(?:performance|resource|efficiency|scale|complexity|latency|throughput)\b", low):
        return "performance_scale"
    if "scale" in cats:
        return "performance_scale"

    if re.search(r"\b(?:engineering judgment|tradeoff|trade-off|decision|lesson|maintainability|modularity|production evolution)\b", low):
        return "engineering_judgment"
    if cats & {"engineering_judgment", "engineering_decisions"}:
        return "engineering_judgment"

    if re.search(r"\b(?:maturity|readiness|potential|evaluation matrix)\b", low):
        return "maturity_readiness"
    if "maturity" in cats:
        return "maturity_readiness"

    if re.search(r"\b(?:human impact|dignity|misuse|safety|ethical)\b", low):
        return "human_impact"
    if "human_impact" in cats:
        return "human_impact"

    if fragment.retrieval_class == "metadata" or cats & METADATA_CATEGORIES:
        return "metadata_documentation"
    return "other_repository_evidence"


def should_suppress_block(
    block: SourceBlock,
    fp_counts: Counter[str],
    template_threshold: int,
) -> tuple[bool, str | None]:
    # These are intentionally generated analytical/retrieval scaffolds. Their
    # underlying claims are already represented by direct source sections and
    # structured Step 1 metadata, so embedding them would multiply the same
    # language and bias retrieval. They remain fully preserved in Step 1.
    path_low = " > ".join(strip_numbering(p).casefold() for p in block.section_path)
    if any(term in path_low for term in SYNTHETIC_SCAFFOLD_TITLE_TERMS):
        return True, "synthetic-analysis-scaffold"
    stripped = block.text.strip()
    if re.fullmatch(r"(?:---+|___+|\*\*\*+)", stripped):
        return True, "markdown-separator"
    if not block.fingerprint:
        return False, None
    if known_template_match(block.text):
        return True, "known-template-language"
    freq = fp_counts.get(block.fingerprint, 0)
    if block.word_count >= TEMPLATE_MIN_WORDS and freq >= template_threshold:
        return True, f"repeated-in-{freq}-repositories"
    # Pure Markdown table headers carry schema, not evidence.
    stripped = block.text.strip()
    if re.fullmatch(r"\|?\s*(?:field|metric|dimension|question|category|signal|evidence question)(?:\s*\|[^\n|]+)+\|?", stripped, flags=re.IGNORECASE):
        return True, "generic-table-header"
    return False, None


def build_fragments_for_repo(
    record: dict[str, Any],
    blocks: list[SourceBlock],
    fp_counts: Counter[str],
    title_counts: Counter[str],
    template_threshold: int,
    generic_title_threshold: int,
) -> tuple[list[EvidenceFragment], list[dict[str, Any]], dict[str, int]]:
    fragments: list[EvidenceFragment] = []
    excluded: list[dict[str, Any]] = []
    stats = Counter()

    for block in blocks:
        suppress, reason = should_suppress_block(block, fp_counts, template_threshold)
        title_key = strip_numbering(block.section_title).casefold()
        retrieval_class = classify_retrieval_class(block.section_title, block.canonical_categories)
        polarity = classify_polarity(block.text, retrieval_class, block.section_title)
        concrete_hits = concrete_signal_count(block.text, record)
        evidence_level, specificity = classify_evidence_level(
            block.text, retrieval_class, polarity, concrete_hits,
            block.related_skill_ratings, suppress
        )
        generic_title = title_counts.get(title_key, 0) >= generic_title_threshold

        # Repeated blocks are excluded from embedding payload, but recorded with
        # provenance so the transformation remains auditable.
        if suppress:
            stats["template_blocks_suppressed"] += 1
            excluded.append({
                "repository_index": int(record["repository_index"]),
                "repository_name": record["repository_name"],
                "block_id": block.block_id,
                "section_id": block.section_id,
                "section_title": block.section_title,
                "section_path": block.section_path,
                "reason": reason,
                "template_repository_frequency": fp_counts.get(block.fingerprint, 0),
                "word_count": block.word_count,
                "source": {
                    "file": record["source"]["file"],
                    "line_start": block.source_line_start,
                    "line_end": block.source_line_end,
                },
                "text_sha256": sha256_text(block.text),
            })
            continue

        # Very short, low-specificity blocks under highly repeated headings are
        # usually labels/scaffolding. Concrete short evidence is explicitly kept.
        if block.word_count < 16 and generic_title and concrete_hits == 0 and not block.related_skill_ratings:
            stats["tiny_generic_blocks_suppressed"] += 1
            excluded.append({
                "repository_index": int(record["repository_index"]),
                "repository_name": record["repository_name"],
                "block_id": block.block_id,
                "section_id": block.section_id,
                "section_title": block.section_title,
                "section_path": block.section_path,
                "reason": "tiny-generic-low-specificity",
                "template_repository_frequency": fp_counts.get(block.fingerprint, 0),
                "word_count": block.word_count,
                "source": {
                    "file": record["source"]["file"],
                    "line_start": block.source_line_start,
                    "line_end": block.source_line_end,
                },
                "text_sha256": sha256_text(block.text),
            })
            continue

        # A generic heading lowers specificity, but does not erase repository-
        # specific content. This is intentionally soft.
        if generic_title and concrete_hits <= 1:
            specificity = max(0.12, specificity - 0.10)
            if evidence_level == "interpretive":
                evidence_level = "methodology_or_interpretive"

        fragments.append(EvidenceFragment(
            block=block,
            retrieval_class=retrieval_class,
            polarity=polarity,
            evidence_level=evidence_level,
            specificity_score=round(float(specificity), 4),
            concrete_hits=concrete_hits,
            template_repo_frequency=fp_counts.get(block.fingerprint, 0),
        ))
        stats["retained_blocks"] += 1

    return fragments, excluded, dict(stats)


def make_source_fragment(record: dict[str, Any], fragment: EvidenceFragment) -> dict[str, Any]:
    b = fragment.block
    return {
        "block_id": b.block_id,
        "unit_id": b.unit_id,
        "section_id": b.section_id,
        "section_title": b.section_title,
        "section_path": b.section_path,
        "canonical_categories": b.canonical_categories,
        "text": b.text,
        "word_count": b.word_count,
        "text_sha256": sha256_text(b.text),
        "source_file": record["source"]["file"],
        "source_line_start": b.source_line_start,
        "source_line_end": b.source_line_end,
        "template_repository_frequency": fragment.template_repo_frequency,
        "specificity_score": fragment.specificity_score,
        "concrete_hits": fragment.concrete_hits,
        "evidence_level": fragment.evidence_level,
    }


def assemble_authoritative_text(fragments: list[EvidenceFragment]) -> str:
    """Use source text only; add section labels solely as structural delimiters."""
    parts: list[str] = []
    last_path: tuple[str, ...] | None = None
    for fragment in fragments:
        path = tuple(fragment.block.section_path)
        if path != last_path:
            parts.append(f"[Section: {' > '.join(path)}]")
            last_path = path
        parts.append(fragment.block.text.strip())
    return "\n\n".join(p for p in parts if p).strip()


def document_embedding_text(
    record: dict[str, Any],
    retrieval_class: str,
    polarity: str,
    evidence_level: str,
    semantic_area: str,
    topics: list[str],
    fragments: list[EvidenceFragment],
    text: str,
) -> str:
    roots = unique_preserving(root_heading(f.block.section_path) for f in fragments)
    lines = [
        f"Repository: {record['repository_name']}",
        f"Repository index: {int(record['repository_index']):03d}",
        f"Evidence class: {retrieval_class}",
        f"Evidence polarity: {polarity}",
        f"Evidence level: {evidence_level}",
        f"Semantic area: {semantic_area}",
    ]
    if roots:
        lines.append(f"Source sections: {', '.join(roots)}")
    if topics:
        lines.append(f"Topics: {', '.join(topics)}")
    classification = record.get("classification_summary") or {}
    technical_realm = str(classification.get("technical_realm") or "").strip()
    if technical_realm:
        lines.append(f"Repository technical realm: {technical_realm}")
    lines.extend(["", "Repository evidence:", text])
    return "\n".join(lines).strip()


def strongest_evidence_level(fragments: list[EvidenceFragment]) -> str:
    priority = {
        "implemented_or_concrete": 6,
        "repository_specific": 5,
        "repository_limitation": 4,
        "interpretive": 3,
        "methodology_or_interpretive": 2,
        "conceptual_exposure": 1,
        "methodology_template": 0,
    }
    values = [f.evidence_level for f in fragments]
    return max(values, key=lambda v: priority.get(v, -1)) if values else "interpretive"


def _make_document(
    record: dict[str, Any],
    fragments: list[EvidenceFragment],
    semantic_area: str,
) -> dict[str, Any] | None:
    if not fragments:
        return None
    retrieval_class = fragments[0].retrieval_class
    polarities = {f.polarity for f in fragments}
    if len(polarities) == 1:
        polarity = next(iter(polarities))
    elif "positive" in polarities and "negative" in polarities:
        polarity = "mixed"
    elif "negative" in polarities:
        polarity = "negative"
    elif "positive" in polarities:
        polarity = "positive"
    else:
        polarity = "neutral"

    level = strongest_evidence_level(fragments)
    text = assemble_authoritative_text(fragments)
    denom = sum(max(1, f.block.word_count) for f in fragments)
    specificity = sum(f.specificity_score * max(1, f.block.word_count) for f in fragments) / denom
    concrete_hits = sum(f.concrete_hits for f in fragments)
    topics = topic_labels_for_document(record, fragments)
    roots = unique_preserving(root_heading(f.block.section_path) for f in fragments)
    wc = word_count(text)

    # Keep concise concrete evidence, but discard tiny method/interpretation
    # shards that have no standalone retrieval value.
    if wc < 26 and concrete_hits == 0 and specificity < 0.40 and retrieval_class != "limitation":
        return None

    related_skills = []
    for f in fragments:
        related_skills.extend(f.block.related_skill_ratings)
    seen_skill = set()
    dedup_skills = []
    for skill in related_skills:
        key = (
            str(skill.get("skill", "")).casefold(),
            str(skill.get("source_section_id", "")),
            str(skill.get("rating_5", "")),
        )
        if key not in seen_skill:
            seen_skill.add(key)
            dedup_skills.append(skill)

    embedding_text = document_embedding_text(
        record, retrieval_class, polarity, level, semantic_area, topics, fragments, text
    )
    earliest_line = min(f.block.source_line_start for f in fragments)
    return {
        "document_schema_version": SCHEMA_VERSION,
        "document_id": "PENDING",
        "repository_index": int(record["repository_index"]),
        "repository_total": int(record["repository_total"]),
        "repository_name": record["repository_name"],
        "repository_slug": record.get("repository_slug"),
        "repository_url": record.get("repository_url"),
        "retrieval_class": retrieval_class,
        "semantic_area": semantic_area,
        "evidence_polarity": polarity,
        "evidence_level": level,
        "specificity_score": round(float(specificity), 4),
        "concrete_signal_count": concrete_hits,
        "evidence_areas": roots,
        "topics": topics,
        "related_skill_ratings": dedup_skills,
        "chronology_summary": record.get("chronology_summary", {}),
        "classification_summary": record.get("classification_summary", {}),
        "text": text,
        "embedding_text": embedding_text,
        "word_count": wc,
        "embedding_word_count": word_count(embedding_text),
        "source_fragments": [make_source_fragment(record, f) for f in fragments],
        "provenance": {
            "normalized_input": "rag-corpus/repositories.jsonl",
            "analysis_source_file": record["source"]["file"],
            "repository_source_line_start": int(record["source"]["line_start"]),
            "repository_source_line_end": int(record["source"]["line_end"]),
            "repository_raw_sha256": record["source"]["sha256"],
            "document_text_sha256": sha256_text(text),
            "embedding_text_sha256": sha256_text(embedding_text),
            "earliest_source_line": earliest_line,
        },
    }


def group_fragments_into_documents(record: dict[str, Any], fragments: list[EvidenceFragment]) -> list[dict[str, Any]]:
    """
    Compile topic-coherent retrieval documents across the whole repository.

    Unlike v1, Markdown root headings are not treated as retrieval boundaries.
    Blocks are grouped by evidence purpose + stable semantic area, then packed
    to a coherent target size. This intentionally joins small table/list shards
    that describe the same engineering concept while preserving each fragment's
    exact line provenance.
    """
    groups: dict[tuple[str, str], list[EvidenceFragment]] = defaultdict(list)
    for fragment in fragments:
        area = infer_semantic_area(fragment)
        groups[(fragment.retrieval_class, area)].append(fragment)

    docs: list[dict[str, Any]] = []
    for (retrieval_class, area), group in groups.items():
        group = sorted(group, key=lambda f: (f.block.source_line_start, f.block.source_line_end, f.block.block_id))
        current: list[EvidenceFragment] = []
        current_words = 0
        for fragment in group:
            fw = fragment.block.word_count + 5
            if current and current_words + fw > HARD_MAX_WORDS:
                doc = _make_document(record, current, area)
                if doc is not None:
                    docs.append(doc)
                current = []
                current_words = 0
            current.append(fragment)
            current_words += fw
            if current_words >= TARGET_WORDS:
                doc = _make_document(record, current, area)
                if doc is not None:
                    docs.append(doc)
                current = []
                current_words = 0
        if current:
            doc = _make_document(record, current, area)
            if doc is not None:
                docs.append(doc)

    # Preserve deterministic chronological/source order for inspectability,
    # while each document itself remains topically coherent.
    docs.sort(key=lambda d: (
        int(d["provenance"].get("earliest_source_line", 10**9)),
        d["retrieval_class"], d.get("semantic_area", "")
    ))
    for n, doc in enumerate(docs, start=1):
        doc["document_id"] = f"repo-{int(record['repository_index']):03d}-rd{n:03d}"
    return docs

def ensure_repository_fallback(record: dict[str, Any], docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Guarantee every repository remains retrievable even if it is mostly template text."""
    if docs:
        return docs
    idx = int(record["repository_index"])
    classification = record.get("classification_summary") or {}
    metadata = record.get("metadata") or {}
    fields = [
        f"Repository: {record['repository_name']}",
        f"Technical realm: {classification.get('technical_realm', 'Unknown')}",
        f"Business realm: {classification.get('business_realm', 'Unknown')}",
        f"Maturity: {classification.get('maturity', 'Unknown')}",
        f"Portfolio evidence weight: {classification.get('portfolio_evidence_weight', 'Unknown')}",
        f"Strongest skill evidence: {metadata.get('strongest_skill_evidence', 'Not established')}",
        f"Main limiting factor: {metadata.get('main_limiting_factor', 'Not established')}",
        f"Historical significance: {metadata.get('historical_significance', 'Not established')}",
    ]
    text = "\n".join(fields)
    return [{
        "document_schema_version": SCHEMA_VERSION,
        "document_id": f"repo-{idx:03d}-rd001",
        "repository_index": idx,
        "repository_total": int(record["repository_total"]),
        "repository_name": record["repository_name"],
        "repository_slug": record.get("repository_slug"),
        "repository_url": record.get("repository_url"),
        "retrieval_class": "metadata",
        "evidence_polarity": "neutral",
        "evidence_level": "repository_specific",
        "specificity_score": 0.45,
        "concrete_signal_count": 0,
        "evidence_areas": ["Repository evidence ceiling"],
        "topics": unique_preserving(record.get("retrieval_tags", []) or [])[:12],
        "related_skill_ratings": [],
        "chronology_summary": record.get("chronology_summary", {}),
        "classification_summary": classification,
        "text": text,
        "embedding_text": text,
        "word_count": word_count(text),
        "embedding_word_count": word_count(text),
        "source_fragments": [],
        "provenance": {
            "normalized_input": "rag-corpus/repositories.jsonl",
            "analysis_source_file": record["source"]["file"],
            "repository_source_line_start": int(record["source"]["line_start"]),
            "repository_source_line_end": int(record["source"]["line_end"]),
            "repository_raw_sha256": record["source"]["sha256"],
            "document_text_sha256": sha256_text(text),
            "embedding_text_sha256": sha256_text(text),
            "fallback_from_step1_metadata": True,
        },
    }]


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_documents(
    records: list[dict[str, Any]],
    docs: list[dict[str, Any]],
    excluded: list[dict[str, Any]],
) -> dict[str, Any]:
    if not docs:
        raise PipelineError("No retrieval documents were generated.")
    ids = [d["document_id"] for d in docs]
    if len(ids) != len(set(ids)):
        dup = [x for x, n in Counter(ids).items() if n > 1]
        raise PipelineError(f"Duplicate document IDs: {dup[:20]}")

    record_by_idx = {int(r["repository_index"]): r for r in records}
    repo_counts = Counter(int(d["repository_index"]) for d in docs)
    missing_repos = sorted(set(record_by_idx) - set(repo_counts))
    if missing_repos:
        raise PipelineError(f"Retrieval-document repository coverage failed: {missing_repos}")

    class_counts = Counter()
    polarity_counts = Counter()
    level_counts = Counter()
    word_counts: list[int] = []
    embedding_counts: list[int] = []
    fallback_count = 0

    for d in docs:
        idx = int(d["repository_index"])
        if idx not in record_by_idx:
            raise PipelineError(f"Document {d['document_id']} references unknown repo {idx}.")
        record = record_by_idx[idx]
        raw = record["raw_analysis"]
        if sha256_text(raw) != record["source"]["sha256"]:
            raise PipelineError(f"Repo {idx:03d}: source changed during Step 2 v2.")
        if not str(d.get("text", "")).strip() or not str(d.get("embedding_text", "")).strip():
            raise PipelineError(f"Document {d['document_id']} has empty text/embedding_text.")
        if sha256_text(d["text"]) != d["provenance"]["document_text_sha256"]:
            raise PipelineError(f"Document {d['document_id']} text hash mismatch.")
        if sha256_text(d["embedding_text"]) != d["provenance"]["embedding_text_sha256"]:
            raise PipelineError(f"Document {d['document_id']} embedding hash mismatch.")
        if int(d["word_count"]) != word_count(d["text"]):
            raise PipelineError(f"Document {d['document_id']} word_count mismatch.")
        if int(d["embedding_word_count"]) != word_count(d["embedding_text"]):
            raise PipelineError(f"Document {d['document_id']} embedding_word_count mismatch.")
        if d["word_count"] > DOCUMENT_MAX_WORDS:
            raise PipelineError(
                f"Document {d['document_id']} unexpectedly large: {d['word_count']} words "
                f"> {DOCUMENT_MAX_WORDS}."
            )

        # Every source fragment must reproduce the exact text at its claimed
        # source lines/chars semantically; exact text is also verified to occur
        # inside the repository raw_analysis.
        for sf in d.get("source_fragments", []) or []:
            text = sf["text"]
            if sha256_text(text) != sf["text_sha256"]:
                raise PipelineError(f"Document {d['document_id']} fragment hash mismatch.")
            if text not in raw:
                raise PipelineError(
                    f"Document {d['document_id']} fragment {sf['block_id']} not found in raw_analysis."
                )
            sl = int(sf["source_line_start"])
            el = int(sf["source_line_end"])
            if sl < int(record["source"]["line_start"]) or el > int(record["source"]["line_end"]) or sl > el:
                raise PipelineError(
                    f"Document {d['document_id']} fragment source-line range invalid: {sl}-{el}."
                )

        class_counts[str(d["retrieval_class"])] += 1
        polarity_counts[str(d["evidence_polarity"])] += 1
        level_counts[str(d["evidence_level"])] += 1
        word_counts.append(int(d["word_count"]))
        embedding_counts.append(int(d["embedding_word_count"]))
        fallback_count += int(bool(d["provenance"].get("fallback_from_step1_metadata")))

    # Excluded records must remain traceable to a known repository and source.
    for ex in excluded:
        idx = int(ex["repository_index"])
        if idx not in record_by_idx:
            raise PipelineError(f"Excluded block references unknown repo {idx}.")

    # Avoid a silent return to the old one-section-one-vector shape. This check
    # is intentionally broad, not a magic target: v2 should materially reduce
    # the original 11,642 retrieval units.
    if len(docs) >= 10000:
        raise PipelineError(
            f"v2 produced {len(docs)} documents, too close to the old fragmented corpus; "
            "evidence-aware grouping is not functioning as intended."
        )

    return {
        "repositories_covered": len(repo_counts),
        "repository_total": len(record_by_idx),
        "documents": len(docs),
        "documents_by_class": dict(sorted(class_counts.items())),
        "documents_by_polarity": dict(sorted(polarity_counts.items())),
        "documents_by_evidence_level": dict(sorted(level_counts.items())),
        "document_words_min": min(word_counts),
        "document_words_median": int(median(word_counts)),
        "document_words_max": max(word_counts),
        "embedding_words_min": min(embedding_counts),
        "embedding_words_median": int(median(embedding_counts)),
        "embedding_words_max": max(embedding_counts),
        "excluded_blocks": len(excluded),
        "fallback_documents": fallback_count,
    }


# ---------------------------------------------------------------------------
# Atomic output publication
# ---------------------------------------------------------------------------

def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> int:
    count = 0
    with path.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(stable_json(row) + "\n")
            count += 1
    return count


def build_catalog(docs: list[dict[str, Any]]) -> dict[str, Any]:
    repos: dict[int, dict[str, Any]] = {}
    for d in docs:
        idx = int(d["repository_index"])
        entry = repos.setdefault(idx, {
            "repository_index": idx,
            "repository_name": d["repository_name"],
            "repository_url": d.get("repository_url"),
            "document_count": 0,
            "document_ids": [],
            "retrieval_classes": Counter(),
            "evidence_levels": Counter(),
        })
        entry["document_count"] += 1
        entry["document_ids"].append(d["document_id"])
        entry["retrieval_classes"][d["retrieval_class"]] += 1
        entry["evidence_levels"][d["evidence_level"]] += 1
    out = []
    for idx in sorted(repos):
        e = repos[idx]
        e["retrieval_classes"] = dict(sorted(e["retrieval_classes"].items()))
        e["evidence_levels"] = dict(sorted(e["evidence_levels"].items()))
        out.append(e)
    return {"schema_version": SCHEMA_VERSION, "repositories": out}


def validation_report_text(stats: dict[str, Any], build_stats: dict[str, Any], manifest: dict[str, Any]) -> str:
    lines = [
        "Portfolio GitHub RAG pipeline — Step 2 v2 validation report",
        "=" * 72,
        "",
        "STATUS: SUCCESS",
        "",
        "INPUT",
        "  rag-corpus/repositories.jsonl",
        "",
        "OUTPUT",
        "  rag-corpus/retrieval-documents-v2/documents.jsonl",
        "  rag-corpus/retrieval-documents-v2/document-catalog.json",
        "  rag-corpus/retrieval-documents-v2/document-manifest.json",
        "  rag-corpus/retrieval-documents-v2/excluded-source-units.jsonl",
        "  rag-corpus/retrieval-documents-v2/by-repository/",
        "",
        f"Repositories covered:             {stats['repositories_covered']}/{stats['repository_total']}",
        f"Retrieval documents generated:    {stats['documents']}",
        f"Source blocks examined:            {build_stats['source_blocks_total']}",
        f"Repeated/template blocks removed: {build_stats['template_blocks_suppressed']}",
        f"Tiny generic blocks removed:       {build_stats['tiny_generic_blocks_suppressed']}",
        f"Retained evidence blocks:          {build_stats['retained_blocks']}",
        f"Fallback metadata documents:       {stats['fallback_documents']}",
        "",
        "DOCUMENT WORDS",
        f"  min / median / max: {stats['document_words_min']} / {stats['document_words_median']} / {stats['document_words_max']}",
        "",
        "DOCUMENTS BY CLASS",
    ]
    for k, v in stats["documents_by_class"].items():
        lines.append(f"  {k}: {v}")
    lines.extend(["", "DOCUMENTS BY POLARITY"])
    for k, v in stats["documents_by_polarity"].items():
        lines.append(f"  {k}: {v}")
    lines.extend(["", "DOCUMENTS BY EVIDENCE LEVEL"])
    for k, v in stats["documents_by_evidence_level"].items():
        lines.append(f"  {k}: {v}")
    lines.extend([
        "",
        "INTEGRITY",
        "  Step 1 repository SHA-256 values verified: YES",
        "  134/134 repository coverage verified: YES",
        "  Source-fragment text hashes verified: YES",
        "  Source-fragment provenance bounds verified: YES",
        "  Duplicate document IDs: 0",
        "  Step 1 canonical corpus modified: NO",
        "",
        "NEXT PIPELINE INPUT",
        "  rag-corpus/retrieval-documents-v2/documents.jsonl",
        "",
        "STEP 3 v2 RULE",
        "  Embed `embedding_text`; retain `text` + `source_fragments` for evidence/citations.",
        "  Do NOT reuse old rag-corpus/chunks/chunks.jsonl.",
        "",
        f"Manifest SHA-256 (after write): {manifest.get('manifest_sha256_placeholder', 'recorded in manifest file hash externally')}",
    ])
    return "\n".join(lines).rstrip() + "\n"


def publish_outputs(
    records: list[dict[str, Any]],
    docs: list[dict[str, Any]],
    excluded: list[dict[str, Any]],
    stats: dict[str, Any],
    build_stats: dict[str, Any],
    template_threshold: int,
    generic_title_threshold: int,
) -> dict[str, Any]:
    if TEMP_OUTPUT_DIR.exists():
        shutil.rmtree(TEMP_OUTPUT_DIR)
    TEMP_OUTPUT_DIR.mkdir(parents=True)
    by_repo_dir = TEMP_OUTPUT_DIR / BY_REPO_DIRNAME
    by_repo_dir.mkdir()

    documents_path = TEMP_OUTPUT_DIR / "documents.jsonl"
    excluded_path = TEMP_OUTPUT_DIR / "excluded-source-units.jsonl"
    catalog_path = TEMP_OUTPUT_DIR / "document-catalog.json"
    manifest_path = TEMP_OUTPUT_DIR / "document-manifest.json"
    report_path = TEMP_OUTPUT_DIR / "document-validation-report.txt"

    docs_sorted = sorted(docs, key=lambda d: (int(d["repository_index"]), d["document_id"]))
    if write_jsonl(documents_path, docs_sorted) != len(docs_sorted):
        raise PipelineError("Failed to write all retrieval documents.")
    write_jsonl(excluded_path, excluded)

    docs_by_repo: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for d in docs_sorted:
        docs_by_repo[int(d["repository_index"])].append(d)
    for idx in range(1, EXPECTED_REPOSITORY_TOTAL + 1):
        write_jsonl(by_repo_dir / f"repo-{idx:03d}.documents.jsonl", docs_by_repo[idx])

    catalog = build_catalog(docs_sorted)
    catalog_path.write_text(stable_json(catalog, pretty=True), encoding="utf-8")

    manifest: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "pipeline_step": "Step 2 v2",
        "pipeline_name": "evidence-aware retrieval-document compilation",
        "created_at_utc": utc_now_iso(),
        "script": SCRIPT_NAME,
        "input": {
            "path": "rag-corpus/repositories.jsonl",
            "sha256": sha256_file(INPUT_PATH),
            "bytes": INPUT_PATH.stat().st_size,
            "repository_count": len(records),
        },
        "policy": {
            "target_words": TARGET_WORDS,
            "soft_min_words": SOFT_MIN_WORDS,
            "hard_max_source_block_words": HARD_MAX_WORDS,
            "hard_max_document_words": DOCUMENT_MAX_WORDS,
            "template_repository_threshold": template_threshold,
            "generic_title_repository_threshold": generic_title_threshold,
            "template_detection": "cross-repository normalized source-block frequency + explicit recurring scaffold phrases",
            "template_handling": "excluded only from derived retrieval payload; Step 1 canonical source remains untouched",
            "grouping": "source blocks grouped repository-wide by retrieval class + stable semantic area, then packed to target size",
            "retrieval_classes": ["direct_evidence", "interpretation", "limitation", "chronology", "metadata"],
            "embedding_field": "embedding_text",
            "citation_fields": ["text", "source_fragments"],
        },
        "statistics": {**stats, **build_stats},
        "artifacts": {},
        "next_pipeline_input": "rag-corpus/retrieval-documents-v2/documents.jsonl",
    }

    # Write manifest once, then artifact hashes for all other files, then rewrite.
    manifest_path.write_text(stable_json(manifest, pretty=True), encoding="utf-8")
    report_path.write_text(validation_report_text(stats, build_stats, manifest), encoding="utf-8")

    artifact_paths = [documents_path, excluded_path, catalog_path, report_path]
    manifest["artifacts"] = {
        p.name: {"bytes": p.stat().st_size, "sha256": sha256_file(p)} for p in artifact_paths
    }
    manifest_path.write_text(stable_json(manifest, pretty=True), encoding="utf-8")

    # Re-read all primary artifacts before publication.
    reread_docs = load_jsonl(documents_path)
    if len(reread_docs) != len(docs_sorted):
        raise PipelineError("Temporary documents.jsonl re-read count mismatch.")
    reread_excluded = load_jsonl(excluded_path) if excluded else []
    if len(reread_excluded) != len(excluded):
        raise PipelineError("Temporary excluded-source-units.jsonl re-read count mismatch.")
    json.loads(catalog_path.read_text(encoding="utf-8"))
    reread_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if reread_manifest.get("statistics", {}).get("documents") != len(docs_sorted):
        raise PipelineError("Temporary manifest re-read validation failed.")
    if "STATUS: SUCCESS" not in report_path.read_text(encoding="utf-8"):
        raise PipelineError("Temporary validation report re-read validation failed.")

    # Atomic-ish directory swap preserving prior valid output if publication fails.
    backup = RAG_DIR / ".retrieval-documents-v2.previous"
    if backup.exists():
        shutil.rmtree(backup)
    try:
        if OUTPUT_DIR.exists():
            OUTPUT_DIR.rename(backup)
        TEMP_OUTPUT_DIR.rename(OUTPUT_DIR)
    except Exception:
        if not OUTPUT_DIR.exists() and backup.exists():
            backup.rename(OUTPUT_DIR)
        raise
    else:
        if backup.exists():
            shutil.rmtree(backup)

    return manifest


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def main() -> int:
    print("Portfolio GitHub RAG pipeline — Step 2 v2: evidence-aware retrieval-document compilation")
    print(f"Working directory: {BASE_DIR}")
    print()
    print("COST / EXECUTION")
    print("  Paid API:       NONE")
    print("  API key:        NOT REQUIRED")
    print("  Model training: NONE")
    print("  Network access: NONE")
    print("  Processing cost:$0")
    print()
    print("INPUT")
    print("  rag-corpus/repositories.jsonl")
    print()
    print("OUTPUT")
    print("  rag-corpus/retrieval-documents-v2/documents.jsonl")
    print("  rag-corpus/retrieval-documents-v2/document-catalog.json")
    print("  rag-corpus/retrieval-documents-v2/document-manifest.json")
    print("  rag-corpus/retrieval-documents-v2/document-validation-report.txt")
    print("  rag-corpus/retrieval-documents-v2/excluded-source-units.jsonl")
    print("  rag-corpus/retrieval-documents-v2/by-repository/repo-XXX.documents.jsonl")
    print()

    try:
        print("[1/10] Validate zero-argument invocation ... ", end="", flush=True)
        if len(sys.argv) != 1:
            raise PipelineError(f"{SCRIPT_NAME} accepts no command-line arguments.")
        print("SUCCESS")

        print("[2/10] Locate Step 1 normalized input ... ", end="", flush=True)
        if not INPUT_PATH.is_file():
            raise PipelineError(f"Missing input: {INPUT_PATH.relative_to(BASE_DIR)}")
        print(f"SUCCESS ({INPUT_PATH.stat().st_size:,} bytes)")

        print("[3/10] Load and validate repository records ... ", end="", flush=True)
        records = load_jsonl(INPUT_PATH)
        total = validate_input_records(records)
        print(f"SUCCESS ({len(records)}/{total} repositories; source hashes valid)")

        print("[4/10] Reconstruct non-overlapping source sections ... ", end="", flush=True)
        units_by_repo: dict[int, list[AtomicUnit]] = {}
        unit_total = 0
        for record in records:
            idx = int(record["repository_index"])
            units = reconstruct_atomic_units(record)
            units_by_repo[idx] = units
            unit_total += len(units)
        print(f"SUCCESS ({unit_total:,} atomic source units)")

        print("[5/10] Analyze cross-repository template/scaffolding frequency ... ", end="", flush=True)
        blocks_by_repo, fp_counts, title_counts = compute_template_stats(records, units_by_repo)
        source_blocks_total = sum(len(v) for v in blocks_by_repo.values())
        template_threshold = max(TEMPLATE_REPO_MIN, math.ceil(total * TEMPLATE_REPO_FRACTION))
        generic_title_threshold = max(12, math.ceil(total * GENERIC_TITLE_REPO_FRACTION))
        repeated_fingerprints = sum(1 for n in fp_counts.values() if n >= template_threshold)
        print(
            f"SUCCESS ({source_blocks_total:,} blocks; template threshold {template_threshold} repos; "
            f"{repeated_fingerprints:,} repeated fingerprints)"
        )

        print("[6/10] Classify and suppress retrieval-noise blocks ... ", end="", flush=True)
        records_by_idx = {int(r["repository_index"]): r for r in records}
        fragments_by_repo: dict[int, list[EvidenceFragment]] = {}
        excluded_all: list[dict[str, Any]] = []
        build_stats = Counter({"source_blocks_total": source_blocks_total})
        for idx in range(1, total + 1):
            fragments, excluded, local_stats = build_fragments_for_repo(
                records_by_idx[idx], blocks_by_repo[idx], fp_counts, title_counts,
                template_threshold, generic_title_threshold
            )
            fragments_by_repo[idx] = fragments
            excluded_all.extend(excluded)
            build_stats.update(local_stats)
        print(
            f"SUCCESS (retained {build_stats['retained_blocks']:,}; "
            f"template {build_stats['template_blocks_suppressed']:,} removed; "
            f"tiny generic {build_stats['tiny_generic_blocks_suppressed']:,} removed)"
        )

        print("[7/10] Compile coherent evidence-aware retrieval documents ... ", end="", flush=True)
        docs_all: list[dict[str, Any]] = []
        fallback_count = 0
        for idx in range(1, total + 1):
            record = records_by_idx[idx]
            docs = group_fragments_into_documents(record, fragments_by_repo[idx])
            before = len(docs)
            docs = ensure_repository_fallback(record, docs)
            if before == 0 and docs:
                fallback_count += 1
            # IDs were assigned per repo; ensure sequential IDs after potential
            # suppressed tiny groups by renumbering deterministically.
            for n, doc in enumerate(docs, start=1):
                doc["document_id"] = f"repo-{idx:03d}-rd{n:03d}"
            docs_all.extend(docs)
        build_stats["fallback_repositories"] = fallback_count
        print(f"SUCCESS ({len(docs_all):,} retrieval documents; fallback repos {fallback_count})")

        print("[8/10] Validate document integrity, provenance, and 134/134 coverage ... ", end="", flush=True)
        stats = validate_documents(records, docs_all, excluded_all)
        print(
            f"SUCCESS ({stats['repositories_covered']}/{stats['repository_total']} repositories; "
            f"words {stats['document_words_min']}/{stats['document_words_median']}/{stats['document_words_max']} min/median/max)"
        )

        print("[9/10] Write and re-read temporary output artifacts ... ", end="", flush=True)
        manifest = publish_outputs(
            records, docs_all, excluded_all, stats, dict(build_stats),
            template_threshold, generic_title_threshold
        )
        print("SUCCESS")

        print("[10/10] Verify published artifacts and hashes ... ", end="", flush=True)
        primary = [
            OUTPUT_DIR / "documents.jsonl",
            OUTPUT_DIR / "document-catalog.json",
            OUTPUT_DIR / "document-manifest.json",
            OUTPUT_DIR / "document-validation-report.txt",
            OUTPUT_DIR / "excluded-source-units.jsonl",
        ]
        for path in primary:
            if not path.is_file():
                raise PipelineError(f"Published artifact missing: {path}")
        published_manifest = json.loads((OUTPUT_DIR / "document-manifest.json").read_text(encoding="utf-8"))
        for name, info in published_manifest["artifacts"].items():
            path = OUTPUT_DIR / name
            if sha256_file(path) != info["sha256"]:
                raise PipelineError(f"Published artifact hash mismatch: {name}")
        by_repo = OUTPUT_DIR / BY_REPO_DIRNAME
        repo_files = sorted(by_repo.glob("repo-*.documents.jsonl"))
        if len(repo_files) != total:
            raise PipelineError(f"Expected {total} per-repository files, found {len(repo_files)}.")
        print("SUCCESS")

        print()
        print("STEP 2 v2 COMPLETE: SUCCESS")
        print(f"Repositories processed:            {total}")
        print(f"Atomic source units:               {unit_total:,}")
        print(f"Source blocks examined:            {source_blocks_total:,}")
        print(f"Template blocks suppressed:        {build_stats['template_blocks_suppressed']:,}")
        print(f"Tiny generic blocks suppressed:    {build_stats['tiny_generic_blocks_suppressed']:,}")
        print(f"Retained evidence blocks:          {build_stats['retained_blocks']:,}")
        print(f"Retrieval documents generated:     {stats['documents']:,}")
        print(
            f"Document words min/median/max:    "
            f"{stats['document_words_min']}/{stats['document_words_median']}/{stats['document_words_max']}"
        )
        print(f"Fallback metadata documents:       {stats['fallback_documents']}")
        print("Validation failures:               0")
        print("Paid API requests:                 0")
        print("API keys required:                 0")
        print("Processing cost:                   $0")
        print()
        print("OUTPUT")
        print("  rag-corpus/retrieval-documents-v2/documents.jsonl")
        print("  rag-corpus/retrieval-documents-v2/document-catalog.json")
        print("  rag-corpus/retrieval-documents-v2/document-manifest.json")
        print("  rag-corpus/retrieval-documents-v2/document-validation-report.txt")
        print("  rag-corpus/retrieval-documents-v2/excluded-source-units.jsonl")
        print("  rag-corpus/retrieval-documents-v2/by-repository/")
        print()
        print("NEXT PIPELINE INPUT")
        print("  rag-corpus/retrieval-documents-v2/documents.jsonl")
        print()
        print("For Step 3 v2: embed `embedding_text`; retain `text` + `source_fragments` for citations.")
        print("Do NOT embed the old rag-corpus/chunks/chunks.jsonl.")
        return 0

    except KeyboardInterrupt:
        print("\nFAILED")
        print("\nSTEP 2 v2 COMPLETE: FAILED")
        print("Reason: interrupted by user. No partially validated output was published.")
        return 130
    except Exception as exc:
        print("FAILED")
        print("\nSTEP 2 v2 COMPLETE: FAILED")
        print(f"Reason: {exc}")
        return 1
    finally:
        # A failed run must not leave a misleading temporary publication tree.
        if TEMP_OUTPUT_DIR.exists():
            shutil.rmtree(TEMP_OUTPUT_DIR, ignore_errors=True)


if __name__ == "__main__":
    raise SystemExit(main())
