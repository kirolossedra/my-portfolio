# CV-Highly-Organized

## Repository Identity

- Repository: 110 / 134
- Name: `CV-Highly-Organized`
- Repository start date: 2026-07-19
- Last meaningful update date: 2026-08-22
- Latest meaningful commit: `85f0549993d2085bfb6e84e08888387c45f4e4bf`
- Primary type: Structured multi-CV source repository with automated PDF builds and authenticated artifact browser
- Technical field: LaTeX document engineering, CI automation, frontend engineering, repository tooling
- Application domain: Career-document generation and role-specific CV management
- Collaboration type: `individual-project`
- Primary languages: TeX / LaTeX, HTML, CSS, JavaScript, Python

## Collaboration and Authorship Context

The repository is owner-driven. The current latest commit is authored by `github-actions[bot]` because the checked-in GitHub Actions workflow compiles updated LaTeX sources and commits the generated PDFs automatically.

The bot-authored PDF commits are build artifacts produced by owner-configured automation; they are not treated as separate human authorship.

The repository also contains an auxiliary Python nRF RSSI tool. That utility is documented separately from the primary CV-management system so its hardware-measurement purpose does not blur the repository's main role.

## Evidence Basis

The analysis is grounded in:

- root `README.md`;
- the structured CV directory hierarchy;
- `.github/workflows/build-cvs.yml`;
- the authenticated `index.html` CV manager;
- representative `main.tex` and category README artifacts;
- auxiliary `tesp.py`;
- commit history through the August 22 automated PDF build.

## What This Project Is

`CV-Highly-Organized` is a source-controlled library of role-specific CV variants organized by career category rather than by Git branch.

The repository preserves a master CV and specialized positioning variants for areas such as:

- embedded engineering;
- QA;
- software engineering;
- systems engineering;
- wireless engineering;
- 5G/RAN;
- wireless systems;
- RF testing;
- technical sales.

Each active CV remains ordinary repository content, with Git history providing version history across all variants.

The project then adds two pieces of automation around this document library:

1. GitHub Actions compiles every `main.tex` into a colocated `main.pdf` and commits changed PDFs.
2. A responsive authenticated browser reads the repository hierarchy through the GitHub API and exposes the built PDFs as a searchable/downloadable CV workspace.

This turns what could have been a directory of independent documents into a managed artifact system.

## Project Scope

### Career Hierarchy

The root README explicitly defines a hierarchical organization.

The major top-level families include:

- `Engineering`;
- `MasterCV`;
- `Non-Engineering`.

Engineering branches then specialize further into role families and sub-specializations.

This hierarchy allows closely related positioning variants to remain structurally adjacent instead of being duplicated into disconnected repositories or branches.

### CV Source Contract

CV categories are centered on:

- `main.tex` — active LaTeX source;
- `README.md` — positioning/category documentation.

The generated `main.pdf` becomes the built artifact next to the source.

### Git-Based Versioning

The root documentation explicitly rejects the pattern of maintaining each CV variant in a separate Git branch.

Instead:

- all active variants coexist on `main`;
- directories encode category identity;
- commits preserve evolution over time.

This makes cross-variant maintenance and discovery easier than branch-per-document organization.

## Automated PDF Build Pipeline

### GitHub Actions Trigger

`Build CV PDFs` runs on:

- pushes to `main` affecting `**/*.tex`;
- changes to the workflow itself;
- manual `workflow_dispatch`.

The path filter prevents unrelated changes from needlessly recompiling the document set.

### Multi-CV Compilation

The workflow uses `xu-cheng/latex-action@v4` with:

- root pattern `**/main.tex`;
- compilation in each root file's own directory;
- Debian environment;
- current TeX Live;
- failure propagation rather than silently ignoring compile failures.

The pattern allows all role-specific CVs to be built through one workflow.

### Generated Artifact Commit

After compilation, the workflow searches recursively for `main.pdf`, stages them, checks whether any PDF actually changed, and exits cleanly when there is nothing to commit.

When changes exist, it configures the GitHub Actions bot identity, commits the generated PDFs, and pushes them back to the repository.

This creates a source-plus-built-artifact workflow in which users can retrieve a current PDF without compiling LaTeX locally.

## Authenticated Career CV Manager

### Browser Application

`index.html` is a large standalone browser application that presents the repository as a CV workspace.

Its interface includes:

- Firebase email/password login;
- desktop sidebar navigation;
- mobile drawer navigation;
- repository breadcrumb;
- recursive folder tree;
- search;
- grid/list views;
- dark/light theme;
- repository refresh;
- CV/folder statistics;
- built-PDF download actions;
- status toasts and error states.

### Firebase Authentication

The application initializes Firebase Authentication and uses:

- `signInWithEmailAndPassword`;
- `onAuthStateChanged`;
- `signOut`.

The document browser is shown only within the authenticated session state.

The corpus records the authentication mechanism without reproducing repository configuration values.

### Fixed Repository Boundary

The browser is intentionally scoped to one fixed GitHub repository:

`kirolossedra/CV-Highly-Organized`.

The application does not ask the user to supply arbitrary owner/repository names.

This gives the UI a narrow operational purpose: browse and retrieve this particular CV library.

### Recursive GitHub Tree Loading

The application calls the GitHub repository tree endpoint with recursive traversal enabled.

The returned paths are converted into an in-memory folder structure.

The builder:

- filters hidden/build/dependency paths;
- creates folder nodes from path segments;
- recognizes built `main.pdf` blobs;
- associates each PDF with a sibling `main.tex` source path;
- sorts folders and files;
- counts descendant PDFs;
- produces flat folder/file lists for search and statistics.

### Dynamic Hierarchy

The frontend does not maintain a hard-coded JavaScript list of every CV category.

It derives the navigation tree from the GitHub repository itself.

New qualifying folders/PDFs can therefore appear in the browser without manually changing a second category registry in the frontend.

### Repository Cache

The recursive tree response is cached in `localStorage`.

The application:

- namespaces the cache by owner/repository/branch;
- records synchronization time;
- accepts cached data only within a bounded age;
- renders cached data quickly;
- then performs a forced background refresh.

This balances responsiveness with repository freshness.

### GitHub Error Handling

The frontend handles notable API failure states including:

- GitHub API rate-limit exhaustion;
- missing repository/main branch;
- truncated recursive tree responses.

These states are surfaced through repository-status UI and toasts rather than being swallowed silently.

### Search and Navigation

Folders and files are flattened from the tree to support search while retaining their hierarchical paths.

Navigation uses the URL hash so the current repository path is represented in browser state.

Ancestor folders are expanded when navigating to nested paths.

### Download Naming

The UI downloads the CI-built PDF while applying a locally generated filename derived from:

- the CV folder/category;
- current timestamp.

This makes downloaded artifacts distinguishable without changing the canonical checked-in `main.pdf` filename.

### Theme and View Persistence

The selected theme and grid/list preference are stored in `localStorage`.

This is separate from the short-lived GitHub tree cache.

### Responsive UI

The interface adapts from a desktop sidebar layout to a mobile drawer and single-column card presentation.

It also honors reduced-motion preferences by reducing animation/transition durations.

## Architecture and System Shape

```text
Role-specific main.tex sources
            ↓
GitHub push to main
            ↓
GitHub Actions / latex-action
            ↓
main.pdf artifacts
            ↓
automated bot commit
            ↓
GitHub repository tree
            ↓ GitHub API
Authenticated browser
            ↓
recursive category navigation / search
            ↓
PDF download with local timestamped filename
```

The repository itself is both the source store and the artifact catalog.

## Technical Stack

### LaTeX

LaTeX provides the editable source format for the CV variants.

### GitHub Actions

GitHub Actions turns document edits into reproducible PDF builds and checked-in artifacts.

### Bash

The workflow's shell step discovers PDFs, stages changes, checks the index, configures the bot identity, commits, and pushes.

### HTML / CSS / JavaScript

A standalone frontend implements the authenticated CV browser without requiring a separate frontend framework.

### Firebase Authentication

Firebase supplies email/password session authentication for access to the browser workspace.

### GitHub REST API

The browser retrieves the recursive repository tree directly from GitHub.

### localStorage

Browser storage persists:

- repository-tree cache;
- theme preference;
- view preference.

## Major Engineering Work

### Repository-as-Data-Source Design

The source repository hierarchy is the canonical category model for the frontend.

This avoids maintaining the same CV taxonomy separately in source-control folders and application configuration.

### Build Artifact Automation

A source edit can propagate through compilation and artifact commit without manual local PDF generation.

### Recursive Tree Materialization

GitHub flat path entries are transformed into a navigable folder object graph and flat indexes for search.

### Cache-Then-Refresh Behavior

Fresh-enough cached hierarchy data can render immediately while a remote synchronization follows in the background.

### Authentication State Transition

The frontend explicitly separates login and application views and reacts to Firebase authentication-state changes.

### Artifact-Oriented UX

The interface is optimized around one concrete user task: locate a career-specific CV and download the current built PDF.

## CI and Verification

### LaTeX Compilation as CI Validation

Every matching `main.tex` is compiled by the workflow.

Because `continue_on_error` is false, a failed document build prevents the normal artifact-commit step from representing the source as successfully compiled.

### No-Change Guard

The workflow checks the staged diff before creating a bot commit.

This prevents empty automation commits when generated PDFs remain identical.

### Built Artifact Evidence

The checked-in `main.pdf` files and bot build commits provide direct evidence that the document-build workflow has executed.

## Engineering Practices

### Single-Branch Multi-Variant Organization

Directories, rather than branches, represent active CV variants.

### Source / Artifact Pairing

Each CV keeps editable source and generated output colocated.

### Automated Reproducibility

Compilation is encoded in CI rather than relying on an undocumented local TeX command.

### Derived Navigation

The frontend derives its data model from repository state rather than a duplicated manual category list.

### Bounded Browser Caching

The application gives repository metadata a finite cache lifetime and refreshes in the background.

### Graceful API Diagnostics

Rate limits, missing repository state, and truncated tree responses receive specific handling.

## Auxiliary nRF RSSI Measurement Utility

The repository also contains `tesp.py`, a separate Python desktop measurement tool.

This utility is not part of the CV build/browser architecture, but it is substantive repository evidence and is therefore preserved as an auxiliary capability.

### Physical Board Detection

The script enumerates serial ports and identifies likely nRF/J-Link/CMSIS-DAP interfaces.

Multiple serial interfaces exposed by one physical debugger board are grouped using identifiers such as:

- serial number;
- physical USB location;
- HWID-derived serial/location data.

This avoids treating multiple CDC interfaces as multiple physical nRF boards.

### UART Interface Probing

For each physical board, candidate serial interfaces are opened briefly and probed for readable output.

If one interface clearly produces UART data, it is selected automatically.

Ambiguous cases fall back to explicit operator selection.

### Timestamped Run Artifacts

Measurement runs are placed into uniquely timestamped folders.

### RSSI Parsing and Visualization

The program identifies RSSI values from incoming text and uses PySide6 plus pyqtgraph for live desktop visualization.

### Cutoff Events

The source defines a `CutoffEvent` model representing transitions in which the leading board changes, retaining:

- event number;
- timestamp;
- elapsed time;
- previous/new leader;
- both RSSI values;
- pre-cutoff gap;
- gap at the transition.

This is direct evidence of turning two-board signal observations into structured events.

## Auxiliary Technical Stack

### Python

Python implements serial discovery, run management, event modeling, and GUI orchestration.

### PySerial

PySerial enumerates and reads J-Link/nRF serial interfaces.

### PySide6

PySide6 implements the desktop application UI and worker-thread signaling.

### pyqtgraph

pyqtgraph renders live RSSI data.

## Scale and Complexity

### Document Scale

The primary system maintains multiple career-specific documents across a nested taxonomy rather than one CV source.

### Build Scale

One workflow recursively compiles every matching CV source and publishes changed PDF artifacts.

### Frontend State Complexity

The browser manages authentication, hierarchical repository state, search, navigation, caching, theme/view preferences, and artifact downloads.

### Repository Breadth

The repository also preserves a separate hardware-measurement utility, demonstrating that the workspace accumulated a secondary operational tool alongside the CV system.

## Skills Demonstrated

### Document Engineering

- **LaTeX — strong evidence.**
- **Multi-document information architecture — strong evidence.**
- **Role-specific document variants — strong evidence.**

### CI / Delivery

- **GitHub Actions — strong evidence.**
- **Automated LaTeX compilation — strong evidence.**
- **Generated artifact commits — strong evidence.**
- **Path-filtered workflow triggers — strong evidence.**

### Frontend

- **HTML/CSS/JavaScript — strong evidence.**
- **Responsive application UI — strong evidence.**
- **Recursive tree navigation — strong evidence.**
- **Search and URL-state navigation — strong evidence.**
- **localStorage caching/preferences — strong evidence.**

### Authentication and APIs

- **Firebase email/password authentication — strong evidence.**
- **GitHub REST API integration — strong evidence.**
- **API error/rate-limit handling — strong evidence.**

### Auxiliary Hardware Tooling

- **nRF/J-Link serial discovery — strong evidence.**
- **Physical-device/interface disambiguation — strong evidence.**
- **PySide6 — strong evidence.**
- **pyqtgraph — strong evidence.**
- **Live RSSI visualization — strong evidence.**

## Capability Developed

The primary development represented here is treating professional documents as a maintained software-like artifact system.

Role variants are structured as source, reproducibly compiled, versioned together, exposed through a derived repository hierarchy, authenticated, cached, searchable, and downloadable as built artifacts.

## Portfolio Evolution Context

Repository 107 established the explicit career-repositioning strategy in a single LaTeX CV repository.

`CV-Highly-Organized` expands that approach into a managed family of variants with automated compilation and an application interface over the resulting artifact library.

The progression is therefore from one source-controlled CV to a reusable career-document platform organized around multiple positioning strategies.

## Historical Significance

Within the processed corpus so far, this is the earliest observed repository that combines:

- a nested multi-CV LaTeX library;
- one CI workflow compiling every CV;
- automated generated-PDF commits;
- an authenticated GitHub-backed artifact browser;
- dynamically derived repository navigation.

## Overall Repository Narrative

`CV-Highly-Organized` is a structured career-document repository that applies software-engineering practices to a growing set of LaTeX CV variants.

The repository taxonomy keeps multiple role-positioned documents on one branch. GitHub Actions compiles every `main.tex`, commits changed PDFs, and turns the repository into a source-plus-artifact store. An authenticated standalone web application then reads the recursive GitHub tree, reconstructs the hierarchy, caches it locally, supports search and responsive navigation, and downloads the current CI-built PDF with a useful timestamped filename.

The repository also contains a separate nRF RSSI measurement utility with physical-board disambiguation, serial probing, timestamped runs, and live plotting. That secondary tool is meaningful evidence, but the primary architectural story remains the CV document pipeline and artifact browser.

# Project Tags

## Project Type

- `multi-cv-library`
- `document-build-system`
- `artifact-browser`
- `individual-project`

## Languages and Formats

- `latex`
- `tex`
- `html`
- `css`
- `javascript`
- `python`

## CI and Delivery

- `github-actions`
- `ci`
- `automated-latex-pdf-build`
- `generated-artifact-commit`
- `path-filtered-ci`
- `build-artifact-evidence`

## Frontend

- `responsive-web-ui`
- `repository-tree-browser`
- `recursive-navigation`
- `search`
- `dark-mode`
- `localstorage-cache`
- `cache-then-refresh`

## Authentication and APIs

- `firebase-authentication`
- `email-password-authentication`
- `github-api`
- `github-recursive-tree-api`
- `api-rate-limit-handling`

## Document Engineering

- `role-specific-cv-variants`
- `single-branch-document-variants`
- `source-artifact-pairing`
- `reproducible-document-authoring`

## Auxiliary Hardware Tooling

- `nrf`
- `j-link`
- `serial-communication`
- `pyserial`
- `pyside6`
- `pyqtgraph`
- `rssi`
- `live-signal-plotting`
- `physical-board-disambiguation`
- `timestamped-run-folders`

## Portfolio Significance

- `earliest-observed-automated-multi-cv-latex-build-library`
- `earliest-observed-authenticated-github-cv-artifact-browser`
