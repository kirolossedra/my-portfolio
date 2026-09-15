# Security

## Repository Identity

- Repository: 118
- Name: `Security`
- Repository Start Date: 2024-10-15
- Latest Meaningful Update Date: 2024-10-15
- Latest Meaningful Commit: `6d0eb99f825fc4bbdffb4bc2e23c2199b72daa0a`
- Primary Type: Python security-oriented utility experiment
- Technical Field: Deterministic text hashing and derived string generation
- Context: Individual programming experiment
- Collaboration Type: `individual-project`
- Primary Language: Python
- Historical Position: Chronology backfill discovered after private-repository access was reconciled.

## What This Project Is

`Security` is a compact Python experiment around deterministic transformation of input text.

The repository contains a script named `Password Hashing.py`.

The script hashes input text with SHA-256.

It converts the resulting hexadecimal digest into an integer.

That integer seeds Python's pseudo-random generator.

The seeded generator then selects characters from a configured alphabet to produce a fixed-length output string.

The result is deterministic for a given input and output length because the same SHA-256 digest produces the same pseudo-random seed.

## Core Function

The script defines:

```python
hash_text_to_alphanumeric(text, length=14)
```

The function takes arbitrary input text and an optional output length.

The default output length is 14 characters.

Its implementation has four main stages.

1. Encode the input text.
2. Compute a SHA-256 digest.
3. Seed the pseudo-random generator from the digest value.
4. Generate a string from the configured output alphabet.

This forms a reproducible text-to-string derivation pipeline.

## SHA-256 Digest Stage

The script uses Python's standard `hashlib` module.

It creates a SHA-256 hash object from the UTF-8-encoded input text.

The digest is converted to hexadecimal representation.

The hexadecimal digest is then parsed as an integer.

This large integer becomes deterministic seed material for the next stage.

## Character Alphabet

The output alphabet combines:

- uppercase ASCII letters,
- lowercase ASCII letters,
- decimal digits,
- selected special characters.

The special-character set includes common punctuation used in password-style strings.

The generator therefore produces output that can contain multiple character classes.

## Deterministic Pseudo-Random Selection

The script calls:

```python
random.seed(int(hex_dig, 16))
```

It then repeatedly calls `random.choice` over the configured character alphabet.

Because the seed is derived entirely from the SHA-256 digest, identical function inputs reproduce the same character sequence.

Changing the source text changes the digest and therefore changes the seed sequence.

Changing the requested output length changes how many characters are drawn.

## Output-Length Parameterization

The `length` argument controls the generated string length.

The default is 14.

The function uses a range over that length to construct the final string.

This makes the output format configurable without altering the hashing stage.

## Example Execution

The script contains an example invocation and prints the derived output.

The source example demonstrates the intended end-to-end use of the function.

The corpus does not reproduce the personal example input.

The relevant engineering evidence is the deterministic function behavior and the standard-library implementation.

## Technical Stack

### Python

The entire experiment is implemented as a small Python script.

### `hashlib`

`hashlib.sha256` supplies the cryptographic hash primitive used to derive deterministic seed material.

### `string`

The standard `string` module supplies predefined ASCII letter and digit sets.

### `random`

Python's standard pseudo-random module turns the digest-derived seed into repeatable character selection.

## Engineering Characteristics

### Functional Decomposition

The transformation is encapsulated in a reusable function rather than being written entirely inline.

The example call is separated from the function definition.

### Parameterization

Output length is exposed as a function parameter.

The character alphabet is assembled programmatically from standard-library constants and an explicit punctuation suffix.

### Determinism

The function deliberately converts hash output into repeatable pseudo-random selection.

This is the central behavior of the experiment.

### Standard-Library Implementation

The repository relies only on Python standard-library modules for its core logic.

The experiment can therefore run without third-party packages.

## Evidence Boundary

The filename uses the phrase `Password Hashing`, while the actual code performs a SHA-256-derived deterministic character transformation.

The portfolio corpus describes the implementation at that concrete algorithmic level.

This preserves what was actually engineered without inferring a broader authentication or password-storage system from the repository name.

## Skills Demonstrated

- Python scripting
- function design
- input encoding
- SHA-256 hashing
- hexadecimal digest handling
- integer conversion
- seeded pseudo-random generation
- configurable output construction
- ASCII character-set composition
- deterministic transformations
- standard-library programming

## Portfolio Significance

The repository records a small security-themed programming experiment from October 2024.

Its main value in a cross-repository RAG corpus is as direct evidence of early experimentation with hashing primitives and deterministic derivation logic.

It also provides a useful historical boundary: later repositories contain substantially broader authentication, authorization, cryptographic-session, and secure-state designs, whereas this artifact captures a focused low-level transformation experiment.

# Project Tags

- python
- security-experiment
- hashlib
- sha256
- hashing
- deterministic-string-derivation
- seeded-prng
- python-random
- character-set-generation
- configurable-output-length
- standard-library
- text-transformation
