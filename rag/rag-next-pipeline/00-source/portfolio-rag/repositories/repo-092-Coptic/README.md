# Repository 092 — Coptic

## Repository Identity

- **Repository:** `kirolossedra/Coptic`
- **Corpus index:** 092
- **Repository start date:** 2025-08-24
- **Last meaningful update date:** 2025-08-26
- **Latest meaningful commit:** `c7ff34dadcb52b820ed9e29f9c1a3d3c6211276a`
- **Primary project form:** Coptic lexicon, browser translator/lookup, and dialect-normalization data tooling
- **Collaboration classification:** `individual-project`
- **Substantive files:** `index.html`, `dictionary.py`, `tla.py`, `bohairic.py`

## Evidence Basis

The root README contains no substantive project description.

The repository's meaning therefore comes from its data structures and lookup logic.

`index.html` embeds a large JavaScript dictionary for English-to-Coptic lookup.

`dictionary.py` contains another large Coptic lexical mapping.

`tla.py` contains additional lexicon/transliteration-oriented mappings.

`bohairic.py` maps Coptic forms into Bohairic-oriented equivalents.

The code is data-heavy.

Most repository size represents curated lexical entries rather than algorithmically complex source.

That distinction matters for portfolio interpretation.

A large dictionary demonstrates domain-data construction and normalization work, but should not be described as equivalent to a large backend service.

## What the Project Is

Coptic is a language-tooling repository centered on lexical lookup and dialect/form mapping for the Coptic language.

It continues the owner's long-running interest in Ancient Egyptian and Coptic computational tools.

The visible browser page provides a translation/lookup experience.

Python files hold or transform lexical mappings outside the browser.

The project therefore combines:

- language-domain data;
- browser lookup UX;
- dictionary construction;
- dialect normalization;
- script-aware text handling.

## Project Scope

The retained implementation supports:

- Coptic-script lexical data;
- English lemma lookup;
- one-to-many Coptic equivalents;
- browser-side dictionary search;
- Python dictionary representations;
- Bohairic mapping/normalization;
- additional transliteration/lexical mapping data.

The repository does not establish a statistical machine-translation model.

It does not use an LLM or neural sequence-to-sequence architecture in the retained implementation.

The appropriate description is dictionary/lexicon-based language tooling.

## Architecture / System Shape

The repository has two practical layers.

### Browser Lookup Layer

```text
user term
   ↓
JavaScript dictionary lookup
   ↓
matching Coptic entries
   ↓
rendered browser result
```

### Lexical Data/Preparation Layer

```text
curated Coptic forms
      ↓
Python dictionaries / mappings
      ↓
normalization / dialect mapping
      ↓
lexical artifacts consumed or maintained separately
```

The two layers are related by domain rather than packaged as a formal service architecture.

There is no server API between them.

## Technical Stack

- HTML
- CSS
- JavaScript
- Python
- Unicode Coptic text
- large static dictionaries
- key/value lexical lookup
- dialect mapping
- browser-side rendering

## Browser Translator / Lookup

`index.html` presents a Coptic translator/lookup interface.

The page embeds a substantial `copticDictionary` object directly in JavaScript.

English keys map to Coptic candidate forms.

Many keys map to arrays rather than a single string.

This allows the data model to preserve multiple lexical equivalents.

That is important for dictionary-style language software because translation is rarely a one-to-one substitution problem.

The browser can operate without a remote database because the lexical data is shipped with the page.

The tradeoff is that updates require updating the bundled dictionary.

## Lexical Data Model

The repository relies heavily on static map/dictionary structures.

This gives lookup approximately direct key-based access for exact terms.

It also makes the lexical corpus human-inspectable in source control.

The model is suitable for a small static language utility.

It does not intrinsically handle semantic context, inflectional analysis, or sentence-level disambiguation.

Those capabilities should not be inferred from the word “translator.”

## `dictionary.py`

`dictionary.py` retains a large Python dictionary of Coptic vocabulary.

The vocabulary spans everyday terms, religious vocabulary, and forms with Greek influence.

This file functions primarily as a lexical corpus/artifact.

Its engineering contribution is in data representation and curation rather than a complex execution pipeline.

The corpus should therefore tag both Python and lexical-data work, while avoiding an inflated algorithmic-complexity claim.

## `tla.py`

`tla.py` contains another large mapping related to the broader lexical/transliteration effort.

Its presence shows that the repository is not just a copied browser dictionary.

There are multiple representations/data-processing artifacts around the language domain.

The exact linguistic provenance of individual entries is not documented sufficiently in the repository for this corpus to certify scholarly accuracy.

The file is evidence of language-data engineering, not external linguistic validation.

## Bohairic Mapping

`bohairic.py` is the most historically distinctive file in the repository.

It defines a large `old_to_bohairic` mapping.

The intent is to map existing Coptic forms into Bohairic-oriented forms.

This is a dialect/form-normalization task rather than a generic English translation task.

That adds a second dimension to the project:

```text
lexical meaning lookup
+
dialect/form conversion
```

The repository therefore demonstrates awareness that Coptic is not a single undifferentiated textual representation.

## Duplicate-Key Correctness Boundary

Python dictionary literals silently keep only the last value for a repeated key.

The large Bohairic mapping contains duplicate-key risk in the retained source.

That matters because a human-maintained lexical corpus can accidentally encode several intended alternatives using a representation that overwrites earlier entries.

The source does not include a preflight validator that detects duplicate literal keys before runtime.

This is a meaningful data-quality lesson.

A future corpus implementation would benefit from list-valued entries or an input format that can preserve duplicate source records before normalization.

## Unicode / Script Handling

The repository works directly with Coptic Unicode characters.

That avoids image-based or transliterated-only representation for the core output.

Unicode handling is central to the project because lookup data, display, and Python source all need to preserve the script accurately.

This continues the user's earlier work with Egyptian/Coptic character systems.

## Major Engineering Work

### Domain Corpus Construction

A major portion of the work is building and maintaining large lexical datasets.

That involves normalization choices, spelling/form choices, and key organization.

### Browserization of Domain Data

The lexical corpus is surfaced through a browser interaction rather than remaining only a Python dictionary.

This makes the language data directly usable by a non-programmer.

### One-to-Many Translation Representation

The browser dictionary can retain several Coptic candidates for an English term.

This is a better fit for lexical ambiguity than forced one-to-one replacement.

### Bohairic Normalization

The dialect/form mapping adds a specialized transformation layer.

This is narrower and more domain-specific than the earlier generic Coptic-script inclusion elsewhere in the portfolio.

## Testing & Verification

Verification is primarily manual/data-oriented.

The browser provides direct lookup feedback for dictionary entries.

Python's import/runtime semantics validate that mapping files are syntactically valid.

The repository does not contain a linguistic gold-standard comparison or automated duplicate-key audit.

The duplicate-key representation issue is therefore especially relevant to verification quality.

The corpus does not claim dictionary completeness or philological correctness beyond the checked-in data.

## Engineering Discipline

The project demonstrates:

- structured key/value lexical representation;
- explicit use of arrays where multiple meanings/forms are needed in JavaScript;
- Unicode-first script representation;
- separation of some data concerns into Python files;
- domain-specific dialect conversion.

The most important discipline gap visible in the source is data provenance/validation.

For a language corpus, correctness depends not only on code execution but also on the trustworthiness and reproducibility of lexical sources.

## Product Engineering

The browser page turns a large domain dataset into a simple task-oriented utility.

The user can search rather than inspect source files.

This is consistent with a recurring portfolio pattern: specialized knowledge is wrapped in a lightweight interface.

The project remains local/static rather than account-based or collaborative.

That is appropriate to its lookup-oriented scope.

## Scale / Complexity

Algorithmic complexity is modest.

Data complexity is the dominant dimension.

The repository contains many manually represented lexical relationships.

Maintaining those relationships creates challenges around:

- duplicate keys;
- spelling normalization;
- dialect variants;
- one-to-many meanings;
- Unicode correctness;
- provenance;
- consistency between representations.

This is a data-intensive language project more than a compute-intensive one.

## Skills Demonstrated

### Language/Data Engineering

- Coptic-script handling
- lexicon construction
- dictionary modeling
- one-to-many lexical mapping
- dialect/form mapping
- Bohairic normalization
- Unicode-aware source data
- domain-data curation

### Software

- JavaScript object lookup
- browser UI integration
- Python dictionary representation
- static application design
- data-driven frontend behavior

### Data-Quality Awareness

The repository also surfaces practical schema lessons around duplicate keys and multi-valued lexical data.

## What Was Learned / Capability Developed

The project reinforces that language software is often constrained by data modeling more than by interface code.

Representing several valid forms requires schemas that preserve alternatives.

Dialect conversion requires explicit normalization rules.

Large hand-maintained mappings also expose why validation tooling and provenance become increasingly important as a corpus grows.

Those lessons are directly relevant to later RAG/corpus-building work in the portfolio.

## Portfolio Evolution Context

Coptic script had appeared earlier in repository 006 `Egypt`.

This repository should therefore not be tagged as the first Coptic-script use in the portfolio.

Its historical contribution is specialization.

The earlier project mixed Ancient Egyptian transliteration, calendars, numbers, names, and Coptic representations inside a broader historical-language utility.

Repository 092 narrows the focus to Coptic lexical tooling and Bohairic mapping.

That is a transition from broad cultural/language features toward a more concentrated domain corpus.

## Historical Significance

Within the processed corpus, this is the earliest observed repository centered primarily on Coptic lexicography and Bohairic-oriented form mapping.

It is also a useful bridge between early domain-specific static applications and later corpus/data-engineering concerns.

The repository shows that specialized linguistic data remained a recurring technical domain several years after the earliest Egyptinator work.

## Limitations & Missing Evidence

The repository does not document authoritative lexical sources well enough to independently verify linguistic provenance.

The dictionary-based approach does not support contextual sentence translation by itself.

Duplicate Python dictionary keys can overwrite intended earlier values in large mappings.

These are data-quality and semantic-scope boundaries rather than generic software checklist omissions.

## Overall Narrative

Coptic is a specialized language-data project that combines a browser Coptic lookup tool with large Python/JavaScript lexicons and an explicit Bohairic form-mapping layer.

Its engineering value lies in domain corpus construction, Unicode script handling, one-to-many lexical representation, and dialect normalization.

It continues one of the oldest themes in the portfolio while making the work more linguistically focused and data-structured.

# Project Tags

`individual-project`, `coptic`, `coptic-language`, `coptic-script`, `bohairic`, `bohairic-dialect`, `lexicography`, `lexicon`, `dictionary`, `language-tooling`, `translation-lookup`, `dictionary-based-translation`, `one-to-many-mapping`, `dialect-normalization`, `form-normalization`, `unicode`, `domain-data`, `data-curation`, `javascript`, `html`, `python`, `static-web-app`, `browser-lookup`, `large-static-dictionary`, `duplicate-key-risk`, `linguistic-provenance-boundary`, `ancient-language-computing`, `earliest-observed-coptic-lexicography-centered-repository`, `earliest-observed-bohairic-mapping`
