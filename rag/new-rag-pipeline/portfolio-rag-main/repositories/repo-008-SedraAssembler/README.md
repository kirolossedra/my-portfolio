# SedraAssembler

## Repository Identity

- Repository: 008 / 134
- Name: `SedraAssembler`
- Repository start date: 2022-08-21
- Last meaningful update date: 2023-02-27
- Primary type: Flutter assembler and memory-mapping application
- Technical field: Mobile/cross-platform application development and computer architecture tooling
- Application domain: Custom Sedra processor assembly language
- Project context: Personal project
- Collaboration type: `individual-project`
- Primary implementation language: Dart
- Framework: Flutter
- Build artifact evidence: Android release APK

## Collaboration and Authorship Context

The visible repository history is owner-attributed, supporting personal attribution of the Dart/Flutter application and assembler logic.

Generated Flutter platform files and compiled artifacts are treated as framework/build output rather than equivalent authored application logic.

## Evidence Basis

The analysis is grounded in:

- `README.md`;
- `pubspec.yaml`;
- `lib/main.dart`;
- Android/iOS Flutter scaffolding;
- application assets;
- checked-in `app-release.apk`;
- repository commit history.

## What This Project Is

`SedraAssembler` is a Flutter application that assembles a small custom instruction language for a custom processor described by the repository as using **Sedra Quattro Architecture**.

The application parses source text, validates session structure, checks fixed-width instruction grouping, validates register constraints, emits machine-code-like binary instruction strings, and supports clipboard export.

A second workflow creates a processor memory/register mapping by converting user-entered values into fixed-width binary strings.

This project is a notable convergence of user-facing software and low-level architecture concepts.

## Custom Instruction Set

The README documents four operations:

- `addar`;
- `subar`;
- `mullog`;
- `addlog`.

Each instruction has four words:

```text
opcode destination-register first-operand-register second-operand-register
```

Assembly sessions begin with:

```text
start SEDRA16 asm session
```

and end with:

```text
end SEDRA16 asm session
```

The application treats the four-token instruction width as an explicit architectural invariant.

## App Navigation

### Instructions

Navigates to `CpuPage`, the assembler/editor workflow.

### Memory Mapping

Navigates to `RamPage`, where eight values can be entered and exported as binary strings.

## Architecture and System Shape

```text
Flutter MaterialApp
      ↓
FirstPage
  ├───────────────┐
  ↓               ↓
CpuPage         RamPage
  ↓               ↓
Source editor     8 numeric inputs
  ↓               ↓
Normalization     Decimal parsing
  ↓               ↓
Grammar checks    16-bit conversion
  ↓               ↓
Register checks   Joined mapping string
  ↓               ↓
Opcode encoding   Clipboard export
  ↓
Machine-code string
  ↓
Clipboard export
```

## Technical Stack

### Dart

Dart implements application state, parser-like validation, binary conversion, string processing, and UI behavior.

### Flutter

Flutter provides widgets, navigation, text fields, stateful screens, Material controls, assets, Snackbars, and clipboard integration.

### `easy_rich_text`

Used to highlight assembly tokens such as session markers, processor identifiers, and instruction mnemonics.

### `google_fonts`

Used for display styling on the navigation surface.

### Flutter Lints

`analysis_options.yaml` and `flutter_lints` provide static linting infrastructure.

## Major Engineering Work

### Source Normalization

`_getString` collapses repeated spaces and reformats the displayed program so each group of four tokens appears on its own line.

### Validation Pipeline

`_asm()` performs a sequence of checks before encoding.

#### Entry-Point Validation

The source is checked for the expected `start` marker and its correct location.

#### Instruction-Width Validation

The total token count is checked against the four-word instruction invariant.

#### Session Consistency

The processor/device identifier near session end is checked against the one established at session start.

#### End-Point Validation

The final group is checked for the expected `end` marker.

#### Duplicate Boundary Detection

Occurrences of `start` and `end` are counted so multiple session boundaries can be surfaced explicitly.

#### Register Compatibility

For a `SEDRA16` session, register operands are constrained to the supported register range.

### Error Categorization

The application distinguishes several error classes, including:

- missing start;
- wrong entry point;
- wrong end point;
- unclosed session;
- session-model inconsistency;
- instruction-width violation;
- duplicate start;
- duplicate end;
- register incompatibility.

This is strong positive evidence of defensive validation rather than a single generic failure path.

### Machine-Code Encoding

Validated instructions are mapped to visible six-bit opcode prefixes:

- `addar` → `000000`;
- `subar` → `000001`;
- `addlog` → `000010`;
- `mullog` → `000011`.

Register operands are converted to three-bit binary values and concatenated with the opcode into instruction bitstrings.

### Syntax Highlighting

`EasyRichText` patterns provide lightweight source highlighting for session keywords, processor identifiers, and supported mnemonics.

### Clipboard Export

Both assembler output and memory-map output can be copied through Flutter's clipboard API, with Snackbars confirming the action.

### Memory Mapping

`RamPage` maintains eight integer values.

On input changes, values are parsed, stored, converted to 16-bit binary strings, and combined into an exportable mapping.

## Cross-Platform Project Structure

The repository contains Flutter's Android and iOS project structures.

The checked-in `app-release.apk` is concrete evidence that the Android target reached a packaged release artifact.

## Verification

### Static Analysis

`analysis_options.yaml` together with `flutter_lints` provides lint/static-analysis support.

### Build Artifact Verification

The checked-in Android APK provides direct evidence that the Flutter application was successfully packaged for Android.

### Manual Application Verification

The user-facing navigation, validation messages, clipboard confirmation, and packaged artifact support an interactive run-and-inspect development workflow.

## Engineering Practices

### Explicit Grammar Rules

The assembly language has clearly encoded structural invariants.

### Validation Before Encoding

Machine output is produced only after the parser-like checks succeed.

### Error Categorization

Different syntax and consistency problems receive specific diagnostic messages.

### Workflow Separation

Assembler editing and memory mapping are exposed as distinct application screens.

### Static Linting

The repository includes Flutter's lint configuration.

## Product Engineering

This is a clear end-user developer utility.

The user can:

- author custom assembly;
- see syntax-highlighted source;
- assemble the program;
- receive structured diagnostics;
- copy encoded machine output;
- clear the editor;
- generate a memory/register mapping;
- copy the generated mapping.

Material widgets, image-based navigation, feedback Snackbars, and an installable Android artifact give the project a concrete product surface.

## Scale and Complexity

### Source Scale

The authored application core is concentrated in `lib/main.dart`, while the full repository also includes Flutter scaffolding, assets, and a compiled APK.

### Functional Scale

Two related processor-development workflows are combined in one application.

### Conceptual Scale

The project integrates:

- cross-platform UI;
- parser-like validation;
- custom ISA rules;
- binary encoding;
- syntax highlighting;
- clipboard integration;
- memory-map generation.

## Skills Demonstrated

### Languages and Frameworks

- **Dart — strong evidence.**
- **Flutter — strong evidence.**

### Mobile Application Development

- **Widget composition — strong evidence.**
- **Navigation — strong evidence.**
- **Stateful screens — strong evidence.**
- **Text-field interaction — strong evidence.**
- **Material UI — strong evidence.**
- **Asset use — strong evidence.**
- **Clipboard integration — strong evidence.**
- **Snackbar feedback — strong evidence.**

### Parsing and Validation

- **Token normalization — strong evidence.**
- **Grammar validation — strong evidence.**
- **Error categorization — strong evidence.**
- **Register-range validation — strong evidence.**

### Computer Architecture

- **Custom instruction format — strong evidence.**
- **Opcode mapping — strong evidence.**
- **Register encoding — strong evidence.**
- **Binary instruction encoding — strong evidence.**
- **Memory/register mapping — strong evidence.**

### Software Engineering Practices

- **Static linting — moderate evidence.**
- **Validation-first processing — strong evidence.**
- **Workflow separation by screen — moderate evidence.**

## Capability Developed

This repository bridges two earlier portfolio directions:

- processor/digital architecture work;
- user-facing application development.

The architecture concept becomes the domain of a software tool rather than remaining only an HDL model.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- Dart;
- Flutter;
- cross-platform mobile application structure;
- Android release APK;
- custom assembler;
- custom instruction-set encoding;
- app-level syntax highlighting;
- processor memory-map generation;
- repository-level Flutter lint configuration.

Input validation also becomes substantially more explicit than in earlier personal application repositories.

## Historical Significance

`SedraAssembler` is an early convergence project in the portfolio.

It marks the transition from studying processors to building an installable software tool around a processor architecture, and it establishes the first observed Flutter/Dart mobile-development evidence.

## Overall Repository Narrative

`SedraAssembler` is a Flutter developer utility for writing and assembling a small custom instruction language and generating processor memory mappings.

Its most important engineering characteristic is a validation-first pipeline: source text is normalized, checked for session boundaries and fixed-width instruction structure, validated for processor/register consistency, and then converted into bit-level output.

The project combines mobile UI engineering with low-level computer-architecture reasoning and reaches a packaged Android artifact.

# Project Tags

## Project Type

- `mobile-application`
- `cross-platform-application`
- `developer-tooling`
- `interactive-utility`
- `personal-project`

## Collaboration and Authorship

- `individual-project`

## Languages

- `dart`

## Frontend

- `flutter`
- `mobile-ui`
- `stateful-ui`
- `navigation`
- `syntax-highlighting`
- `clipboard-interaction`

## DevOps and Delivery

- `android-apk`
- `build-artifact-evidence`

## Systems Engineering

- `custom-assembler`
- `custom-isa`
- `instruction-parser`
- `instruction-encoding`
- `opcode-mapping`
- `register-encoding`
- `memory-mapping`
- `binary-encoding`

## Software Engineering Practices

- `input-validation`
- `error-categorization`
- `static-linting`
- `validation-first-processing`

## Portfolio Significance

- `earliest-observed-dart`
- `earliest-observed-flutter`
- `earliest-observed-mobile-application`
- `earliest-observed-custom-assembler`
- `earliest-observed-android-apk`
