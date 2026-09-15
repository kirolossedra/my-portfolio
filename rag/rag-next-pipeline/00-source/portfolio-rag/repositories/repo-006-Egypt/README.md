# Egypt

## Repository Identity

- Repository: 006 / 134
- Name: `Egypt`
- Repository start date: 2022-07-17
- Last meaningful update date: 2023-05-28
- Primary type: Static browser application
- Technical field: Frontend web development, text processing, calendar conversion
- Application domain: Ancient Egyptian language, hieroglyphs, Egyptian/Coptic date representation
- Project context: Personal project
- Collaboration type: `individual-project`
- Primary implementation languages: JavaScript, HTML, CSS

## Collaboration and Authorship Context

The inspected history is owner-authored, including the latest meaningful commit on 2023-05-28. The application code is therefore personally attributable at repository level.

The linguistic and historical data embedded in the JavaScript should be treated separately from authorship of the surrounding application logic because the repository does not establish the external provenance of every mapping.

## Evidence Basis

The analysis is grounded in the current repository tree, `index.html`, `code.js`, `style.css`, repository metadata, and commit history.

This project is clearly related to the earlier `vv11345` / Egyptinator prototype, but the implementation materially expands that earlier concept.

## What This Project Is

`Egypt` is a larger browser application for translating or transliterating English text into Egyptian hieroglyphic Unicode representations and reversing selected hieroglyphic entries back into English.

It extends the earlier translator with rule-driven handling for:

- numbers;
- fractions;
- arithmetic symbols;
- Egyptian month names;
- pharaoh names;
- current-date conversion;
- Egyptian/Coptic date rendering.

The browser remains the complete application runtime.

## User-Facing Scope

The page provides:

- live translation while typing;
- English-to-hieroglyph direction;
- hieroglyph-to-English direction switching;
- a definition mode that can return multiple mapped forms;
- clipboard copy;
- clear/reset;
- current-date rendering;
- Egyptian/Coptic date toggling;
- hints explaining king and month-name syntax;
- literal transliteration fallback;
- numeric and fraction representation;
- mappings for selected arithmetic symbols;
- Egyptian month-name mappings;
- historical royal-name mappings.

The HTML includes viewport and mobile-web-app metadata, and the action controls use Ionicons loaded from a CDN.

## Repository Structure

The main repository artifacts are:

- `_config.yml`;
- `back.jpg`;
- `code.js`;
- `index.html`;
- `style.css`;
- icon/image assets.

`code.js` is approximately 439 KB and contains both executable logic and large embedded domain datasets.

## Architecture and System Shape

```text
Browser
  ↓
HTML input and controls
  ↓
JavaScript application state
  ├─ translation direction
  ├─ definition mode
  └─ date-display toggle
  ↓
Input normalization
  ↓
Translation dispatcher
  ├─ lexical lookup
  ├─ reverse lookup
  ├─ definition lookup
  ├─ number/fraction handling
  ├─ month lookup
  ├─ pharaoh-name lookup
  └─ literal transliteration fallback
  ↓
Date conversion branch
  ├─ current Gregorian date
  ├─ leap-year-sensitive conversion
  ├─ Egyptian-form output
  └─ Coptic-form output
  ↓
DOM-rendered Unicode output
```

The architecture remains self-contained and static-deployment friendly.

## Technical Stack

### JavaScript

JavaScript implements the entire application state and domain-processing pipeline, including DOM operations, date APIs, arrays, string parsing, numeric conversion, branching rules, and clipboard interaction.

### HTML

`index.html` defines the text input, result surface, action buttons, definition-mode switch, and scrolling usage hints.

### CSS

`style.css` provides the interface layout and visual presentation.

### Unicode

Egyptian hieroglyphs and Coptic characters are represented directly as Unicode text, allowing results to remain selectable and copyable.

### GitHub Pages

GitHub Pages is enabled, providing static deployment evidence for the application.

## Major Engineering Work

### Translation Pipeline

The main input handler evaluates `TranslateA(edit(x))`, separating normalization from the translation dispatcher.

### Direction Switching

`getLanguage()` updates the input prompt and toggles application state so `TranslateP` can search in either direction.

### Definition Mode

Definition mode collects multiple indices for one matching English term and renders several associated Egyptian forms.

### Transliteration Fallback

Unknown lexicon entries can be rendered through deterministic literal character transliteration.

The UI explicitly explains this fallback for modern names and other unmapped terms.

### Numeric and Fraction Representation

The application contains explicit handling for numeric input and multiple fraction forms, including:

- `3/4`;
- `2/3`;
- `1/2`;
- `1/4`;
- `1/8`;
- `1/16`;
- `1/32`;
- `1/64`;
- generic `1/n` syntax.

Selected arithmetic symbols are also mapped into domain-specific output.

### Pharaoh-Name Handling

Parallel mappings encode English royal names and corresponding hieroglyphic representations across multiple dynasties.

The UI documents the roman-numeral suffix convention used for repeated royal names.

### Month Handling

Tokens such as `month-i` through later month numbers are mapped to Egyptian month forms.

### Calendar Conversion

`getCoptic(day, month, year)` uses separate boundary tables for ordinary, leap, and pre-leap-year cases.

`DateToday()` reads the browser's current date and produces two alternate output forms:

- an Egyptian hieroglyphic date representation;
- a Coptic-script date representation.

This is custom calendar arithmetic implemented directly in JavaScript.

### Browser Interaction

The page supports copy, reset, translation-direction switching, definition-mode toggling, and date-mode toggling.

## Verification

### Manual Browser Verification

The interactive application structure, user-facing hints, and static deployment provide evidence of manual browser-driven verification.

The hints document expected token conventions and fallback behavior, giving users concrete guidance for exercising the implemented rules.

## Engineering Practices

### Domain-Specific Branching

The application distinguishes lexical terms from numbers, fractions, months, royal names, and date operations, giving separate rules to different input classes.

### Explicit User Guidance

Input conventions are documented directly in the UI.

### Edge-Case Handling

Leap-year-sensitive date tables and explicit fraction handling show attention to non-default input cases.

### Self-Contained Distribution

The complete application can be delivered as static assets.

## Product Engineering

Compared with repository 001, the product surface becomes broader.

The same browser interface supports several domain tasks:

- text translation;
- reverse lookup;
- literal transliteration;
- definition lookup;
- number/fraction rendering;
- historical-name mapping;
- current-date conversion.

The UI also explains the input conventions required for some specialized features.

## Scale and Complexity

### Source Scale

The file count is small, but the JavaScript asset is large because it embeds both logic and substantial domain data.

### Functional Scale

Several symbolic domains are handled inside one interface.

### Data Scale

Large lexical, royal-name, month, and symbol mappings are embedded in source.

### Conceptual Scale

The project combines:

- frontend interaction;
- lexical lookup;
- reverse lookup;
- transliteration;
- Unicode text;
- number encoding;
- fraction encoding;
- historical-name mapping;
- calendar arithmetic.

## Skills Demonstrated

### Languages

- **JavaScript — strong evidence.**
- **HTML — strong evidence.**
- **CSS — strong evidence.**

### Frontend

- **DOM manipulation — strong evidence.**
- **Event-driven UI — strong evidence.**
- **Client-side application design — strong evidence.**
- **Clipboard interaction — moderate evidence.**

### Data and Text Processing

- **Dictionary lookup — strong evidence.**
- **Reverse lookup — strong evidence.**
- **Text normalization — strong evidence.**
- **Literal transliteration — strong evidence.**
- **Unicode text handling — strong evidence.**
- **Numeric/fraction encoding — strong evidence.**
- **Historical-name mapping — strong evidence.**

### Date Logic

- **Leap-year-sensitive calendar conversion — strong repository evidence.**
- **Coptic-script date representation — strong repository evidence.**

### Domain Modeling

- **Ancient-Egyptian symbolic representation — strong repository evidence.**
- **Historical royal-name encoding — moderate-to-strong repository evidence.**

## Capability Developed

Relative to `vv11345`, the application evolves from a primarily lexical translator into a more rule-driven domain utility.

Different input categories receive separate interpretation paths, and calendar logic adds a second major capability alongside translation.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- custom calendar conversion;
- Coptic-script output;
- current-date transformation;
- explicit numeric/fraction hieroglyph encoding;
- pharaoh-name-specific lookup rules.

The Ancient-Egyptian software theme also becomes visibly longitudinal: an earlier concept is revisited and expanded with substantially more domain logic.

## Historical Significance

`Egypt` demonstrates continuity and growth within one recurring project theme.

It shows the progression from a smaller client-side translator into a broader rule-based utility that combines language, symbolic number handling, historical names, and calendrical representation.

## Overall Repository Narrative

`Egypt` is a substantial evolution of the earlier Egyptinator idea. It retains the static client-side deployment model but expands the domain logic dramatically.

A typed term can be resolved as a lexical mapping, reverse mapping, literal transliteration, number, fraction, month, royal name, or date-related value. The same application can compute alternate date representations from the browser's current date.

Its strongest engineering evidence is the growth of rule-based domain modeling inside a directly usable browser product.

# Project Tags

## Project Type

- `static-web-application`
- `interactive-utility`
- `personal-project`

## Collaboration and Authorship

- `individual-project`

## Languages

- `javascript`
- `html`
- `css`

## Frontend

- `browser-dom`
- `event-driven-ui`
- `client-side-application`
- `clipboard-interaction`

## Database and Data

- `dictionary-lookup`
- `reverse-lookup`
- `text-normalization`
- `text-transliteration`
- `unicode-text`
- `embedded-dataset`
- `calendar-conversion`
- `numeric-symbol-encoding`
- `fraction-encoding`
- `historical-name-lookup`

## Cloud and Infrastructure

- `github-pages`
- `static-site-deployment`

## Domain

- `ancient-egyptian`
- `hieroglyphs`
- `language-tooling`
- `coptic-script`
- `egyptian-calendar`
- `pharaoh-names`

## Portfolio Significance

- `earliest-observed-calendar-conversion`
- `earliest-observed-coptic-script`
- `earliest-observed-numeric-symbol-encoding`
