#!/usr/bin/env python3
"""
Build retrieval-ready semantic chunks from the normalized GitHub career corpus.

THIS IS PIPELINE STEP 2.

USAGE
-----
1. Place this script in the project root, beside the existing `rag-corpus/`
   directory produced by Step 1.

2. Run it with NO arguments:

       python build-rag-chunks.py

INPUT
-----
Exactly one required input file:

    rag-corpus/repositories.jsonl

This must be the normalized full-fidelity repository corpus produced by
`prepare-rag-corpus.py`. The original repository batch Markdown files are NOT
read or embedded by this script.

OUTPUT
------
A generated directory:

    rag-corpus/chunks/
      chunks.jsonl
      chunk-catalog.json
      chunk-manifest.json
      chunk-validation-report.txt
      by-repository/
        repo-001.chunks.jsonl
        ...
        repo-134.chunks.jsonl

The input file and all Step 1 outputs are never modified.

WHAT THIS STEP DOES
-------------------
- loads and validates all normalized repository records;
- reconstructs non-overlapping atomic Markdown sections from `raw_analysis`;
- avoids duplicating child-section text that is intentionally present in the
  hierarchical Step 1 `sections` representation;
- preserves repository, chronology, classification, tag, skill, section, and
  source provenance metadata on every chunk;
- keeps normal sections intact whenever practical;
- splits only oversized sections at semantic boundaries;
- adds a small previous-context prefix for embedding continuity without
  duplicating that prefix in the authoritative `text` field;
- verifies that chunk text reconstructs every non-empty source unit without
  losing words;
- writes outputs atomically only after all validations pass.

IMPORTANT FOR STEP 3
--------------------
The authoritative text to cite is `text`.
The recommended text to embed is `embedding_text`.
Do NOT embed `raw_analysis` or the original batch Markdown directly.

The script uses only the Python standard library and intentionally accepts no
command-line arguments.
"""

from __future__ import annotations

import bisect
import hashlib
import json
import re
import shutil
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


SCRIPT_NAME = Path(__file__).name
BASE_DIR = Path(__file__).resolve().parent
RAG_DIR = BASE_DIR / "rag-corpus"
INPUT_PATH = RAG_DIR / "repositories.jsonl"
OUTPUT_DIR = RAG_DIR / "chunks"
TEMP_OUTPUT_DIR = RAG_DIR / ".chunks.tmp"
BY_REPO_DIRNAME = "by-repository"

CHUNK_SCHEMA_VERSION = "1.0.0"
EXPECTED_INPUT_SCHEMA_MAJOR = "1"

# These are deliberately conservative for a later embedding stage. Most corpus
# sections are much smaller than this and therefore remain semantically intact.
TARGET_WORDS = 650
HARD_MAX_WORDS = 900
CONTEXT_OVERLAP_WORDS = 80

# Only headings below the top repository header are semantic section headings.
HEADING_RE = re.compile(r"^(?P<marks>#{2,6})\s+(?P<title>.+?)\s*$", re.MULTILINE)
WORD_RE = re.compile(r"\S+")
BLANK_BOUNDARY_RE = re.compile(r"\n[ \t]*\n+")
SENTENCE_BOUNDARY_RE = re.compile(r"(?<=[.!?])(?:[\"')\]]*)\s+(?=[A-Z0-9`*_(\[])" )


@dataclass(frozen=True)
class SourceUnit:
    """A unique, non-overlapping source-text unit inside one repository."""

    unit_id: str
    unit_type: str
    section_id: str | None
    level: int | None
    title: str
    path: list[str]
    text: str
    raw_char_start: int
    raw_char_end: int
    source_line_start: int
    source_line_end: int
    canonical_categories: list[str]
    related_skill_ratings: list[dict[str, Any]]


@dataclass(frozen=True)
class TextSpan:
    start: int
    end: int


class PipelineError(RuntimeError):
    pass


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def stable_json_dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def word_count(text: str) -> int:
    return sum(1 for _ in WORD_RE.finditer(text))


def line_at(raw: str, base_source_line: int, char_offset: int) -> int:
    """Map a character offset in raw_analysis to the original Markdown line."""
    char_offset = max(0, min(char_offset, len(raw)))
    return base_source_line + raw.count("\n", 0, char_offset)


def trimmed_span(text: str, start: int, end: int) -> tuple[int, int]:
    while start < end and text[start].isspace():
        start += 1
    while end > start and text[end - 1].isspace():
        end -= 1
    return start, end


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8-sig") as f:
        for line_number, line in enumerate(f, start=1):
            if not line.strip():
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as exc:
                raise PipelineError(
                    f"Invalid JSON on {path.relative_to(BASE_DIR)} line {line_number}: {exc}"
                ) from exc
            if not isinstance(value, dict):
                raise PipelineError(
                    f"Expected JSON object on line {line_number}, got {type(value).__name__}."
                )
            records.append(value)
    if not records:
        raise PipelineError(f"Input file is empty: {path.relative_to(BASE_DIR)}")
    return records


def validate_input_records(records: list[dict[str, Any]]) -> int:
    required = {
        "schema_version",
        "repository_index",
        "repository_total",
        "repository_name",
        "source",
        "chronology_summary",
        "classification_summary",
        "retrieval_tags",
        "skill_ratings",
        "canonical_sections",
        "sections",
        "raw_analysis",
    }

    indexes: list[int] = []
    totals: Counter[int] = Counter()
    names: set[str] = set()

    for i, record in enumerate(records, start=1):
        missing = sorted(required - set(record))
        if missing:
            raise PipelineError(f"Input record {i} is missing required fields: {missing}")

        schema = str(record.get("schema_version", ""))
        if schema.split(".", 1)[0] != EXPECTED_INPUT_SCHEMA_MAJOR:
            raise PipelineError(
                f"Repo {record.get('repository_index', '?')}: unsupported Step 1 schema "
                f"version {schema!r}; expected major version {EXPECTED_INPUT_SCHEMA_MAJOR}."
            )

        try:
            idx = int(record["repository_index"])
            total = int(record["repository_total"])
        except (TypeError, ValueError) as exc:
            raise PipelineError(f"Record {i} has invalid repository index/total.") from exc

        indexes.append(idx)
        totals[total] += 1

        name = str(record["repository_name"]).strip()
        if not name:
            raise PipelineError(f"Repo {idx:03d}: repository_name is empty.")
        names.add(name.casefold())

        raw = record["raw_analysis"]
        if not isinstance(raw, str) or not raw.strip():
            raise PipelineError(f"Repo {idx:03d}: raw_analysis is empty or not text.")

        source = record["source"]
        if not isinstance(source, dict):
            raise PipelineError(f"Repo {idx:03d}: source metadata is invalid.")
        for key in ("file", "line_start", "line_end", "sha256"):
            if key not in source:
                raise PipelineError(f"Repo {idx:03d}: source.{key} is missing.")

        if sha256_text(raw) != source["sha256"]:
            raise PipelineError(
                f"Repo {idx:03d}: raw_analysis SHA-256 does not match Step 1 provenance."
            )

    if len(indexes) != len(set(indexes)):
        duplicates = sorted(idx for idx, count in Counter(indexes).items() if count > 1)
        raise PipelineError(f"Duplicate repository indexes in input: {duplicates}")

    if len(totals) != 1:
        raise PipelineError(f"Conflicting repository_total values: {dict(totals)}")
    expected_total = next(iter(totals))

    expected = set(range(1, expected_total + 1))
    actual = set(indexes)
    missing = sorted(expected - actual)
    extra = sorted(actual - expected)
    if missing or extra:
        raise PipelineError(
            f"Repository coverage failed: missing={missing or 'none'}, extra={extra or 'none'}"
        )

    if len(records) != expected_total:
        raise PipelineError(
            f"Input contains {len(records)} records but headers declare {expected_total}."
        )

    return expected_total


def build_section_category_map(record: dict[str, Any]) -> dict[str, list[str]]:
    mapping: dict[str, list[str]] = defaultdict(list)
    canonical = record.get("canonical_sections") or {}
    if not isinstance(canonical, dict):
        return {}
    for category, data in canonical.items():
        if not isinstance(data, dict):
            continue
        for section_id in data.get("section_ids", []) or []:
            if category not in mapping[str(section_id)]:
                mapping[str(section_id)].append(str(category))
    return dict(mapping)


def build_skill_map(record: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    mapping: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for skill in record.get("skill_ratings", []) or []:
        if not isinstance(skill, dict):
            continue
        section_id = skill.get("source_section_id")
        if section_id:
            mapping[str(section_id)].append(skill)
    return dict(mapping)


def existing_section_lookup(record: dict[str, Any]) -> dict[tuple[int, str], dict[str, Any]]:
    lookup: dict[tuple[int, str], dict[str, Any]] = {}
    for section in record.get("sections", []) or []:
        if not isinstance(section, dict):
            continue
        try:
            line = int(section["source_line_start"])
        except (KeyError, TypeError, ValueError):
            continue
        title = str(section.get("title", "")).strip()
        lookup[(line, title)] = section
    return lookup


def reconstruct_source_units(record: dict[str, Any]) -> list[SourceUnit]:
    """
    Reparse raw_analysis into atomic sections.

    Step 1 intentionally stores hierarchical section text: a level-2 section can
    include its level-3 descendants. That is useful for normalized analysis but
    would duplicate text in an embedding index. Here every heading owns only the
    text until the very next heading, regardless of level.
    """

    raw = record["raw_analysis"]
    base_line = int(record["source"]["line_start"])
    matches = list(HEADING_RE.finditer(raw))

    expected_heading_count = len(record.get("sections", []) or [])
    if len(matches) != expected_heading_count:
        raise PipelineError(
            f"Repo {record['repository_index']:03d}: heading count mismatch between "
            f"raw_analysis ({len(matches)}) and Step 1 sections ({expected_heading_count})."
        )

    section_lookup = existing_section_lookup(record)
    category_map = build_section_category_map(record)
    skill_map = build_skill_map(record)
    units: list[SourceUnit] = []

    # Repository header is the first line. Intro is unique text before first ##.
    first_newline = raw.find("\n")
    body_start = first_newline + 1 if first_newline >= 0 else len(raw)
    intro_end = matches[0].start() if matches else len(raw)
    intro_start, intro_end = trimmed_span(raw, body_start, intro_end)
    if intro_start < intro_end:
        units.append(
            SourceUnit(
                unit_id="intro",
                unit_type="repository_intro",
                section_id=None,
                level=None,
                title="Repository introduction",
                path=["Repository introduction"],
                text=raw[intro_start:intro_end],
                raw_char_start=intro_start,
                raw_char_end=intro_end,
                source_line_start=line_at(raw, base_line, intro_start),
                source_line_end=line_at(raw, base_line, max(intro_start, intro_end - 1)),
                canonical_categories=["summary"],
                related_skill_ratings=[],
            )
        )

    # Build heading paths with a standard Markdown heading stack.
    stack: list[tuple[int, str]] = []
    for i, match in enumerate(matches):
        level = len(match.group("marks"))
        title = match.group("title").strip()
        heading_line = line_at(raw, base_line, match.start())

        while stack and stack[-1][0] >= level:
            stack.pop()
        path = [entry_title for _, entry_title in stack] + [title]
        stack.append((level, title))

        next_heading_start = matches[i + 1].start() if i + 1 < len(matches) else len(raw)
        start, end = trimmed_span(raw, match.end(), next_heading_start)
        if start >= end:
            continue

        existing = section_lookup.get((heading_line, title))
        if existing is None:
            raise PipelineError(
                f"Repo {record['repository_index']:03d}: could not map heading "
                f"{title!r} at source line {heading_line} back to Step 1 metadata."
            )
        section_id = str(existing["id"])

        units.append(
            SourceUnit(
                unit_id=section_id,
                unit_type="section",
                section_id=section_id,
                level=level,
                title=title,
                path=path,
                text=raw[start:end],
                raw_char_start=start,
                raw_char_end=end,
                source_line_start=line_at(raw, base_line, start),
                source_line_end=line_at(raw, base_line, max(start, end - 1)),
                canonical_categories=category_map.get(section_id, []),
                related_skill_ratings=skill_map.get(section_id, []),
            )
        )

    return units


def nth_word_end(text: str, start: int, n: int) -> int:
    if n <= 0:
        return start
    count = 0
    for match in WORD_RE.finditer(text, start):
        count += 1
        if count >= n:
            return match.end()
    return len(text)


def find_best_cut(text: str, start: int, target_end: int, max_end: int) -> int:
    """Choose a semantic cut <= max_end, biased toward target_end."""

    # Paragraph/blank-line boundaries are the strongest preferred cuts.
    para_boundaries = [
        match.end()
        for match in BLANK_BOUNDARY_RE.finditer(text, start, max_end)
        if match.end() > start
    ]
    if para_boundaries:
        pos = bisect.bisect_left(para_boundaries, target_end)
        candidates: list[int] = []
        if pos < len(para_boundaries):
            candidates.append(para_boundaries[pos])
        if pos > 0:
            candidates.append(para_boundaries[pos - 1])
        candidates = [c for c in candidates if c <= max_end]
        if candidates:
            return min(candidates, key=lambda c: abs(c - target_end))

    # Sentence endings are second-best.
    sentence_boundaries = [
        match.end()
        for match in SENTENCE_BOUNDARY_RE.finditer(text, start, max_end)
        if match.end() > start
    ]
    if sentence_boundaries:
        pos = bisect.bisect_left(sentence_boundaries, target_end)
        candidates = []
        if pos < len(sentence_boundaries):
            candidates.append(sentence_boundaries[pos])
        if pos > 0:
            candidates.append(sentence_boundaries[pos - 1])
        candidates = [c for c in candidates if c <= max_end]
        if candidates:
            return min(candidates, key=lambda c: abs(c - target_end))

    # A normal line boundary is better than splitting a Markdown line.
    line_before = text.rfind("\n", start + 1, max_end + 1)
    if line_before > start:
        return line_before + 1

    # Final hard fallback: nearest whitespace at/before the max word boundary.
    space_before = max(text.rfind(" ", start + 1, max_end + 1), text.rfind("\t", start + 1, max_end + 1))
    if space_before > start:
        return space_before + 1

    return max_end


def split_source_text(text: str) -> list[TextSpan]:
    """Partition text into exact, non-overlapping spans."""

    if not text:
        return []
    if word_count(text) <= HARD_MAX_WORDS:
        return [TextSpan(0, len(text))]

    spans: list[TextSpan] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        # Ignore boundary whitespace; it has no semantic content and validation
        # compares normalized whitespace, so no source words are discarded.
        while start < text_len and text[start].isspace():
            start += 1
        if start >= text_len:
            break

        remaining = text[start:]
        if word_count(remaining) <= HARD_MAX_WORDS:
            end = text_len
        else:
            target_end = nth_word_end(text, start, TARGET_WORDS)
            max_end = nth_word_end(text, start, HARD_MAX_WORDS)
            end = find_best_cut(text, start, target_end, max_end)
            if end <= start:
                end = max_end

            # Enforce the hard word cap even if a boundary function somehow
            # selected text beyond the intended word limit.
            if word_count(text[start:end]) > HARD_MAX_WORDS:
                end = max_end

        trimmed_start, trimmed_end = trimmed_span(text, start, end)
        if trimmed_start < trimmed_end:
            spans.append(TextSpan(trimmed_start, trimmed_end))
        start = end

    if not spans:
        raise PipelineError("Internal chunking error: non-empty text produced no spans.")

    # Extremely long tokens/URLs cannot be split by word count, but they still
    # count as one word. Every normal span must respect the hard cap.
    for span in spans:
        count = word_count(text[span.start:span.end])
        if count > HARD_MAX_WORDS:
            raise PipelineError(
                f"Internal chunking error: produced {count}-word span > {HARD_MAX_WORDS}."
            )

    return spans


def trailing_words(text: str, count: int) -> str:
    words = list(WORD_RE.finditer(text))
    if not words or count <= 0:
        return ""
    start_match = words[max(0, len(words) - count)]
    return text[start_match.start():].strip()


def choose_primary_category(categories: list[str]) -> str:
    priority = [
        "limitations",
        "authorship_attribution",
        "evidence_inference",
        "skills",
        "architecture",
        "security_privacy",
        "testing",
        "deployment_cicd",
        "engineering_decisions",
        "weaknesses_debt",
        "failure_modes",
        "maturity",
        "scale",
        "business_domain",
        "career_signal",
        "longitudinal",
        "technical_scope",
        "summary",
        "identity",
        "rag_metadata",
    ]
    category_set = set(categories)
    for item in priority:
        if item in category_set:
            return item
    return categories[0] if categories else "uncategorized"


def skill_names(skills: Iterable[dict[str, Any]]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for skill in skills:
        name = str(skill.get("skill", "")).strip()
        if name and name.casefold() not in seen:
            seen.add(name.casefold())
            result.append(name)
    return result


def make_embedding_text(
    record: dict[str, Any],
    unit: SourceUnit,
    primary_text: str,
    context_prefix: str,
) -> str:
    lines = [
        f"Repository: {record['repository_name']}",
        f"Repository index: {record['repository_index']:03d}",
        f"Section: {' > '.join(unit.path)}",
    ]
    if unit.canonical_categories:
        lines.append(f"Categories: {', '.join(unit.canonical_categories)}")
    names = skill_names(unit.related_skill_ratings)
    if names:
        lines.append(f"Related skills: {', '.join(names)}")
    if context_prefix:
        lines.extend(["", "Previous context:", context_prefix])
    lines.extend(["", "Evidence text:", primary_text])
    return "\n".join(lines).strip()


def build_chunks_for_record(record: dict[str, Any]) -> tuple[list[dict[str, Any]], list[SourceUnit]]:
    units = reconstruct_source_units(record)
    chunks: list[dict[str, Any]] = []
    base_line = int(record["source"]["line_start"])
    raw = record["raw_analysis"]

    for unit in units:
        spans = split_source_text(unit.text)
        previous_primary = ""

        for part_number, span in enumerate(spans, start=1):
            primary_text = unit.text[span.start:span.end]
            context_prefix = trailing_words(previous_primary, CONTEXT_OVERLAP_WORDS) if previous_primary else ""

            raw_start = unit.raw_char_start + span.start
            raw_end = unit.raw_char_start + span.end
            source_line_start = line_at(raw, base_line, raw_start)
            source_line_end = line_at(raw, base_line, max(raw_start, raw_end - 1))

            unit_token = "intro" if unit.section_id is None else unit.section_id
            chunk_id = (
                f"repo-{int(record['repository_index']):03d}-{unit_token}-p{part_number:02d}"
            )

            primary_category = choose_primary_category(unit.canonical_categories)
            chunk = {
                "chunk_schema_version": CHUNK_SCHEMA_VERSION,
                "chunk_id": chunk_id,
                "repository_index": int(record["repository_index"]),
                "repository_total": int(record["repository_total"]),
                "repository_name": record["repository_name"],
                "repository_slug": record.get("repository_slug"),
                "repository_url": record.get("repository_url"),
                "chunk_type": unit.unit_type,
                "primary_category": primary_category,
                "canonical_categories": unit.canonical_categories,
                "section": {
                    "id": unit.section_id,
                    "level": unit.level,
                    "title": unit.title,
                    "path": unit.path,
                    "part_number": part_number,
                    "part_count": len(spans),
                },
                "text": primary_text,
                "context_prefix": context_prefix or None,
                "embedding_text": make_embedding_text(
                    record=record,
                    unit=unit,
                    primary_text=primary_text,
                    context_prefix=context_prefix,
                ),
                "word_count": word_count(primary_text),
                "character_count": len(primary_text),
                "retrieval_tags": record.get("retrieval_tags", []),
                "related_skill_ratings": unit.related_skill_ratings,
                "chronology_summary": record.get("chronology_summary", {}),
                "classification_summary": record.get("classification_summary", {}),
                "provenance": {
                    "analysis_source_file": record["source"]["file"],
                    "analysis_source_line_start": source_line_start,
                    "analysis_source_line_end": source_line_end,
                    "repository_source_line_start": int(record["source"]["line_start"]),
                    "repository_source_line_end": int(record["source"]["line_end"]),
                    "repository_raw_sha256": record["source"]["sha256"],
                    "source_unit_sha256": sha256_text(unit.text),
                    "chunk_text_sha256": sha256_text(primary_text),
                    "normalized_input": "rag-corpus/repositories.jsonl",
                },
            }
            chunks.append(chunk)
            previous_primary = primary_text

    return chunks, units


def validate_unit_coverage(
    record: dict[str, Any],
    units: list[SourceUnit],
    chunks: list[dict[str, Any]],
) -> None:
    by_unit: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for chunk in chunks:
        section_id = chunk["section"]["id"]
        unit_token = "intro" if section_id is None else str(section_id)
        by_unit[unit_token].append(chunk)

    for unit in units:
        token = "intro" if unit.section_id is None else str(unit.section_id)
        unit_chunks = sorted(by_unit.get(token, []), key=lambda c: c["section"]["part_number"])
        if not unit_chunks:
            raise PipelineError(
                f"Repo {record['repository_index']:03d}, unit {token}: no chunks generated."
            )
        reconstructed = " ".join(chunk["text"] for chunk in unit_chunks)
        if normalize_whitespace(reconstructed) != normalize_whitespace(unit.text):
            raise PipelineError(
                f"Repo {record['repository_index']:03d}, unit {token}: chunk coverage "
                "does not reconstruct the source unit."
            )


def validate_all_chunks(
    records: list[dict[str, Any]],
    chunks: list[dict[str, Any]],
    units_by_repo: dict[int, list[SourceUnit]],
) -> dict[str, Any]:
    if not chunks:
        raise PipelineError("No chunks were generated.")

    ids = [chunk["chunk_id"] for chunk in chunks]
    if len(ids) != len(set(ids)):
        dupes = [cid for cid, count in Counter(ids).items() if count > 1]
        raise PipelineError(f"Duplicate chunk IDs generated: {dupes[:20]}")

    by_repo: dict[int, list[dict[str, Any]]] = defaultdict(list)
    oversized: list[str] = []
    empty: list[str] = []
    invalid_hash: list[str] = []

    for chunk in chunks:
        idx = int(chunk["repository_index"])
        by_repo[idx].append(chunk)
        if not str(chunk["text"]).strip():
            empty.append(chunk["chunk_id"])
        if int(chunk["word_count"]) > HARD_MAX_WORDS:
            oversized.append(chunk["chunk_id"])
        if sha256_text(chunk["text"]) != chunk["provenance"]["chunk_text_sha256"]:
            invalid_hash.append(chunk["chunk_id"])

    if empty:
        raise PipelineError(f"Empty chunks generated: {empty[:20]}")
    if oversized:
        raise PipelineError(
            f"Chunks exceed hard max {HARD_MAX_WORDS} words: {oversized[:20]}"
        )
    if invalid_hash:
        raise PipelineError(f"Chunk hash validation failed: {invalid_hash[:20]}")

    record_indexes = {int(record["repository_index"]) for record in records}
    chunk_indexes = set(by_repo)
    if record_indexes != chunk_indexes:
        raise PipelineError(
            f"Chunk repository coverage mismatch. Missing chunks for "
            f"{sorted(record_indexes - chunk_indexes)}; unexpected {sorted(chunk_indexes - record_indexes)}"
        )

    record_by_index = {int(record["repository_index"]): record for record in records}
    for idx in sorted(record_indexes):
        validate_unit_coverage(record_by_index[idx], units_by_repo[idx], by_repo[idx])

    word_counts = sorted(int(chunk["word_count"]) for chunk in chunks)
    split_units = sum(
        1
        for idx, units in units_by_repo.items()
        for unit in units
        if len(
            [
                c
                for c in by_repo[idx]
                if ("intro" if c["section"]["id"] is None else str(c["section"]["id"]))
                == ("intro" if unit.section_id is None else str(unit.section_id))
            ]
        )
        > 1
    )

    return {
        "repository_count": len(records),
        "chunk_count": len(chunks),
        "source_unit_count": sum(len(v) for v in units_by_repo.values()),
        "split_source_unit_count": split_units,
        "chunk_word_count_total": sum(word_counts),
        "chunk_word_count_min": word_counts[0],
        "chunk_word_count_median": word_counts[len(word_counts) // 2],
        "chunk_word_count_max": word_counts[-1],
        "chunks_with_skill_ratings": sum(bool(c["related_skill_ratings"]) for c in chunks),
        "chunks_with_categories": sum(bool(c["canonical_categories"]) for c in chunks),
        "repositories_with_chunks": len(by_repo),
        "empty_chunks": 0,
        "oversized_chunks": 0,
        "duplicate_chunk_ids": 0,
        "coverage_failures": 0,
    }


def write_json(path: Path, obj: Any, indent: int | None = 2) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, indent=indent)
        f.write("\n")


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")))
            f.write("\n")
            count += 1
    return count


def write_outputs(
    records: list[dict[str, Any]],
    chunks: list[dict[str, Any]],
    stats: dict[str, Any],
) -> dict[str, Any]:
    if TEMP_OUTPUT_DIR.exists():
        shutil.rmtree(TEMP_OUTPUT_DIR)
    TEMP_OUTPUT_DIR.mkdir(parents=True, exist_ok=False)
    by_repo_dir = TEMP_OUTPUT_DIR / BY_REPO_DIRNAME
    by_repo_dir.mkdir()

    write_jsonl(TEMP_OUTPUT_DIR / "chunks.jsonl", chunks)

    chunks_by_repo: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for chunk in chunks:
        chunks_by_repo[int(chunk["repository_index"])].append(chunk)

    catalog: list[dict[str, Any]] = []
    for record in records:
        idx = int(record["repository_index"])
        repo_chunks = chunks_by_repo[idx]
        write_jsonl(by_repo_dir / f"repo-{idx:03d}.chunks.jsonl", repo_chunks)
        catalog.append(
            {
                "repository_index": idx,
                "repository_name": record["repository_name"],
                "repository_slug": record.get("repository_slug"),
                "repository_url": record.get("repository_url"),
                "chunk_count": len(repo_chunks),
                "chunk_ids": [chunk["chunk_id"] for chunk in repo_chunks],
                "categories": sorted(
                    {
                        category
                        for chunk in repo_chunks
                        for category in chunk["canonical_categories"]
                    }
                ),
                "retrieval_tags": record.get("retrieval_tags", []),
            }
        )
    write_json(TEMP_OUTPUT_DIR / "chunk-catalog.json", catalog)

    generated_at = datetime.now(timezone.utc).isoformat()
    manifest = {
        "chunk_schema_version": CHUNK_SCHEMA_VERSION,
        "generated_at_utc": generated_at,
        "generator": SCRIPT_NAME,
        "step": 2,
        "input": {
            "path": str(INPUT_PATH.relative_to(BASE_DIR)).replace("\\", "/"),
            "sha256": sha256_file(INPUT_PATH),
            "size_bytes": INPUT_PATH.stat().st_size,
            "repository_count": len(records),
        },
        "output": {
            "directory": str(OUTPUT_DIR.relative_to(BASE_DIR)).replace("\\", "/"),
            "primary_chunk_file": "rag-corpus/chunks/chunks.jsonl",
            "per_repository_directory": "rag-corpus/chunks/by-repository/",
        },
        "chunking": {
            "strategy": "non-overlapping atomic Markdown sections; oversized sections split semantically",
            "target_words": TARGET_WORDS,
            "hard_max_words": HARD_MAX_WORDS,
            "embedding_context_overlap_words": CONTEXT_OVERLAP_WORDS,
            "authoritative_text_field": "text",
            "recommended_embedding_field": "embedding_text",
        },
        "stats": stats,
        "validation": {
            "repository_coverage": "PASS",
            "chunk_id_uniqueness": "PASS",
            "source_unit_text_coverage": "PASS",
            "chunk_hashes": "PASS",
            "hard_word_limit": "PASS",
            "empty_chunk_check": "PASS",
            "input_modified": False,
        },
    }
    write_json(TEMP_OUTPUT_DIR / "chunk-manifest.json", manifest)

    report_lines = [
        "RAG CHUNKING VALIDATION REPORT",
        "===============================",
        f"Generated (UTC): {generated_at}",
        f"Chunk schema version: {CHUNK_SCHEMA_VERSION}",
        "",
        "INPUT",
        "-----",
        "rag-corpus/repositories.jsonl",
        f"Repositories read: {stats['repository_count']}",
        "",
        "OUTPUT",
        "------",
        "rag-corpus/chunks/chunks.jsonl",
        "rag-corpus/chunks/chunk-catalog.json",
        "rag-corpus/chunks/chunk-manifest.json",
        "rag-corpus/chunks/chunk-validation-report.txt",
        "rag-corpus/chunks/by-repository/*.chunks.jsonl",
        "",
        "STATISTICS",
        "----------",
        f"Source units: {stats['source_unit_count']}",
        f"Chunks: {stats['chunk_count']}",
        f"Oversized source units split: {stats['split_source_unit_count']}",
        f"Total primary chunk words: {stats['chunk_word_count_total']}",
        f"Chunk words min/median/max: {stats['chunk_word_count_min']}/"
        f"{stats['chunk_word_count_median']}/{stats['chunk_word_count_max']}",
        f"Chunks carrying canonical categories: {stats['chunks_with_categories']}",
        f"Chunks carrying structured skill rows: {stats['chunks_with_skill_ratings']}",
        "",
        "VALIDATION",
        "----------",
        f"Repository coverage: PASS ({stats['repositories_with_chunks']}/{stats['repository_count']})",
        "Unique chunk IDs: PASS",
        "Non-empty chunk text: PASS",
        f"Hard maximum <= {HARD_MAX_WORDS} words: PASS",
        "Chunk SHA-256 validation: PASS",
        "Per-source-unit normalized text reconstruction: PASS",
        "Step 1 input modified: NO",
        "Original Markdown read directly: NO",
        "",
        "NEXT STAGE INPUT",
        "----------------",
        "rag-corpus/chunks/chunks.jsonl",
        "",
        "Use `embedding_text` for embeddings and preserve `text` as the authoritative",
        "evidence/citation payload.",
        "",
        "OVERALL RESULT: PASS",
        "",
    ]
    (TEMP_OUTPUT_DIR / "chunk-validation-report.txt").write_text(
        "\n".join(report_lines), encoding="utf-8", newline="\n"
    )

    return manifest


def validate_written_outputs(expected_chunk_count: int, expected_repo_count: int) -> None:
    chunk_path = TEMP_OUTPUT_DIR / "chunks.jsonl"
    catalog_path = TEMP_OUTPUT_DIR / "chunk-catalog.json"
    manifest_path = TEMP_OUTPUT_DIR / "chunk-manifest.json"
    report_path = TEMP_OUTPUT_DIR / "chunk-validation-report.txt"
    per_repo_dir = TEMP_OUTPUT_DIR / BY_REPO_DIRNAME

    required = [chunk_path, catalog_path, manifest_path, report_path, per_repo_dir]
    missing = [str(path.name) for path in required if not path.exists()]
    if missing:
        raise PipelineError(f"Temporary output is missing required artifact(s): {missing}")

    reread_chunks = load_jsonl(chunk_path)
    if len(reread_chunks) != expected_chunk_count:
        raise PipelineError(
            f"Written chunks.jsonl has {len(reread_chunks)} rows; expected {expected_chunk_count}."
        )

    with catalog_path.open("r", encoding="utf-8") as f:
        catalog = json.load(f)
    if not isinstance(catalog, list) or len(catalog) != expected_repo_count:
        raise PipelineError(
            f"chunk-catalog.json has {len(catalog) if isinstance(catalog, list) else 'invalid'} "
            f"records; expected {expected_repo_count}."
        )

    per_repo_files = list(per_repo_dir.glob("repo-*.chunks.jsonl"))
    if len(per_repo_files) != expected_repo_count:
        raise PipelineError(
            f"Per-repository output file count is {len(per_repo_files)}; expected {expected_repo_count}."
        )


def publish_outputs() -> None:
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    TEMP_OUTPUT_DIR.replace(OUTPUT_DIR)


def print_io_contract() -> None:
    print("Portfolio GitHub RAG pipeline — Step 2: semantic chunk preparation")
    print(f"Working directory: {BASE_DIR}")
    print()
    print("INPUT")
    print("  rag-corpus/repositories.jsonl")
    print()
    print("OUTPUT")
    print("  rag-corpus/chunks/chunks.jsonl")
    print("  rag-corpus/chunks/chunk-catalog.json")
    print("  rag-corpus/chunks/chunk-manifest.json")
    print("  rag-corpus/chunks/chunk-validation-report.txt")
    print("  rag-corpus/chunks/by-repository/repo-XXX.chunks.jsonl")
    print()


def main() -> int:
    print_io_contract()

    if len(sys.argv) != 1:
        print("[1/7] Validate zero-argument invocation ... FAILED", file=sys.stderr)
        print(
            f"ERROR: {SCRIPT_NAME} intentionally accepts no arguments.\n"
            f"Run it from the project root with:\n"
            f"  python {SCRIPT_NAME}",
            file=sys.stderr,
        )
        return 2

    try:
        print("[1/7] Validate zero-argument invocation ... SUCCESS")

        print("[2/7] Locate Step 1 normalized input ... ", end="", flush=True)
        if not INPUT_PATH.is_file():
            raise PipelineError(
                "Required input not found: rag-corpus/repositories.jsonl. "
                "Run prepare-rag-corpus.py successfully first."
            )
        print(f"SUCCESS ({INPUT_PATH.stat().st_size:,} bytes)")

        print("[3/7] Load and validate repository records ... ", end="", flush=True)
        records = load_jsonl(INPUT_PATH)
        expected_total = validate_input_records(records)
        records.sort(key=lambda r: int(r["repository_index"]))
        print(f"SUCCESS ({len(records)}/{expected_total} repositories)")

        print("[4/7] Build non-overlapping semantic chunks ... ", end="", flush=True)
        all_chunks: list[dict[str, Any]] = []
        units_by_repo: dict[int, list[SourceUnit]] = {}
        for record in records:
            repo_chunks, units = build_chunks_for_record(record)
            idx = int(record["repository_index"])
            units_by_repo[idx] = units
            all_chunks.extend(repo_chunks)
        print(
            f"SUCCESS ({sum(len(v) for v in units_by_repo.values()):,} source units -> "
            f"{len(all_chunks):,} chunks)"
        )

        print("[5/7] Validate chunk coverage, hashes, limits, and IDs ... ", end="", flush=True)
        stats = validate_all_chunks(records, all_chunks, units_by_repo)
        print("SUCCESS")
        print(
            f"      Repository coverage: {stats['repositories_with_chunks']}/{stats['repository_count']} | "
            f"split units: {stats['split_source_unit_count']:,} | "
            f"max chunk: {stats['chunk_word_count_max']} words"
        )

        print("[6/7] Write and re-read temporary output artifacts ... ", end="", flush=True)
        write_outputs(records, all_chunks, stats)
        validate_written_outputs(
            expected_chunk_count=len(all_chunks),
            expected_repo_count=len(records),
        )
        print("SUCCESS")

        print("[7/7] Publish validated chunk corpus atomically ... ", end="", flush=True)
        publish_outputs()
        print("SUCCESS")

        print()
        print("STEP 2 COMPLETE: SUCCESS")
        print(f"Repositories processed:          {stats['repository_count']}")
        print(f"Non-overlapping source units:    {stats['source_unit_count']:,}")
        print(f"Retrieval chunks generated:      {stats['chunk_count']:,}")
        print(f"Oversized source units split:    {stats['split_source_unit_count']:,}")
        print(
            "Chunk words min/median/max:    "
            f"{stats['chunk_word_count_min']}/{stats['chunk_word_count_median']}/"
            f"{stats['chunk_word_count_max']}"
        )
        print("Validation failures:             0")
        print()
        print("NEXT PIPELINE INPUT")
        print("  rag-corpus/chunks/chunks.jsonl")
        print()
        print("For Step 3: embed `embedding_text`; retain `text` for evidence/citations.")
        return 0

    except Exception as exc:
        if TEMP_OUTPUT_DIR.exists():
            shutil.rmtree(TEMP_OUTPUT_DIR, ignore_errors=True)
        print(file=sys.stderr)
        print(f"STEP 2 FAILED: {exc}", file=sys.stderr)
        print("No validated chunk output was published.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
