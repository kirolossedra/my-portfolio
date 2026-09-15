# Repository 075 — Word-Tracker

## Repository Identity

- **Repository:** `kirolossedra/Word-Tracker`
- **Repository start date:** 2024-12-27
- **Last meaningful update date:** 2024-12-27
- **Latest meaningful commit:** `b4ff58c7986184e01c971889d54cdf6e0da771fd`
- **Primary technical field:** browser data collection and localization
- **Application domain:** English/French vocabulary tracking
- **Primary technologies:** HTML, CSS, JavaScript, Firebase Realtime Database
- **Project context:** personal language-learning utility
- **Collaboration classification:** `individual-project`

## Evidence Basis

The repository contains:

- a small README;
- a single substantial `index.html`.

That HTML page includes:

- Firebase initialization;
- Realtime Database access;
- bilingual UI data;
- form validation;
- database writes;
- visual language switching.

The corpus intentionally avoids reproducing the repository's client configuration values.

## What This Project Is

`Word-Tracker`, titled **SpreadTheWord** in the page, is a bilingual English/French vocabulary-entry utility.

The application lets a user:

1. select the current language;
2. enter a word or language item;
3. classify it into a vocabulary/grammar category;
4. submit the record;
5. store it in Firebase Realtime Database with a timestamp.

This is the first processed portfolio artifact that combines a browser form with a live hosted database write.

## System Shape

```text
Browser
   ↓
English / French mode
   ↓
Localized form
   ├─ word
   └─ category
   ↓
Validation
   ↓
Firebase Realtime Database
   ↓
words/<language>/
   ↓
{ word, category, timestamp }
```

## Firebase Integration

The page loads Firebase's modular JavaScript SDK from Google's CDN.

Imported capabilities include:

- application initialization;
- Realtime Database access;
- references;
- push-based record creation.

The initialized database object becomes the persistence layer for form submissions.

## Realtime Database Write

The submission code writes records under a language-specific path:

```text
words/English/
```

or:

```text
words/French/
```

Each record contains:

- the submitted word;
- selected category;
- timestamp.

The use of `push(...)` creates a new child entry rather than overwriting one fixed value.

## Bilingual Interface

The application stores an explicit translations object for:

- English;
- French.

Each language contains localized:

- word label;
- placeholder;
- category label;
- submit button text;
- validation message;
- success message;
- failure message;
- category display strings.

This is real UI localization logic, not just multilingual content displayed side by side.

## Language Toggle

Clicking the toggle switches the `currentLanguage` variable between English and French.

The application then:

- changes the body's language-related class;
- replaces labels;
- replaces input placeholder;
- rebuilds the category options;
- changes the submit button text.

The UI behavior therefore changes dynamically without page reload.

## Vocabulary Categories

The form supports categories such as:

- Synonym;
- Phrasal;
- Idiom;
- Compound;
- Pronunciation;
- Conjunction;
- Collocations;
- Grammar.

French mode translates the visible category text while preserving consistent underlying values.

That separation is useful for storing normalized data while localizing presentation.

## Dynamic Select Construction

The category `<select>` is rebuilt from the active language's category metadata.

This avoids maintaining two static forms.

## Form Validation

Before database submission, the page checks:

- word is non-empty;
- category is selected.

Invalid forms trigger the language-specific validation message.

## Success and Failure Handling

Firebase's promise-based write operation has separate success and failure paths.

### Success

The application:

- shows a localized success alert;
- resets the form.

### Failure

It:

- logs the error;
- displays a localized failure message.

## Visual Localization

Language mode also changes the visual theme.

The page defines separate body classes for English and French.

The custom switch changes flag imagery based on current mode.

This makes locale state visible in addition to changing text.

## Frontend Architecture

The implementation uses an ES module for Firebase imports.

Application setup is deferred until `DOMContentLoaded`.

The page then wires:

- form submission;
- language toggle;
- dynamic translations.

## Data Modeling

The Firebase path structure introduces a simple hierarchical data model:

```text
words
├── English
│   ├── generated-key
│   │   ├── word
│   │   ├── category
│   │   └── timestamp
│   └── ...
└── French
    ├── generated-key
    │   ├── word
    │   ├── category
    │   └── timestamp
    └── ...
```

Language is represented structurally in the path rather than duplicated as one field on every record.

## Product Engineering

The utility has a clear small-product workflow:

- choose language;
- enter learning item;
- classify item;
- validate;
- persist;
- confirm success.

Localization and storage are integrated into the primary interaction rather than added as unrelated demonstrations.

## Engineering Practices

### Structured Localization Data

UI text is centralized inside a translations object.

### Normalized Category Values

Localized category labels share stable underlying values.

### Asynchronous Persistence

Database writes are handled through promises with explicit success/error behavior.

### Input Validation

Incomplete records are rejected before persistence.

### Hierarchical Data Organization

Records are grouped by language in the Firebase path.

## Scale and Complexity

The repository contains one main implementation file.

Its complexity comes from combining:

- browser UI;
- localization state;
- dynamic option construction;
- validation;
- asynchronous Firebase writes;
- hierarchical realtime data storage.

## Skills Demonstrated

### Frontend

- **HTML/CSS/JavaScript — strong evidence.**
- **Dynamic DOM updates — strong evidence.**
- **Client-side form handling — strong evidence.**
- **ES modules — strong evidence.**

### Data and Backend Services

- **Firebase initialization — strong evidence.**
- **Firebase Realtime Database — strong evidence.**
- **Browser-to-database writes — strong evidence.**
- **Hierarchical data modeling — moderate-to-strong evidence.**
- **Timestamped record creation — strong evidence.**

### Internationalization

- **English/French localization — strong evidence.**
- **Runtime language switching — strong evidence.**
- **Localized alerts and form labels — strong evidence.**
- **Localized display values with stable stored categories — strong evidence.**

## Capability Developed

This repository adds a new application architecture to the processed chronology: a static browser frontend connected directly to a hosted realtime database.

It also adds explicit localization as application state.

## Portfolio Evolution Context

This is the earliest processed repository with direct evidence of:

- Firebase;
- Firebase Realtime Database;
- browser-originated database writes;
- a bilingual English/French application interface.

## Historical Significance

`Word-Tracker` is important because a previously static-browser-heavy portfolio now shows a persistent cloud-backed interaction without introducing a custom backend server.

It also introduces internationalization as a functional UI concern.

## Overall Repository Narrative

`Word-Tracker` is a compact bilingual vocabulary-collection application.

Its strongest engineering evidence is the combination of runtime localization and cloud persistence: the interface changes between English and French, validates categorized vocabulary input, and writes timestamped records into language-specific Firebase Realtime Database paths.

# Project Tags

## Project Type

- `language-learning-utility`
- `single-page-web-application`
- `cloud-backed-frontend`
- `interactive-form`

## Collaboration and Authorship

- `individual-project`

## Languages

- `html`
- `css`
- `javascript`

## Frontend

- `dynamic-dom`
- `event-driven-ui`
- `form-validation`
- `runtime-localization`
- `bilingual-ui`
- `english-french-ui`
- `es-modules`

## Database and Cloud

- `firebase`
- `firebase-realtime-database`
- `browser-database-write`
- `hierarchical-data-model`
- `timestamped-records`

## Domain

- `language-learning`
- `vocabulary-tracking`

## Portfolio Significance

- `earliest-observed-firebase`
- `earliest-observed-firebase-realtime-database`
- `earliest-observed-browser-database-write`
- `earliest-observed-bilingual-ui`
