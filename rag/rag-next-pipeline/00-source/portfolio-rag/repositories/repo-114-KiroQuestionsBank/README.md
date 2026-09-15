# KiroQuestionsBank

## Repository Identity

- Repository: 114 / 134
- Name: `KiroQuestionsBank`
- Repository start date: 2026-09-06
- Last meaningful update date: 2026-09-06
- Latest meaningful commit: `1f5589c22abc7d29a6d79ac017ad4c4c4ae925d3`
- Latest commit message: `fix: align D1 migration and CI setup`
- Primary type: Portable question-bank web application
- Technical field: Full-stack web engineering, schema design, data interchange, serverless APIs
- Application domain: Study tooling, reusable question-bank authoring, category import/export
- Collaboration type: `individual-project`
- Primary language: TypeScript
- Frontend: React 19 + Vite
- Backend: Hono on Cloudflare Workers
- Persistence: Cloudflare D1
- Current verification evidence: GitHub Actions build succeeds on latest commit

## Collaboration and Authorship Context

The repository is a compact owner-authored application created through a short sequence of commits on 2026-09-06.

The implementation is organized across:

- React client code;
- shared TypeScript contracts and validators;
- Hono Worker routes;
- D1 migration SQL;
- Cloudflare Worker/static-assets configuration;
- a versioned example category package;
- a GitHub Actions build workflow.

The project uses external frameworks and infrastructure including React, Hono, Vite, Cloudflare Workers, and Cloudflare D1.

The repository-specific engineering evidence is the domain model, relational schema, shared validation logic, portable import/export format, all-or-unit import construction, API design, browser authoring workflow, and deployment/build configuration built around those services.

## Evidence Basis

This analysis is grounded directly in:

- `README.md`;
- `src/shared/contracts.ts`;
- `src/worker/index.ts`;
- `src/client/App.tsx`;
- `migrations/0001_initial.sql`;
- `examples/example-category.kiroq.json`;
- `package.json`;
- `wrangler.jsonc`;
- `.github/workflows/build.yml`;
- repository commit history;
- latest GitHub Actions run.

The latest workflow run for commit `1f5589c2...` completed successfully.

The current Wrangler configuration still contains a placeholder D1 database ID, so this corpus records concrete deployment plumbing without elevating it to verified production deployment.

## What This Project Is

`KiroQuestionsBank` is a small full-stack application for creating, organizing, exporting, and importing reusable question banks.

Its most important design choice is conceptual rather than visual: the persistent model deliberately avoids treating one learning source type as the schema.

The hierarchy is:

```text
Category
   ↓
Subcategory
   ↓
Question
   ↓
Option
```

A book is one possible organizational convention, not a database entity.

For example:

```text
Category: Fundamentals of Software Architecture
Subcategory: Chapter 4 Questions
Subcategory: Chapter 5 Questions
Subcategory: Cross-Chapter Exam
```

`Chapter 4 Questions` is simply a subcategory name.

The backend does not encode chapter number, chapter metadata, or book semantics into its data model.

That keeps the application usable for:

- book-oriented study;
- topic-oriented question banks;
- course units;
- cross-topic exams;
- other category/grouping strategies.

## Domain Modeling

### Category

A category is the top-level question-bank grouping.

Persistent category fields are:

- ID;
- name;
- optional description;
- creation timestamp;
- update timestamp.

### Subcategory

A subcategory belongs to exactly one category.

It contains:

- ID;
- category ID;
- name;
- optional description;
- explicit position;
- creation timestamp.

The generic term allows the application to support chapter-question groups without pretending that the system models chapters themselves.

### Question

A question belongs to exactly one subcategory.

Persistent question fields include:

- ID;
- subcategory ID;
- question type;
- Markdown body text;
- optional Markdown explanation text;
- explicit position;
- creation timestamp;
- update timestamp.

### Option

Each question has ordered answer options.

An option stores:

- ID;
- question ID;
- Markdown body text;
- correctness flag;
- explicit position.

## Question Types

The type contract supports two question kinds:

- `mcq`;
- `multi_select`.

The same shared TypeScript union is used by the client and Worker-side validation contract.

### MCQ Invariant

An MCQ must contain:

- at least two options;
- exactly one correct option.

### Multi-Select Invariant

A multi-select question must contain:

- at least two options;
- at least two correct options.

The validator rejects invalid correct-answer cardinality before persistence.

## Shared TypeScript Contract

`src/shared/contracts.ts` defines both transport shapes and persisted API view shapes.

Portable types include:

- `PortableOption`;
- `PortableQuestion`;
- `PortableSubcategory`;
- `PortableCategory`;
- `CategoryExportFile`.

Runtime/API view types include:

- `CategorySummary`;
- `QuestionOption`;
- `Question`;
- `Subcategory`;
- `CategoryDetail`.

This keeps browser and Worker code aligned around one domain vocabulary.

## Markdown as Stored Content

Question bodies are stored in `body_markdown`.

Explanations are stored in `explanation_markdown`.

Option bodies are also represented as Markdown text in the portable contract.

The design therefore keeps source content as portable plain text with lightweight formatting semantics rather than persisting rendered HTML.

The current React question display places the stored string directly into the page rather than passing it through a Markdown renderer.

That means Markdown is currently a storage/interchange contract, not evidence of rendered rich-text presentation.

This distinction is important for accurately describing the implementation.

## Relational D1 Schema

The initial migration creates four tables:

- `categories`;
- `subcategories`;
- `questions`;
- `question_options`.

The design intentionally does not store an entire question bank as one JSON blob.

### Category Relationship

`subcategories.category_id` references `categories.id`.

The foreign key uses `ON DELETE CASCADE`.

Deleting a category therefore removes its subordinate question groups through the relational lifecycle.

### Question Relationship

`questions.subcategory_id` references `subcategories.id` with cascade deletion.

### Option Relationship

`question_options.question_id` references `questions.id` with cascade deletion.

### Type Constraint

The database constrains question type to:

```text
mcq
multi_select
```

### Correctness Constraint

`question_options.is_correct` is constrained to integer values `0` or `1`.

### Explicit Ordering

Subcategories, questions, and options each contain explicit `position` columns.

Indexes align with those ordered parent-child access patterns:

- category + subcategory position;
- subcategory + question position;
- question + option position.

This makes order a first-class part of the model rather than depending on insertion order accidentally.

## Why Relational Storage Is Appropriate Here

The application needs to:

- list categories;
- count subcategories/questions;
- read one category hierarchy;
- append subcategories;
- append questions;
- preserve option order;
- delete a full category tree.

Relational D1 tables support those operations at entity level.

Import/export JSON serves a different concern: portability across installations and workflows.

The repository therefore separates internal persistence shape from interchange shape.

## Portable Category Package

### File Identity

A category export is a versioned JSON object with:

- `schemaVersion`;
- `kind`;
- `exportedAt`;
- category content.

The fixed kind is:

`kiro-question-bank-category`.

Current schema version is `1`.

### File Suffix

Exports use:

`.kiroq.json`.

The file remains ordinary JSON while carrying a recognizable application-specific suffix.

### IDs Deliberately Excluded

Exported categories omit database IDs.

The exported package contains logical content:

- names;
- descriptions;
- question types;
- Markdown bodies;
- explanations;
- option text;
- correctness.

Fresh UUIDs are generated on import.

This avoids coupling portable content to one D1 installation's identifiers.

### Order Preserved Structurally

Array order represents:

- subcategory order;
- question order;
- option order.

On import, array indexes become explicit relational `position` values.

This translates portable ordered JSON into queryable ordered relational data.

## Versioned Interchange Design

The importer requires:

```text
schemaVersion = 1
kind = kiro-question-bank-category
```

An unsupported version is rejected explicitly.

A wrong package kind is also rejected explicitly.

The design therefore leaves room for future transport evolution without forcing all stored database rows into an opaque versioned JSON payload.

## Import Validation

### Whole-Document Validation Before Write Construction

`validateCategoryImport()` traverses the complete incoming structure before the Worker constructs persistence statements.

It validates:

- top-level object shape;
- schema version;
- package kind;
- category object;
- category name;
- optional category description;
- subcategory array;
- each subcategory object;
- subcategory name/description;
- each question;
- each option;
- question-type rules.

### Reuse of Question Validation

Imported questions use the same `validateQuestion()` logic as questions created through the normal API.

This prevents import from becoming a lower-validation bypass around interactive authoring rules.

## Import Persistence Strategy

After validation, the Worker creates fresh IDs for the entire imported hierarchy.

It collects three flat row arrays:

- subcategory rows;
- question rows;
- option rows.

The import then builds a D1 batch containing:

1. category insert;
2. optional bulk subcategory insert;
3. optional bulk question insert;
4. optional bulk option insert.

### JSON-to-SQL Bulk Expansion

Instead of issuing one prepared statement per imported entity, the Worker serializes each row collection to JSON and uses SQLite/D1 `json_each()` plus `json_extract()` to expand it into relational insert rows.

This is a compact bulk-import technique especially appropriate for a portable JSON source format.

### Unit-Oriented Batch

The category and all of its nested content are submitted through one D1 batch.

The design aims to treat a category package as one import operation rather than exposing a partially imported hierarchy to the application.

## Export Logic

`GET /api/categories/:id/export` first reconstructs the full category hierarchy from D1.

It then maps the runtime objects into the portable representation.

IDs and installation timestamps are omitted from the nested domain data.

The route sets:

- JSON content type;
- attachment `Content-Disposition`;
- sanitized lowercase file name;
- `.kiroq.json` suffix.

This makes export usable directly from the browser as a category package.

## Category Reconstruction

`readCategory()` rebuilds a nested category from relational tables.

It performs parallel queries for:

- subcategories;
- questions;
- options.

It then groups:

- options by question ID;
- questions by subcategory ID.

Finally it assembles the hierarchical `CategoryDetail` object.

This avoids an explosion of one-query-per-child reads while still returning a nested frontend-friendly structure.

## Category Listing

`GET /api/categories` returns summary records.

For each category, SQL computes:

- subcategory count;
- question count.

Categories are ordered by most recently updated, then creation time.

The frontend uses these counts to make the category sidebar informative without loading every full category first.

## Category Creation

`POST /api/categories`:

- requires an object payload;
- validates non-empty name;
- normalizes optional description;
- generates a UUID;
- inserts the category;
- returns HTTP 201 with the new ID.

## Subcategory Creation

`POST /api/categories/:id/subcategories`:

- validates category existence;
- validates name/description;
- calculates the next position from the current maximum;
- generates a UUID;
- inserts the subcategory;
- updates the parent category's `updated_at` timestamp;
- groups the writes in a D1 batch.

This makes category recency respond to edits inside the hierarchy.

## Question Creation

`POST /api/subcategories/:id/questions`:

- validates the complete question using the shared contract;
- validates subcategory existence;
- calculates the next question position;
- creates a UUID for the question;
- creates fresh UUIDs for options;
- inserts question and options;
- updates the parent category's update timestamp;
- sends the related writes through one D1 batch.

The question's correctness invariants are therefore enforced before the batch reaches persistence.

## Category Deletion

`DELETE /api/categories/:id` first checks category existence.

It then deletes the top-level category.

Relational `ON DELETE CASCADE` removes subordinate:

- subcategories;
- questions;
- options.

The route returns HTTP 204 after successful deletion.

## HTTP Error Semantics

The Worker distinguishes several common outcomes:

- malformed create/import input → HTTP 400;
- missing category/subcategory → HTTP 404;
- successful creation/import → HTTP 201;
- successful deletion → HTTP 204;
- unhandled Worker failure → HTTP 500.

A Hono `notFound` handler returns a JSON 404 response for unknown routes.

A global `onError` handler logs unexpected failures and returns a generic internal-server-error response.

## Hono Backend

The backend uses Hono as a thin HTTP framework over the Cloudflare Worker runtime.

The route layer remains small enough that domain validation and relational reconstruction are directly visible rather than hidden behind a large framework abstraction.

D1 access uses prepared statements and bound values throughout the implementation.

## API Surface

Implemented routes are:

- `GET /api/health`;
- `GET /api/categories`;
- `POST /api/categories`;
- `GET /api/categories/:id`;
- `POST /api/categories/:id/subcategories`;
- `POST /api/subcategories/:id/questions`;
- `DELETE /api/categories/:id`;
- `GET /api/categories/:id/export`;
- `POST /api/import`.

## Current API Access Model

The Worker enables CORS for `/api/*`.

Current write routes execute directly when called; the implementation does not wrap those routes in a session/role check.

This is concrete evidence about the current application boundary and is important when interpreting maturity.

The repository is therefore best understood as a personal/portable question-bank application scaffold rather than evidence of a multi-user authorization model.

## React Client

### Application Layout

The client uses a two-region working layout:

- category sidebar;
- selected-category workspace.

The top bar exposes category import.

### Category Sidebar

Each category card shows:

- category name;
- question-group count;
- question count.

Selecting a category loads its full hierarchy.

### New Category Flow

The sidebar includes inline category creation.

After creation, the client:

- refreshes category summaries;
- automatically selects the newly created category.

### Subcategory / Question-Group Flow

Inside a category, the UI uses the wording:

`Add question group / subcategory`.

Example placeholders explicitly include:

- `Chapter 4 Questions`;
- `Cross-Chapter Exam`.

This reinforces that chapter organization is a naming convention rather than a schema entity.

## Question Editor

### Type Switching

The editor offers:

- MCQ;
- Select multiple.

For MCQ, correctness controls are radio inputs.

For multi-select, correctness controls are checkboxes.

### Correctness UI Behavior

When switching to MCQ, the editor resets correctness so the first option is selected and other options are false.

Clicking an MCQ option makes that option the sole selected answer in frontend state.

Multi-select controls toggle answers independently.

Backend validation remains the authority that checks final correctness cardinality.

### Dynamic Option Count

The editor begins with four answer options.

Users can add more options.

Options can be removed while at least two remain.

This aligns the UI floor with the domain validator's minimum option count.

### Optional Explanation

The question editor provides an optional explanation field.

The browser sends empty explanation input as `null`.

### Post-Save Reset

After successful question creation, the editor resets:

- body;
- explanation;
- type to MCQ;
- default option list;
- default first correct option.

It then reloads the selected category.

## Import UI

The browser uses a hidden file input triggered by the `Import category` button.

Accepted file hints include:

- `.json`;
- `.kiroq.json`;
- `application/json`.

The browser:

1. reads the selected file as text;
2. parses JSON locally;
3. posts the parsed object to `/api/import`;
4. refreshes category summaries;
5. selects the imported category.

The browser-level JSON parse gives fast syntax failure, while the Worker still performs authoritative schema/domain validation.

## Export UI

The selected category exposes a direct browser link to:

`/api/categories/:id/export`.

The Worker responds as an attachment, so export requires no extra client-side transformation logic.

## Delete UX

Before deleting a category, the React client shows a confirmation dialog that states the category and its questions will be deleted.

After deletion, selected state is cleared and the category list is refreshed.

## Client Error Handling

A shared `api<T>()` helper:

- sends JSON content type when a request body exists;
- detects non-2xx responses;
- attempts to parse backend JSON errors;
- falls back to an HTTP-status message;
- handles 204 without attempting JSON parsing.

Feature actions expose caught errors in the application UI.

## Cloudflare Static Assets Architecture

`wrangler.jsonc` configures:

- Worker entry point `src/worker/index.ts`;
- static asset directory `./dist`;
- SPA not-found handling;
- Worker-first execution for `/api/*`.

This allows one Cloudflare application boundary to serve:

- built React assets;
- Hono API routes.

## Cloudflare D1 Binding

The Worker expects a binding named:

`DB`.

Wrangler names the intended database:

`kiro-questions-bank`.

The migration directory is explicitly configured as:

`migrations`.

The committed database ID is still the placeholder:

`REPLACE_WITH_D1_DATABASE_ID`.

This means the repository contains the deployment contract and setup flow, while final environment-specific D1 binding remains a setup step.

## Local Development

`package.json` provides concurrent frontend/API development:

```text
npm run dev
```

It starts:

- Wrangler dev on port 8787;
- Vite on port 5173.

The Vite development surface and Worker API can therefore be exercised together.

## Build Pipeline

`npm run build` executes:

1. TypeScript checking with `tsc --noEmit`;
2. Vite production build.

The build therefore rejects TypeScript errors before producing frontend assets.

## Deployment Script

`npm run deploy` executes the build and then `wrangler deploy`.

Database setup has separate scripts for:

- creating the D1 database;
- applying remote D1 migrations.

The repository documents the required manual step of replacing the placeholder database ID before deployment.

## GitHub Actions Build Verification

The repository includes a Build workflow triggered by:

- pushes to `main`;
- pull requests.

The workflow:

1. checks out the repository;
2. configures Node 22;
3. installs dependencies;
4. runs `npm run build`.

The latest workflow run for commit `1f5589c22abc7d29a6d79ac017ad4c4c4ae925d3` completed with conclusion `success`.

This provides direct evidence that the committed TypeScript/Vite application builds successfully in GitHub Actions.

## Repository Evolution

The repository history is short and explicit.

### Initial Commit

The repository is initialized on 2026-09-06.

### Full React/Hono/D1 Scaffold

Commit `79f8a90b4a2fe7a04c605031f22fc22d8a2305bb` adds the full question-bank application scaffold.

The implementation already includes:

- relational D1 schema;
- React authoring UI;
- Hono routes;
- portable JSON import/export;
- shared contracts;
- Cloudflare configuration.

### D1 / CI Alignment Fix

Commit `1f5589c22abc7d29a6d79ac017ad4c4c4ae925d3` adjusts D1 migration and CI setup.

The associated main-branch Build workflow then succeeds.

This makes the repository a compact example of taking a product concept from schema decision to build-verified implementation in a very short history.

## Architectural Decision: Do Not Encode the Book

The strongest product-modeling decision is the refusal to create a permanent chapter entity merely because one intended use case is book study.

The application instead models the stable relationship:

```text
question bank grouping
  → question group
  → question
  → answer options
```

Book/chapter terminology is kept at the user-authored naming layer.

This reduces schema connascence between:

- one content-source type;
- persistent backend entities;
- import/export format;
- frontend workflows.

A future non-book category can use the same API and schema without requiring a backend migration just to remove chapter assumptions.

## Architectural Decision: Relational Persistence, JSON Transport

The project deliberately gives persistence and portability different representations.

D1 uses normalized tables because the application needs entity-level editing, counts, ordering, and cascade behavior.

Export uses nested JSON because a portable category package benefits from:

- readability;
- easy scripting;
- easy AI/tool generation;
- independence from database IDs;
- explicit format versioning.

This is a clean separation of storage model and interchange model.

## Architectural Decision: Shared Validation

Question validation lives in the shared contract module rather than being implemented differently for interactive creation and file import.

Both paths enforce the same answer-cardinality semantics.

That prevents a common import feature failure mode where bulk input bypasses the rules used by the normal product UI.

## Architectural Decision: Fresh Identity on Import

Imported category packages receive fresh UUIDs for every persisted entity.

The application therefore treats exported IDs as non-existent rather than attempting to merge database identities from one installation into another.

For a portable question bank this keeps transfer semantics simple:

`content package → new local category tree`.

## Architectural Decision: Explicit Ordering

Position is persisted at every ordered level below category.

The exported JSON naturally preserves array order.

The importer converts that array order into persistent relational positions.

This prevents data ordering from depending on incidental UUID or timestamp order.

## Product Engineering Significance

The repository is small but conceptually disciplined.

Its useful engineering signals are not raw code volume.

They are:

- resisting unnecessary domain entities;
- separating persistence from interchange;
- using versioned import format;
- validating entire imported content before persistence;
- preserving explicit order;
- using relational cascade semantics;
- keeping shared question rules reusable across API paths;
- exposing import/export as first-class product capabilities.

## Portability Design

The `.kiroq.json` format makes a category transferable without requiring:

- original D1 row IDs;
- direct database export;
- access to the source installation.

Because the package is normal JSON, it can also be:

- generated by scripts;
- reviewed manually;
- stored in source control;
- produced by AI-assisted question-generation workflows;
- validated through the same importer.

The example file in `examples/` documents the expected package structure as a concrete artifact.

## Data Integrity Behaviors

The implementation combines multiple integrity layers:

### TypeScript Validation

- question type validation;
- non-empty strings;
- nullable-string normalization;
- option cardinality;
- correctness cardinality;
- import package version/kind validation.

### SQL Constraints

- non-null IDs/names/bodies;
- constrained question type;
- constrained correctness bit;
- foreign keys;
- cascade deletion.

### Ordered Write Logic

- next subcategory/question position derived explicitly;
- import positions derived from arrays;
- option position persisted explicitly.

This gives the data model more structure than a frontend-only question-list representation.

## Build and Maturity Boundary

The latest committed application has successful CI build evidence.

It also has concrete Cloudflare Worker, static-assets, D1 migration, and deployment scripts.

The placeholder D1 database ID is a current environment-configuration boundary.

Accordingly, the strongest defensible maturity description is:

**build-verified full-stack Cloudflare application scaffold with a complete portable question-bank workflow and deployment configuration.**

That is stronger than a UI mockup, while remaining more precise than claiming a verified production deployment.

## Skills Demonstrated

### Domain and Data Modeling

- **generic domain abstraction — strong evidence.**
- **relational schema design — strong evidence.**
- **parent-child lifecycle modeling — strong evidence.**
- **explicit ordering design — strong evidence.**
- **domain invariant validation — strong evidence.**
- **schema-level constraints — strong evidence.**

### TypeScript and Full-Stack Development

- **TypeScript — strong evidence.**
- **React 19 — strong evidence.**
- **Hono — strong evidence.**
- **shared frontend/backend contracts — strong evidence.**
- **browser API integration — strong evidence.**
- **error-state handling — strong evidence.**

### Cloudflare Backend

- **Cloudflare Workers — strong evidence.**
- **Cloudflare D1 — strong evidence.**
- **Wrangler configuration — strong evidence.**
- **D1 migration authoring — strong evidence.**
- **prepared SQL statements — strong evidence.**
- **D1 batch operations — strong evidence.**

### Import / Export Engineering

- **versioned JSON schema — strong evidence.**
- **portable package design — strong evidence.**
- **database-ID-independent export — strong evidence.**
- **whole-document import validation — strong evidence.**
- **fresh-identity import — strong evidence.**
- **JSON-to-relational bulk import — strong evidence.**
- **content-disposition export — strong evidence.**

### Product Engineering

- **question-bank authoring workflow — strong evidence.**
- **category/subcategory information architecture — strong evidence.**
- **MCQ/multi-select editor design — strong evidence.**
- **import/export as first-class product flows — strong evidence.**
- **destructive-action confirmation — strong evidence.**
- **schema-generalization reasoning — strong evidence.**

### CI and Build

- **GitHub Actions — concrete evidence.**
- **Node 22 CI environment — concrete evidence.**
- **TypeScript build gate — concrete evidence.**
- **Vite production build — concrete evidence.**
- **successful latest CI build — concrete evidence.**

## Capability Developed

`KiroQuestionsBank` shows a more defensive approach to modeling than many simpler CRUD applications.

The implementation begins by asking what part of the domain is genuinely stable.

The stable entities are not “Book” and “Chapter.”

They are category, question grouping, question, and option.

That decision reduces future backend change when the organizational meaning changes.

The second important capability is separating database concerns from transfer concerns.

D1 remains normalized and queryable, while `.kiroq.json` provides a clean portable boundary.

The importer validates the package and reconstructs a fresh local identity graph, which makes the file usable as a true transfer artifact rather than a raw database dump.

## Portfolio Evolution Context

This repository follows `my-portfolio`, where architecture governance is broad and production-oriented.

`KiroQuestionsBank` applies a similar design discipline to a much smaller domain.

The notable progression is that the project does not need a large platform to demonstrate careful architecture decisions.

Even in a compact application, the implementation explicitly addresses:

- unnecessary schema coupling;
- portable data contracts;
- shared validation;
- deterministic order;
- transactional/unit-oriented import;
- CI build verification.

It therefore provides complementary evidence: system-design thinking is being applied at small-project scale rather than only inside the large portfolio platform.

## Historical Significance

Within the processed corpus so far, repository 114 is the earliest observed project centered on a **versioned, database-ID-independent question-bank category package** that round-trips between nested JSON transport and normalized D1 storage.

It is also the earliest observed processed repository where an explicit design requirement avoids a book/chapter database model in favor of a generic category/subcategory/question hierarchy specifically to preserve reuse across different study organizations.

## Overall Repository Narrative

`KiroQuestionsBank` is a compact React/Hono/D1 application built around one careful domain decision: a question bank should model question organization, not assume that every category is literally a book and every subgroup is literally a chapter.

The application persists categories, subcategories, questions, and answer options relationally in D1. Question bodies, explanations, and options use Markdown text as their content contract. The frontend lets a user create categories, create question groups, add MCQ or multi-select questions, mark correct answers, export a category, import a package, and delete a category hierarchy.

The portable `.kiroq.json` format has explicit version and kind metadata but deliberately excludes database IDs. Export maps the relational hierarchy into nested portable content; import validates the whole package, generates fresh UUIDs, translates array order into relational positions, expands collected JSON rows through SQLite `json_each()`, and writes the resulting hierarchy through one D1 batch.

Shared TypeScript validation is reused between ordinary question creation and imported questions, preventing the import path from bypassing MCQ/multi-select correctness rules. SQL constraints and foreign-key cascades reinforce the domain model below the TypeScript layer.

The repository also includes Cloudflare static-asset/Worker routing, D1 migration configuration, deployment scripts, and a GitHub Actions build. The latest commit's workflow succeeds. Because the Wrangler D1 database ID remains a placeholder, the evidence supports a build-verified deployable scaffold rather than a claim of confirmed production deployment.

The repository's strongest signal is not size. It is disciplined generalization: encode the stable question-bank structure in the backend, keep book/chapter semantics at the naming layer, and use a separate versioned JSON transport format for portability.

# Project Tags

## Project Type

- `question-bank-application`
- `study-tool`
- `portable-content-application`
- `full-stack-web-application`
- `serverless-web-application`
- `individual-project`

## Languages and Frameworks

- `typescript`
- `react-19`
- `hono`
- `vite`
- `cloudflare-workers`
- `cloudflare-d1`
- `wrangler`
- `sql`

## Domain Model

- `category-subcategory-question-model`
- `generic-question-grouping`
- `mcq`
- `multi-select-question`
- `question-options`
- `question-explanations`
- `markdown-content-storage`
- `explicit-position-ordering`
- `cascade-delete`
- `uuid-identifiers`

## Data Integrity

- `shared-domain-validation`
- `question-cardinality-validation`
- `correct-answer-cardinality`
- `sql-check-constraints`
- `foreign-key-constraints`
- `prepared-statements`
- `d1-batch`
- `parent-updated-at-propagation`

## Import and Export

- `category-import-export`
- `versioned-json-format`
- `kiroq-json`
- `database-id-independent-export`
- `fresh-id-import`
- `whole-document-import-validation`
- `json-each-bulk-insert`
- `json-to-relational-import`
- `relational-to-json-export`
- `content-disposition-download`
- `portable-question-bank-package`

## Frontend Product Behavior

- `category-sidebar`
- `question-editor`
- `radio-correctness-control`
- `checkbox-correctness-control`
- `dynamic-answer-options`
- `file-import-ui`
- `browser-export-download`
- `delete-confirmation`
- `api-error-display`

## Cloud and Build

- `cloudflare-static-assets`
- `spa-fallback`
- `worker-first-api-routing`
- `d1-migration`
- `github-actions`
- `node-22-ci`
- `typescript-build-gate`
- `vite-production-build`
- `successful-ci-build`
- `deployment-configuration`

## Architecture and Product Design

- `relational-storage-json-transport-separation`
- `storage-interchange-separation`
- `generic-domain-abstraction`
- `book-schema-decoupling`
- `reusable-question-bank-schema`
- `versioned-interchange-contract`
- `ordered-hierarchy-reconstruction`
- `parallel-relational-read-assembly`
- `build-verified-application-scaffold`

## Portfolio Significance

- `earliest-observed-versioned-question-bank-category-package`
- `earliest-observed-d1-question-bank-import-export`
- `earliest-observed-book-schema-decoupled-question-bank`
- `earliest-observed-json-to-relational-question-bank-import`
