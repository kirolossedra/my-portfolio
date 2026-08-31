#!/usr/bin/env python3
"""
Prepare the GitHub career-analysis Markdown corpus for later RAG ingestion.

USAGE
-----
1. Put this script in the same directory as the corpus files, e.g.:

       repositories-001-015.md
       repositories-016-027-corrected.md
       ...
       repositories-124-134.md
       prepare-rag-corpus.py

2. Run it with NO arguments:

       python prepare-rag-corpus.py

OUTPUT
------
A generated ./rag-corpus/ directory containing:

    rag-corpus/
      repositories/
        repo-001.json
        ...
        repo-134.json
      repositories.jsonl
      repository-catalog.json
      manifest.json
      validation-report.txt

The original Markdown is never modified.

Design goals:
- deterministic and rerunnable;
- Python standard library only;
- preserve each complete repository analysis verbatim;
- normalize inconsistent section naming without discarding source text;
- preserve provenance back to source file and line numbers;
- extract useful metadata, retrieval tags, and skill-rating tables;
- fail loudly if repository coverage is incomplete or inconsistent.
"""

from __future__ import annotations

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


SCHEMA_VERSION = "1.0.0"
SCRIPT_NAME = Path(__file__).name
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "rag-corpus"
TEMP_OUTPUT_DIR = BASE_DIR / ".rag-corpus.tmp"

# Only repository batch files are inputs. Batch reports, continuation files,
# README.md, ledgers, and generated output are intentionally excluded.
INPUT_GLOB = "repositories-*.md"

REPO_HEADER_RE = re.compile(
    r"^#\s+Repository\s+(?P<index>\d{3})\s*/\s*(?P<total>\d+)\s+—\s+(?P<title>.+?)\s*$",
    re.MULTILINE,
)
HEADING_RE = re.compile(r"^(?P<marks>#{2,6})\s+(?P<title>.+?)\s*$", re.MULTILINE)
NUMBER_PREFIX_RE = re.compile(r"^\s*\d+(?:\.\d+)*\.?\s*")
MD_DECORATION_RE = re.compile(r"[*_~]")


# Canonical buckets are intentionally broad. They are retrieval-oriented aliases,
# not replacements for the original sections. Every original section remains in
# `sections` and every full repository block remains in `raw_analysis`.
CANONICAL_SECTION_RULES: dict[str, tuple[str, ...]] = {
    "identity": (
        r"\bproject identity\b",
        r"\bidentity and metadata\b",
        r"\bidentity\b",
    ),
    "rag_metadata": (
        r"\brag metadata\b",
        r"\bmetadata\b",
    ),
    "summary": (
        r"\bexecutive project description\b",
        r"\bproject description\b",
        r"\bgeneral .*description\b",
        r"\bbottom line\b",
        r"\bsummary vector\b",
    ),
    "chronology": (
        r"\bchronology\b",
        r"\bproject lifecycle\b",
        r"\bdevelopment character\b",
        r"\bcurrent relevance\b",
        r"\brecency\b",
    ),
    "technical_scope": (
        r"\bcore technical scope\b",
        r"\btechnical scope\b",
        r"\btechnical realm\b",
        r"\bwhat the system actually does\b",
        r"\bprimary implementation evidence\b",
    ),
    "architecture": (
        r"\btechnical architecture\b",
        r"\barchitecture\b",
        r"\bdata-flow\b",
        r"\bsource tree\b",
        r"\bpresentation architecture\b",
    ),
    "skills": (
        r"\bdirect skill evidence ratings\b",
        r"\bdirect authored skill evidence\b",
        r"\bskill evidence\b",
        r"\bskill ratings\b",
        r"\bskills likely acquired\b",
        r"\bskill lifecycle\b",
        r"\bskill evidence dimensions\b",
        r"\bfirst-appearance skill ledger\b",
    ),
    "business_domain": (
        r"\bproduct and business realm\b",
        r"\bproduct / business / domain realm\b",
        r"\bbusiness and professional realm\b",
        r"\bproduct and business context\b",
        r"\bbusiness/domain realm\b",
    ),
    "scale": (
        r"\bscale analysis\b",
        r"\bscale dimensions\b",
        r"^scale$",
    ),
    "maturity": (
        r"\bmaturity assessment\b",
        r"\bproduct and engineering maturity\b",
        r"\bproduct maturity\b",
        r"\bengineering maturity\b",
    ),
    "testing": (
        r"\btesting\b",
        r"\bverification\b",
        r"\bvalidation and testing\b",
        r"\btesting trajectory\b",
    ),
    "security_privacy": (
        r"\bsecurity\b",
        r"\bprivacy\b",
        r"\bthreat model\b",
        r"\bcredential\b",
        r"\bauthentication\b",
        r"\bauthorization\b",
    ),
    "deployment_cicd": (
        r"\bci/cd\b",
        r"\bdeployment\b",
        r"\bproduction operations\b",
    ),
    "documentation": (
        r"\bdocumentation\b",
        r"\breproducibility\b",
        r"\bevidence design\b",
    ),
    "repository_hygiene": (
        r"\brepository hygiene\b",
        r"\bdependency discipline\b",
    ),
    "strengths": (r"\bstrengths\b",),
    "weaknesses_debt": (
        r"\bweaknesses\b",
        r"\bengineering debt\b",
        r"\bmistakes\b",
        r"\banti-patterns\b",
        r"\blikely lessons\b",
    ),
    "production_evolution": (
        r"\bproduction evolution\b",
        r"\blearning-to-production delta\b",
    ),
    "failure_modes": (
        r"\bfailure potential\b",
        r"\bfailure-mode\b",
        r"\brisk and failure\b",
    ),
    "human_impact": (
        r"\bhuman impact\b",
        r"\bdignity boundary\b",
    ),
    "evidence_inference": (
        r"\bevidence vs\.? inference\b",
        r"\bevidence versus inference\b",
        r"\bdirectly observed\b",
        r"\breasonable inference\b",
        r"\bnot established\b",
    ),
    "authorship_attribution": (
        r"\bauthorship\b",
        r"\battribution\b",
        r"\bcontribution confidence\b",
        r"\bproject origin\b",
        r"\bcapability relationship\b",
        r"\bimplemented vs\.? used vs\.? designed\b",
        r"\bexposure and non-authored evidence boundary\b",
    ),
    "responsibility": (
        r"\bresponsibility scope\b",
        r"\bresponsibility and ownership\b",
        r"\bownership\b",
    ),
    "engineering_decisions": (
        r"\bengineering decisions and tradeoffs\b",
        r"\bdecisions and tradeoffs\b",
    ),
    "engineering_judgment": (r"\bengineering judgment\b",),
    "portfolio_weight": (r"\bportfolio evidence weight\b",),
    "limitations": (
        r"\bwhat this repository does not prove\b",
        r"\bwhat .* does not prove\b",
        r"\bcapabilities not evidenced\b",
        r"\bclaims to avoid\b",
        r"\brag anti-inflation warnings\b",
        r"\brag retrieval warnings\b",
        r"\bscope exclusions\b",
        r"\bdomain boundary\b",
    ),
    "career_signal": (
        r"\bcareer / engineering signal\b",
        r"\bcareer signal\b",
        r"\bcareer-positioning\b",
        r"\bprofessional self-positioning\b",
    ),
    "longitudinal": (
        r"\bcumulative career state\b",
        r"\blongitudinal\b",
        r"\bcareer-field historicity\b",
        r"\bsystems-engineering trajectory\b",
        r"\bcareer comparison\b",
        r"\bcomparison with earlier\b",
        r"\bcomparison with later\b",
        r"\bfirst / previous / current / corpus-max\b",
    ),
}


@dataclass(frozen=True)
class InputFile:
    path: Path
    priority: int


@dataclass
class RepoBlock:
    index: int
    total: int
    header_title: str
    repo_name: str
    source_file: str
    source_line_start: int
    source_line_end: int
    raw: str
    source_priority: int


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def clean_inline_markdown(value: str) -> str:
    value = value.strip()
    value = value.replace("`", "")
    value = MD_DECORATION_RE.sub("", value)
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.IGNORECASE)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def strip_section_number(title: str) -> str:
    title = clean_inline_markdown(title)
    return NUMBER_PREFIX_RE.sub("", title).strip(" -–—:/")


def normalize_key(value: str) -> str:
    value = strip_section_number(value).lower()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "_", value)
    return value.strip("_") or "section"


def parse_repo_name(header_title: str) -> str:
    backticked = re.search(r"`([^`]+)`", header_title)
    if backticked:
        return backticked.group(1).strip()
    # Fallback if future corpus entries omit backticks.
    return clean_inline_markdown(header_title).split(" / ", 1)[0].strip()


def corrected_priority(path: Path) -> int:
    # Corrected corpus files intentionally supersede an uncorrected duplicate if
    # both happen to be present in the same directory.
    return 100 if "corrected" in path.stem.lower() else 10


def discover_input_files() -> list[InputFile]:
    paths = sorted(p for p in BASE_DIR.glob(INPUT_GLOB) if p.is_file())
    if not paths:
        raise RuntimeError(
            f"No input files matching {INPUT_GLOB!r} were found beside {SCRIPT_NAME}."
        )
    return [InputFile(path=p, priority=corrected_priority(p)) for p in paths]


def line_number_at(text: str, char_offset: int) -> int:
    return text.count("\n", 0, char_offset) + 1


def parse_repository_blocks(input_file: InputFile) -> list[RepoBlock]:
    text = input_file.path.read_text(encoding="utf-8-sig")
    matches = list(REPO_HEADER_RE.finditer(text))
    if not matches:
        raise RuntimeError(f"No repository headers found in {input_file.path.name}")

    blocks: list[RepoBlock] = []
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        raw = text[start:end].rstrip() + "\n"
        source_start = line_number_at(text, start)
        source_end = source_start + raw.count("\n") - 1
        header_title = match.group("title").strip()
        blocks.append(
            RepoBlock(
                index=int(match.group("index")),
                total=int(match.group("total")),
                header_title=header_title,
                repo_name=parse_repo_name(header_title),
                source_file=input_file.path.name,
                source_line_start=source_start,
                source_line_end=source_end,
                raw=raw,
                source_priority=input_file.priority,
            )
        )
    return blocks


def select_repository_blocks(input_files: list[InputFile]) -> tuple[dict[int, RepoBlock], list[str]]:
    selected: dict[int, RepoBlock] = {}
    notes: list[str] = []

    for input_file in input_files:
        for block in parse_repository_blocks(input_file):
            existing = selected.get(block.index)
            if existing is None:
                selected[block.index] = block
                continue

            if block.source_priority > existing.source_priority:
                notes.append(
                    f"Repo {block.index:03d}: selected {block.source_file} over "
                    f"{existing.source_file} because it has corrected-file priority."
                )
                selected[block.index] = block
            elif block.source_priority < existing.source_priority:
                notes.append(
                    f"Repo {block.index:03d}: ignored {block.source_file}; "
                    f"{existing.source_file} has corrected-file priority."
                )
            else:
                raise RuntimeError(
                    f"Duplicate Repository {block.index:03d} with equal priority in "
                    f"{existing.source_file!r} and {block.source_file!r}. Resolve the duplicate "
                    "instead of allowing ambiguous RAG provenance."
                )

    return selected, notes


def split_markdown_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    # Corpus tables do not rely on escaped pipes for structural data. Supporting
    # the common escaped-pipe case still makes this safer for future entries.
    sentinel = "\u0000PIPE\u0000"
    line = line.replace(r"\|", sentinel)
    cells = [cell.replace(sentinel, "|").strip() for cell in line.split("|")]
    return cells


def is_separator_row(cells: list[str]) -> bool:
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", c.replace(" ", "")) for c in cells)


def extract_tables(text: str) -> list[dict[str, Any]]:
    lines = text.splitlines()
    tables: list[dict[str, Any]] = []
    i = 0

    while i + 1 < len(lines):
        if "|" not in lines[i] or "|" not in lines[i + 1]:
            i += 1
            continue

        header = split_markdown_row(lines[i])
        separator = split_markdown_row(lines[i + 1])
        if len(header) < 2 or len(separator) != len(header) or not is_separator_row(separator):
            i += 1
            continue

        rows: list[list[str]] = []
        j = i + 2
        while j < len(lines) and "|" in lines[j] and lines[j].strip().startswith("|"):
            row = split_markdown_row(lines[j])
            if len(row) != len(header):
                break
            rows.append(row)
            j += 1

        tables.append({"header": header, "rows": rows, "start_line_offset": i + 1})
        i = j

    return tables


def parse_sections(block: RepoBlock) -> tuple[str, list[dict[str, Any]]]:
    raw = block.raw
    first_newline = raw.find("\n")
    body_start = first_newline + 1 if first_newline >= 0 else len(raw)
    body = raw[body_start:]
    matches = list(HEADING_RE.finditer(body))

    if matches:
        intro = body[: matches[0].start()].strip()
    else:
        intro = body.strip()

    sections: list[dict[str, Any]] = []
    for i, match in enumerate(matches):
        level = len(match.group("marks"))
        # Content ends at the next heading of the same or a higher level.
        end = len(body)
        for later in matches[i + 1 :]:
            if len(later.group("marks")) <= level:
                end = later.start()
                break

        title = match.group("title").strip()
        content_start = match.end()
        content = body[content_start:end].strip()
        source_line_start = block.source_line_start + 1 + line_number_at(body, match.start()) - 1
        source_line_end = source_line_start + (body[match.start():end].count("\n"))

        # Construct path by looking backward for nearest ancestors.
        ancestors: list[str] = []
        target_level = level - 1
        for previous in reversed(sections):
            if previous["level"] == target_level:
                ancestors.insert(0, previous["title"])
                target_level -= 1
                if target_level < 2:
                    break
        path = ancestors + [title]

        sections.append(
            {
                "id": f"s{i + 1:03d}",
                "level": level,
                "title": title,
                "normalized_title": strip_section_number(title),
                "key": normalize_key(title),
                "path": path,
                "content": content,
                "source_line_start": source_line_start,
                "source_line_end": source_line_end,
            }
        )

    return intro, sections


def canonical_section_matches(sections: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}

    for canonical, patterns in CANONICAL_SECTION_RULES.items():
        matched: list[dict[str, Any]] = []
        for section in sections:
            title = section["normalized_title"].lower()
            if any(re.search(pattern, title) for pattern in patterns):
                matched.append(section)

        if matched:
            result[canonical] = {
                "section_ids": [s["id"] for s in matched],
                "titles": [s["title"] for s in matched],
                "text": "\n\n".join(
                    f"## {s['title']}\n{s['content']}".strip() for s in matched
                ),
            }

    return result


def metadata_from_tables(raw: str) -> tuple[dict[str, str], list[dict[str, Any]]]:
    metadata: dict[str, str] = {}
    all_tables = extract_tables(raw)

    for table in all_tables:
        header = [clean_inline_markdown(x).lower() for x in table["header"]]
        if len(header) < 2:
            continue

        first_header = header[0]
        second_header = header[1]
        looks_key_value = first_header in {
            "field",
            "metadata field",
            "attribute",
            "dimension",
        } and second_header in {
            "value",
            "evidence-backed interpretation",
            "interpretation",
            "repository interpretation",
            "evidence",
        }
        if not looks_key_value:
            continue

        for row in table["rows"]:
            key = clean_inline_markdown(row[0])
            value = clean_inline_markdown(row[1])
            if key and value and key.lower() not in {"field", "attribute"}:
                metadata.setdefault(normalize_key(key), value)

    return metadata, all_tables


def extract_retrieval_tags(raw: str, sections: list[dict[str, Any]], metadata: dict[str, str]) -> list[str]:
    candidates: list[str] = []

    for section in sections:
        if "retrieval tag" in section["normalized_title"].lower():
            candidates.append(section["content"])

    for key, value in metadata.items():
        if "retrieval_tag" in key:
            candidates.append(value)

    tags: list[str] = []
    for candidate in candidates:
        # Prefer backtick payloads because the corpus commonly stores tags there.
        code_spans = re.findall(r"`([^`]+)`", candidate)
        payloads = code_spans if code_spans else [candidate]
        for payload in payloads:
            # Support comma/semicolon-separated and bullet-oriented variants.
            payload = payload.replace("\n- ", ",").replace("\n* ", ",")
            for token in re.split(r"[,;\n]+", payload):
                token = clean_inline_markdown(token).strip(" .")
                if not token:
                    continue
                # Avoid swallowing explanatory prose if a future section mixes it
                # with tags. Tags in this corpus are short noun/technology phrases.
                if len(token) > 100:
                    continue
                tags.append(token)

    # Stable order, case-insensitive de-duplication.
    seen: set[str] = set()
    result: list[str] = []
    for tag in tags:
        folded = tag.casefold()
        if folded not in seen:
            seen.add(folded)
            result.append(tag)
    return result


def parse_rating(value: str) -> tuple[float | None, str]:
    cleaned = clean_inline_markdown(value)
    if re.search(r"\bN/?A\b|not applicable|from this repo", cleaned, re.IGNORECASE):
        return None, cleaned
    match = re.search(r"(?<!\d)([0-5](?:\.\d+)?)\s*(?:/\s*5)?", cleaned)
    if not match:
        return None, cleaned
    score = float(match.group(1))
    if 0.0 <= score <= 5.0:
        return score, cleaned
    return None, cleaned


def section_for_line(sections: list[dict[str, Any]], absolute_line: int) -> dict[str, Any] | None:
    eligible = [
        s
        for s in sections
        if s["source_line_start"] <= absolute_line <= s["source_line_end"]
    ]
    if not eligible:
        return None
    return max(eligible, key=lambda s: s["level"])


def extract_skill_ratings(
    block: RepoBlock,
    tables: list[dict[str, Any]],
    sections: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    skills: list[dict[str, Any]] = []

    for table in tables:
        raw_header = table["header"]
        header = [normalize_key(cell) for cell in raw_header]
        if not header or header[0] != "skill":
            continue

        rating_col = None
        for idx, name in enumerate(header):
            if "rating" in name or "evidence_score" in name:
                rating_col = idx
                break
        if rating_col is None:
            continue

        abs_line = block.source_line_start + table["start_line_offset"] - 1
        source_section = section_for_line(sections, abs_line)

        for row in table["rows"]:
            if not row or not clean_inline_markdown(row[0]):
                continue
            skill_name = clean_inline_markdown(row[0])
            rating_value = row[rating_col] if rating_col < len(row) else ""
            rating, rating_raw = parse_rating(rating_value)

            record: dict[str, Any] = {
                "skill": skill_name,
                "rating_5": rating,
                "rating_raw": rating_raw,
                "source_section_id": source_section["id"] if source_section else None,
                "source_section_title": source_section["title"] if source_section else None,
            }
            for col_idx, col_name in enumerate(header):
                if col_idx in {0, rating_col} or col_idx >= len(row):
                    continue
                value = clean_inline_markdown(row[col_idx])
                if value:
                    record[col_name] = value
            skills.append(record)

    # Avoid exact duplicate skill rows caused by duplicated table inclusion while
    # preserving genuinely different ratings/evidence classes for the same skill.
    deduped: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in skills:
        fingerprint = json.dumps(item, sort_keys=True, ensure_ascii=False)
        if fingerprint not in seen:
            seen.add(fingerprint)
            deduped.append(item)
    return deduped


def metadata_lookup(metadata: dict[str, str], *aliases: str) -> str | None:
    for alias in aliases:
        key = normalize_key(alias)
        if key in metadata:
            return metadata[key]
    return None


def build_record(block: RepoBlock) -> dict[str, Any]:
    intro, sections = parse_sections(block)
    metadata, tables = metadata_from_tables(block.raw)
    tags = extract_retrieval_tags(block.raw, sections, metadata)
    skills = extract_skill_ratings(block, tables, sections)
    canonical = canonical_section_matches(sections)

    repository_slug = metadata_lookup(metadata, "Repository")
    repository_url = metadata_lookup(metadata, "Repository URL", "URL")
    repository_url_source = "metadata" if repository_url else None
    if not repository_url and repository_slug and "/" in repository_slug:
        # Deterministic normalization only: the corpus already identifies these as
        # GitHub owner/repository slugs. Mark the derived URL explicitly rather
        # than pretending it was directly present in the source text.
        repository_url = f"https://github.com/{repository_slug}"
        repository_url_source = "derived_from_repository_slug"
    created = metadata_lookup(metadata, "Repository created", "Created")
    first_commit = metadata_lookup(metadata, "First observed commit", "First commit")
    last_commit = metadata_lookup(
        metadata,
        "Last observed commit",
        "Latest observed commit",
        "Last observed repository push",
    )
    active_span = metadata_lookup(metadata, "Active development span", "First→latest active span")
    maturity = metadata_lookup(
        metadata,
        "Overall maturity",
        "Product maturity",
        "Engineering maturity",
        "Maturity",
    )
    portfolio_weight = metadata_lookup(metadata, "Portfolio Evidence Weight")
    technical_realm = metadata_lookup(metadata, "Technical realm")
    business_realm = metadata_lookup(metadata, "Business/domain realm", "Business/domain realm", "Business realm")

    return {
        "schema_version": SCHEMA_VERSION,
        "repository_index": block.index,
        "repository_total": block.total,
        "repository_name": block.repo_name,
        "header_title": block.header_title,
        "repository_slug": repository_slug,
        "repository_url": repository_url,
        "repository_url_source": repository_url_source,
        "source": {
            "file": block.source_file,
            "line_start": block.source_line_start,
            "line_end": block.source_line_end,
            "sha256": sha256_text(block.raw),
        },
        "chronology_summary": {
            "created": created,
            "first_commit": first_commit,
            "last_commit_or_push": last_commit,
            "active_span": active_span,
        },
        "classification_summary": {
            "technical_realm": technical_realm,
            "business_realm": business_realm,
            "maturity": maturity,
            "portfolio_evidence_weight": portfolio_weight,
        },
        "metadata": metadata,
        "retrieval_tags": tags,
        "skill_ratings": skills,
        "intro": intro,
        "canonical_sections": canonical,
        "sections": sections,
        "raw_analysis": block.raw,
    }


def validate_blocks(blocks: dict[int, RepoBlock]) -> tuple[int, list[str]]:
    if not blocks:
        raise RuntimeError("No repository blocks were parsed.")

    totals = Counter(block.total for block in blocks.values())
    if len(totals) != 1:
        raise RuntimeError(f"Conflicting repository totals in headers: {dict(totals)}")
    expected_total = next(iter(totals))

    expected = set(range(1, expected_total + 1))
    actual = set(blocks)
    missing = sorted(expected - actual)
    extra = sorted(actual - expected)
    if missing or extra:
        raise RuntimeError(
            "Repository coverage validation failed. "
            f"Missing={missing or 'none'}, extra={extra or 'none'}"
        )

    warnings: list[str] = []
    for index in sorted(blocks):
        block = blocks[index]
        if not block.repo_name:
            warnings.append(f"Repo {index:03d}: empty repository name")
        if len(block.raw) < 500:
            warnings.append(
                f"Repo {index:03d}: unusually short analysis ({len(block.raw)} characters)"
            )

    return expected_total, warnings


def safe_write_json(path: Path, obj: Any, *, indent: int | None = 2) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, indent=indent)
        f.write("\n")


def build_outputs(
    input_files: list[InputFile],
    blocks: dict[int, RepoBlock],
    duplicate_notes: list[str],
    validation_warnings: list[str],
    expected_total: int,
) -> dict[str, Any]:
    if TEMP_OUTPUT_DIR.exists():
        shutil.rmtree(TEMP_OUTPUT_DIR)
    TEMP_OUTPUT_DIR.mkdir(parents=True)
    repos_dir = TEMP_OUTPUT_DIR / "repositories"
    repos_dir.mkdir()

    records: list[dict[str, Any]] = []
    catalog: list[dict[str, Any]] = []

    for index in sorted(blocks):
        record = build_record(blocks[index])
        records.append(record)
        safe_write_json(repos_dir / f"repo-{index:03d}.json", record)

        catalog.append(
            {
                "repository_index": record["repository_index"],
                "repository_name": record["repository_name"],
                "repository_slug": record["repository_slug"],
                "repository_url": record["repository_url"],
                "source_file": record["source"]["file"],
                "source_line_start": record["source"]["line_start"],
                "source_line_end": record["source"]["line_end"],
                "retrieval_tags": record["retrieval_tags"],
                "skill_rating_count": len(record["skill_ratings"]),
                "chronology_summary": record["chronology_summary"],
                "classification_summary": record["classification_summary"],
                "canonical_section_keys": sorted(record["canonical_sections"].keys()),
            }
        )

    # JSONL is deliberately full-fidelity: one complete normalized repository per
    # line. Later chunking/indexing stages can consume this deterministically.
    with (TEMP_OUTPUT_DIR / "repositories.jsonl").open(
        "w", encoding="utf-8", newline="\n"
    ) as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")))
            f.write("\n")

    safe_write_json(TEMP_OUTPUT_DIR / "repository-catalog.json", catalog)

    generated_at = datetime.now(timezone.utc).isoformat()
    input_manifest = [
        {
            "file": item.path.name,
            "size_bytes": item.path.stat().st_size,
            "sha256": sha256_file(item.path),
            "priority": item.priority,
        }
        for item in input_files
    ]

    stats = {
        "repository_count": len(records),
        "expected_repository_count": expected_total,
        "source_file_count": len(input_files),
        "total_raw_characters": sum(len(r["raw_analysis"]) for r in records),
        "total_raw_words_approx": sum(len(r["raw_analysis"].split()) for r in records),
        "total_sections": sum(len(r["sections"]) for r in records),
        "total_retrieval_tags": sum(len(r["retrieval_tags"]) for r in records),
        "total_skill_rating_rows": sum(len(r["skill_ratings"]) for r in records),
        "repositories_with_skill_ratings": sum(bool(r["skill_ratings"]) for r in records),
        "repositories_with_retrieval_tags": sum(bool(r["retrieval_tags"]) for r in records),
        "repositories_with_repository_url": sum(bool(r["repository_url"]) for r in records),
    }

    manifest = {
        "schema_version": SCHEMA_VERSION,
        "generated_at_utc": generated_at,
        "generator": SCRIPT_NAME,
        "base_directory": ".",
        "input_glob": INPUT_GLOB,
        "inputs": input_manifest,
        "stats": stats,
        "notes": duplicate_notes,
        "validation_warnings": validation_warnings,
    }
    safe_write_json(TEMP_OUTPUT_DIR / "manifest.json", manifest)

    report_lines = [
        "RAG CORPUS NORMALIZATION VALIDATION",
        "===================================",
        f"Generated (UTC): {generated_at}",
        f"Schema version: {SCHEMA_VERSION}",
        "",
        f"Repository coverage: {len(records)}/{expected_total}",
        f"Input repository batch files: {len(input_files)}",
        f"Extracted sections: {stats['total_sections']}",
        f"Extracted retrieval tags: {stats['total_retrieval_tags']}",
        f"Extracted skill-rating rows: {stats['total_skill_rating_rows']}",
        f"Repos with skill-rating rows: {stats['repositories_with_skill_ratings']}/{expected_total}",
        f"Repos with retrieval tags: {stats['repositories_with_retrieval_tags']}/{expected_total}",
        f"Repos with repository URL: {stats['repositories_with_repository_url']}/{expected_total}",
        "",
        "Coverage check: PASS",
        "Original Markdown modified: NO",
        "Full repository analyses preserved: YES",
        "",
        "Duplicate/correction handling:",
    ]
    report_lines.extend(f"- {note}" for note in duplicate_notes)
    if not duplicate_notes:
        report_lines.append("- No duplicate repository indexes encountered.")
    report_lines.append("")
    report_lines.append("Warnings:")
    report_lines.extend(f"- {warning}" for warning in validation_warnings)
    if not validation_warnings:
        report_lines.append("- None.")
    report_lines.append("")

    (TEMP_OUTPUT_DIR / "validation-report.txt").write_text(
        "\n".join(report_lines), encoding="utf-8", newline="\n"
    )

    # Only replace a previous generated directory after the entire new corpus has
    # been parsed and validated successfully.
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    TEMP_OUTPUT_DIR.replace(OUTPUT_DIR)

    return manifest


def main() -> int:
    if len(sys.argv) != 1:
        print(
            f"ERROR: {SCRIPT_NAME} intentionally accepts no arguments.\n"
            f"Place it beside the repository Markdown files and run:\n"
            f"  python {SCRIPT_NAME}",
            file=sys.stderr,
        )
        return 2

    print("GitHub career corpus -> normalized RAG source")
    print(f"Directory: {BASE_DIR}")
    print()

    try:
        input_files = discover_input_files()
        print(f"Found {len(input_files)} repository batch file(s):")
        for item in input_files:
            label = " [corrected priority]" if item.priority >= 100 else ""
            print(f"  - {item.path.name}{label}")
        print()

        blocks, duplicate_notes = select_repository_blocks(input_files)
        expected_total, validation_warnings = validate_blocks(blocks)
        print(f"Parsed and validated {len(blocks)}/{expected_total} repositories.")

        manifest = build_outputs(
            input_files=input_files,
            blocks=blocks,
            duplicate_notes=duplicate_notes,
            validation_warnings=validation_warnings,
            expected_total=expected_total,
        )

        stats = manifest["stats"]
        print()
        print("Normalization complete.")
        print(f"Output: {OUTPUT_DIR.name}/")
        print(f"  Repository JSON files: {stats['repository_count']}")
        print(f"  Sections extracted:    {stats['total_sections']}")
        print(f"  Retrieval tags:        {stats['total_retrieval_tags']}")
        print(f"  Skill-rating rows:     {stats['total_skill_rating_rows']}")
        print()
        print("Next pipeline stage should consume rag-corpus/repositories.jsonl")
        print("Do not embed the original batch Markdown directly.")
        return 0

    except Exception as exc:
        if TEMP_OUTPUT_DIR.exists():
            shutil.rmtree(TEMP_OUTPUT_DIR, ignore_errors=True)
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
