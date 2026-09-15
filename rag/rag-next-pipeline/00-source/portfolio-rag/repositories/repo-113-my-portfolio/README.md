# my-portfolio

## Repository Identity

- Repository: 113 / 134
- Name: `my-portfolio`
- Repository start date: 2026-08-25
- Last meaningful update date: 2026-09-07
- Latest meaningful commit: `6ada8f81f785e22e29c8f27daf147d0bc0cc5ad5`
- Primary type: Production-oriented personal portfolio and career-intelligence platform
- Technical field: Full-stack web engineering, serverless backend engineering, retrieval-augmented generation, cloud infrastructure, security, CI/CD, interactive 3D frontend engineering
- Application domain: Career evidence presentation, portfolio content management, employer-facing engineering evidence retrieval
- Collaboration type: `individual-project`
- Primary application languages: TypeScript, JavaScript, SQL
- Frontend: React 19, TypeScript, Vite, Three.js
- Backend: TypeScript Cloudflare Worker
- Persistence: Cloudflare D1
- AI/search runtime: Cloudflare Workers AI, Vectorize, D1 evidence hydration
- Deployment: Netlify frontend plus Cloudflare Worker backend

## Collaboration and Authorship Context

The repository is owner-driven and integrates the public portfolio, administration workspace, Cloudflare Worker API, D1 schema, RAG runtime, CI/CD configuration, production-quality-control records, and the Kiro 3D agent interface in one codebase.

The repository also contains generated and historical RAG artifacts derived from earlier repositories.

Those copied/generated career-evidence documents are not treated here as independent proof that this repository authored the underlying earlier projects.

The personally attributable evidence from `my-portfolio` is instead the software that:

- models and presents portfolio content;
- authenticates the owner;
- stores and moderates content;
- builds, validates, publishes, retrieves, reranks, and presents the portfolio evidence corpus;
- deploys the Worker and frontend;
- drives the Three.js/Mixamo avatar from the real RAG lifecycle.

Cloudflare, GitHub, Netlify, React, Vite, Three.js, and model providers are external platforms/libraries.

The engineering evidence is in the repository-specific architecture, integration, validation, migration decisions, orchestration, tests, frontend behavior, and operational safeguards built around those services.

## Evidence Basis

This analysis is grounded in current implementation and repository history, including:

- `package.json`;
- `wrangler.jsonc`;
- `.github/workflows/portfolio-ci-cd.yml`;
- `worker/index.ts`;
- `worker/auth.ts`;
- `worker/milestones-repository.ts`;
- `worker/opinions-repository.ts`;
- `worker/validation.ts`;
- `worker/rag-runtime.ts`;
- `worker/__tests__/`;
- `migrations/0001-initial-portfolio-schema.sql` through `0005-rag-runtime.sql`;
- `src/admin/`;
- `src/features/kiro-rag/`;
- `rag/runtime/build-d1-rag-import.mjs`;
- current RAG architecture documentation;
- production RAG acceptance evidence dated 2026-09-06;
- repository commit history through 2026-09-07.

The current implementation supersedes several older design documents and historical runtime files.

Where a historical artifact conflicts with current code, current implementation is authoritative and the evolution is documented explicitly.

## What This Project Is

`my-portfolio` is a deployable personal career platform rather than a static résumé site.

It combines four major product concerns:

1. a public chronological career/engineering portfolio;
2. an owner-only content-management surface;
3. moderated visitor opinions;
4. an evidence-grounded portfolio RAG agent with an interactive 3D character layer.

The product's unusual architectural feature is that it consumes structured evidence derived from the broader repository portfolio and exposes that evidence through a retrieval system designed to preserve provenance and uncertainty.

The portfolio therefore acts both as a presentation application and as a queryable engineering-evidence system.

## Current System Shape

The deployed system is organized as:

```text
Visitor / owner browser
        ↓
Netlify
React 19 + TypeScript + Vite
        ↓
Cloudflare Worker
        │
        ├── public portfolio API
        ├── GitHub OAuth / admin API
        ├── opinions moderation API
        └── portfolio RAG API
        │
        ├── Cloudflare D1
        ├── Cloudflare Vectorize
        └── Cloudflare Workers AI
```

The RAG request path adds:

```text
question
   ↓
input validation + client rate limit
   ↓
Qwen3 query embedding
   ↓
Vectorize top 40 candidates
   ↓
D1 evidence hydration
   ↓
BGE reranking top 20
   ↓
evidence-aware / repository-diverse top 8
   ↓
GLM-4.7-Flash grounded synthesis
   ↓
answer + citations + retrieval diagnostics
```

The streaming endpoint returns the same retrieval context through Server-Sent Events before and during generation.

## Frontend Application

### React 19 Application

The current frontend uses React `19.1.1` and React DOM `19.1.1` with TypeScript and Vite.

The application routes among public portfolio surfaces and private owner surfaces without introducing a heavy routing framework.

The route set includes:

- the public timeline;
- milestone detail views;
- skills;
- opinions;
- Kiro RAG;
- admin;
- OAuth callback handling.

### Timeline as a Narrative Interface

The main portfolio is modeled as a chronological sequence of milestones rather than a flat list of cards.

Milestones are loaded from the Worker and contain structured date, title, summary, expanded context, images, and optional long-form sections.

The interface supports reversible reveal behavior as the reader moves through the timeline.

The implementation also supports vertical and horizontal timeline presentation.

This makes chronology an interaction model rather than merely a metadata field.

### Seasonal Presentation

The timeline includes season-aware visual transitions tied to the active milestone period.

The implementation uses restrained seasonal effects rather than placing unrelated animations on every navigation event.

Reduced-motion preferences are considered so decorative motion does not become a required interaction dependency.

### Skills Surface

The skills page presents capability evidence associated with source projects rather than reducing skills to an unsupported technology-name list.

The current skills data is versioned in frontend source and supports a visual evidence panel alongside a scrolling capability presentation.

This is an early example inside the product of the same evidence-first philosophy later formalized in the RAG subsystem.

### Responsive Behavior

The application contains separate layout handling for desktop and smaller screens.

Interactive views such as the skills feed, timeline, opinions, and Kiro chat adapt their layout rather than assuming one fixed viewport.

### Reduced-Motion Support

Multiple interaction surfaces recognize `prefers-reduced-motion`.

The implementation therefore distinguishes information-bearing state from decorative animation.

## Public Milestone Content Model

### Milestone Records

D1 stores milestone-level fields including:

- unique slug;
- year;
- month;
- title;
- short description;
- expanded description;
- detail Markdown;
- display order;
- publication state;
- publication timestamp;
- creation/update timestamps.

### Ordered Long-Form Sections

Milestones can own ordered content sections with:

- optional heading;
- Markdown body;
- deterministic display order.

This allows a timeline item to expand into a richer career story without changing the top-level milestone schema for every paragraph.

### Published / Draft Boundary

Public milestone listing filters to `is_published = 1`.

Public milestone detail also requires the requested milestone to be published.

The admin path can access both draft and published records.

### Publication Timestamp Semantics

When a milestone is first published, the service records a publication timestamp.

Editing an already-published milestone preserves the existing publication timestamp.

Unpublishing clears the public timestamp.

That treats publication as a lifecycle state rather than an arbitrary boolean with no history context.

## D1 Image Storage

### Architectural Migration Away from R2

The initial D1 schema represented milestone images through an `r2_key`.

A later migration explicitly renames the legacy image table, recreates it with Base64 image columns, migrates the schema boundary, and removes the old R2 table.

The current application intentionally stores milestone image content in D1.

CI contains a policy check that rejects reintroduction of active R2 integration.

This is therefore a completed architecture migration rather than an unused alternate design.

### Current Image Schema

Milestone images contain:

- milestone foreign key;
- MIME type;
- Base64 data;
- decoded byte size;
- alt text;
- optional caption;
- display order;
- cover flag;
- creation timestamp.

### Image Size Boundary

The application limits raw image data to 1,310,720 bytes.

The validation comment explicitly relates this to D1's row-size constraint and Base64 expansion overhead.

This is a concrete example of adapting application behavior to datastore limits rather than ignoring infrastructure constraints.

### Supported Image Formats

Validation accepts:

- AVIF;
- GIF;
- JPEG;
- PNG;
- WebP.

The same MIME constraint also exists at the schema level.

### Single Cover Invariant

A partial unique index ensures at most one image is marked as cover for a milestone.

The repository layer also validates cover count.

When a newly added image is explicitly designated cover, existing cover flags are cleared first.

### Binary Public Delivery

Public APIs do not expose the Base64 image body inside milestone JSON.

Instead, milestone payloads expose an image URL.

`GET /api/images/:id`:

- verifies that the image belongs to a published milestone;
- loads the D1 Base64 data;
- decodes it into binary;
- returns the stored MIME type;
- returns content length;
- applies cache and `nosniff` headers.

This keeps the storage representation separate from the public representation.

## Cloudflare Worker API

### Worker Entry Point

`worker/index.ts` is the application API entry point.

It separates request handling into:

- public routes;
- authentication routes;
- administration routes;
- RAG routes.

Repository modules isolate persistent milestone and opinion behavior from the routing layer.

### Public API Surface

Implemented public routes include:

- `GET /api/health`;
- `GET /api/milestones`;
- `GET /api/milestones/:slug`;
- `GET /api/images/:id`;
- `GET /api/opinions`;
- `POST /api/opinions`;
- `GET /api/rag/health`;
- `POST /api/rag/query`;
- `POST /api/rag/query/stream`.

### Administration API Surface

Authenticated administration supports:

- list milestones;
- create milestones;
- load one milestone;
- update milestones;
- delete milestones;
- replace ordered milestone sections;
- replace image sets;
- add one image;
- delete one image;
- list opinion submissions;
- approve/reject opinions;
- delete opinions.

### Health Endpoint

The general health endpoint executes a D1 query before reporting success.

This checks the application's persistence path rather than returning a constant response.

## GitHub OAuth Administrator Model

### Owner-Only Administration

The product does not build a broad public account system for portfolio administration.

The private administrative identity is delegated to GitHub OAuth and then restricted to one configured GitHub numeric user ID.

### OAuth Start

The Worker constructs a GitHub authorization URL containing:

- client ID;
- callback URL;
- `read:user` scope;
- signed state.

### Signed OAuth State

OAuth state contains a random nonce and issue time.

It is HMAC-SHA256 signed using the session secret.

The callback rejects malformed, incorrectly signed, future-dated, or expired state.

The maximum state age is ten minutes.

### Server-Side Code Exchange

The GitHub authorization code is exchanged server-side.

The browser never needs the GitHub client secret.

The Worker then calls GitHub's authenticated-user endpoint.

### Immutable Numeric Identity Check

Authorization compares the returned GitHub numeric user ID against `ADMIN_GITHUB_USER_ID`.

The username is preserved for display/session context, but authorization is not anchored to a mutable username string.

### One-Time Browser Handoff

After successful OAuth verification, the Worker does not put an admin bearer session directly into the OAuth redirect URL.

It creates a random one-time exchange code.

Only the SHA-256 hash of that code is stored in D1.

The code expires after two minutes.

The frontend exchanges it once for the signed admin session.

### Exchange Consumption

D1 lookup and deletion are issued together through a batch.

A missing or expired exchange code is rejected.

This creates an explicit short-lived handoff between third-party OAuth and application session issuance.

### Signed Admin Session

The issued admin token contains:

- GitHub user ID;
- login name;
- issue time;
- expiry time;
- fixed audience.

It is HMAC signed.

The session lifetime is one hour.

Verification checks:

- signature;
- audience;
- allowed GitHub numeric ID;
- login presence;
- timestamps;
- expiration.

### Secret Strength Requirement

`SESSION_SECRET` must contain at least 32 characters.

Missing OAuth/session configuration produces explicit service-configuration failures rather than silently weakening authentication.

### Bearer Authorization

Administrative routes require a bearer session.

The Worker centralizes the requirement through `requireAdminSession()` before executing admin behavior.

## Browser-Origin Restrictions

The Worker marks security-sensitive browser routes as restricted.

This group includes:

- `/api/admin/*`;
- `/api/rag/*`;
- `/api/auth/exchange`;
- `/api/auth/session`;
- opinion submission.

The request origin is checked before those routes execute.

Preflight responses use the same restricted/public distinction.

This complements bearer authentication by controlling which browser origin is expected to exercise sensitive application paths.

## Opinions Product Workflow

### Visitor Submission

Visitors can submit:

- display name;
- optional relationship/context;
- opinion text;
- explicit publication consent.

### Explicit Consent Requirement

The input validator requires `consentToPublish = true`.

The D1 schema also constrains `consent_to_publish` to `1`.

A submission lacking consent is rejected rather than silently stored for later publication.

### Moderation Before Publication

New submissions are inserted as `pending`.

The public query returns only `approved` records.

The admin can set an opinion to:

- approved;
- rejected.

Review time is stored when moderation occurs.

This separates receiving a person's statement from deciding to display it publicly.

### Lightweight Bot Signal

The opinion form contains a `website` honeypot field.

A populated honeypot causes the submission to be rejected.

This adds a bot signal without adding a separate identity-collection requirement to the public feedback flow.

### Public Data Minimization

The public opinion representation exposes the fields needed for the displayed testimonial/opinion.

Moderation status and review metadata are retained for administration rather than serving as ordinary public content.

## Admin Workspace

### Milestone Authoring

The React admin workspace supports portfolio maintenance without direct D1 editing.

The owner can manage:

- timeline metadata;
- short and expanded descriptions;
- long-form Markdown;
- publication state;
- deterministic ordering;
- ordered sections;
- image uploads;
- captions;
- cover designation.

### Opinion Moderation

A dedicated panel loads submissions and exposes explicit moderation actions.

Pending submissions receive operational priority in the admin ordering.

### OAuth Callback Surface

A dedicated React callback page consumes the short-lived exchange code and establishes the application session.

This keeps OAuth redirect handling separate from normal admin editing UI.

## Milestone Validation

The Worker validates milestone writes before persistence.

Implemented rules include:

- year between 1900 and 2100;
- month between 1 and 12;
- required title and descriptions where applicable;
- normalized lower-case slug;
- slug limited to letters, numbers, and single hyphen separators;
- integer display order;
- explicit boolean publication state.

Ordered sections are validated as structured arrays.

Image payloads are validated independently.

## Opinion Validation

Visitor opinion input validates:

- display name presence and maximum length;
- optional relationship length;
- opinion length between 12 and 600 characters;
- explicit publication consent;
- empty honeypot.

Moderation input is limited to `approved` or `rejected`.

These rules exist in executable Worker code in addition to D1 constraints.

## RAG Corpus Model

### Authoritative Runtime Evidence in D1

The production runtime stores evidence documents in `rag_documents`.

Each document preserves structured retrieval metadata including:

- document ID;
- repository index;
- repository name;
- repository slug;
- repository URL;
- retrieval class;
- semantic area;
- evidence polarity;
- evidence level;
- specificity score;
- concrete-signal count;
- word count;
- evidence text;
- topics;
- evidence areas;
- related skill ratings;
- source fragments;
- provenance.

### Corpus Metadata

`rag_corpus_meta` stores:

- corpus key;
- document count;
- repository count;
- document SHA-256;
- document schema version;
- import timestamp.

This gives the Worker a compact way to verify that the database contains the expected corpus identity and size.

### Fixed Production Corpus Contract

The current runtime expects:

- 2,808 evidence documents;
- 134 repositories.

RAG health and query paths check that contract before treating the corpus as ready.

## RAG Publishing Pipeline

### D1 Evidence Build

`rag/runtime/build-d1-rag-import.mjs` converts finalized retrieval documents into a D1-compatible SQL import.

The builder verifies the exact 2,808-document / 134-repository corpus before generating runtime SQL.

### Bounded Table Ownership

The generated import replaces only the dedicated RAG runtime tables.

It does not mutate:

- milestones;
- opinions;
- authentication handoff state;
- Vectorize vectors;
- historical Pinecone artifacts.

This is an important operational boundary: publishing evidence is not allowed to rewrite unrelated portfolio content.

### Deterministic Rebuild

Rebuilding from the same finalized evidence is deterministic apart from the import timestamp.

Corpus identity is tracked through SHA-256 metadata.

### Separation from Embedding Publication

The D1 evidence import does not regenerate embeddings.

Vector generation/index publication is a separate concern.

That separation allows text/provenance persistence and vector serving to be validated independently.

## Cloudflare-Native RAG Runtime

### Query Embedding

The current production embedding model is:

`@cf/qwen/qwen3-embedding-0.6b`.

The runtime requires a 1,024-dimensional query vector.

Embedding output is normalized and rejected if it contains:

- non-finite values;
- zero norm;
- an unrecognized response shape.

### Dense Retrieval

Vectorize index `portfolio-career-rag-cloudflare-v1` is queried for 40 candidates.

The query returns candidate IDs/scores while authoritative text remains in D1.

### D1 Hydration

Candidate IDs are resolved to D1 evidence rows.

The runtime checks for a meaningful correspondence between Vectorize candidates and D1 documents.

A major ID mismatch fails rather than generating against partially incoherent evidence.

### Reranking

The hydrated candidate texts are reranked with:

`@cf/baai/bge-reranker-base`.

The runtime asks for the top 20 reranked contexts.

Reranker response indexes and scores are validated before being accepted.

### Evidence-Aware Selection

The final selection step is not simply “take the first eight reranker rows.”

The code adds bounded evidence bonuses according to metadata.

Positive selection signals include:

- implemented/concrete evidence;
- repository-specific evidence;
- direct-evidence retrieval class;
- higher specificity.

Conceptual exposure receives a penalty relative to concrete implementation evidence.

### Limitation-Aware Questions

The query is inspected for limitation-oriented intent such as:

- limitation;
- weakness;
- gap;
- missing;
- risk;
- failure;
- what was not demonstrated.

For those questions, limitation-class and negative-polarity evidence receive additional selection weight.

This prevents a “portfolio assistant” from systematically hiding negative evidence when the visitor explicitly asks where evidence is weak.

### Cross-Repository Diversity

Final evidence selection first caps how many documents can come from one repository.

It uses staged repository caps before filling any remaining slots.

This reduces the chance that one large repository monopolizes the evidence set when several projects are relevant.

### Final Evidence Count

Up to eight documents are selected for generation.

The generator receives structured labels `E1` through `E8` along with repository and evidence metadata.

## Grounded Generation

### Generation Model

The current production generation model is:

`@cf/zai-org/glm-4.7-flash`.

### Grounding Contract

The system prompt explicitly tells generation to:

- use only supplied portfolio evidence;
- not invent technologies;
- not invent ownership;
- not invent scale;
- not invent dates;
- not invent production status;
- not invent responsibilities;
- not invent outcomes;
- not invent seniority claims;
- preserve evidence distinctions;
- say when evidence is insufficient;
- cite factual claims with `[E#]` labels;
- respect evidence that explicitly bounds or denies a claim.

This is a repository-specific anti-overclaim contract, not generic chatbot wording.

### Generation Configuration

Generation uses:

- temperature `0.2`;
- top-p `0.9`;
- maximum completion budget `700` tokens;
- model thinking disabled.

### Reasoning-Content Boundary

The response parser recognizes visible answer shapes while deliberately refusing to expose provider `reasoning_content` as the user-facing answer.

A reasoning-only response with no visible answer is treated as invalid.

The same rule is applied to streaming deltas.

## RAG Citation Model

Each selected evidence item is converted to a citation object containing:

- evidence label;
- document ID;
- repository index;
- repository name;
- repository URL;
- retrieval class;
- semantic area;
- polarity;
- evidence level;
- specificity score;
- dense score;
- rerank score;
- source-fragment provenance.

Source fragments can preserve:

- section title;
- section path;
- source line start/end;
- text SHA-256.

This allows the frontend to expose not only “which repository,” but where the retrieved evidence came from inside its analyzed source.

## RAG Grounding Warning

After generation, the runtime extracts valid `[E#]` labels from the answer.

If no valid evidence citation is emitted, the response still returns the evidence but sets a grounding warning.

This distinguishes “retrieval supplied grounding” from “the generated prose actually cited it.”

## Synchronous RAG API

`POST /api/rag/query` performs the full retrieval and generation chain and returns:

- answer;
- citations;
- retrieval diagnostics;
- cited evidence labels;
- grounding warning;
- model identities.

The production acceptance record dated 2026-09-06 validates this synchronous path end to end.

## Streaming RAG API

### Server-Sent Events

`POST /api/rag/query/stream` performs the same retrieval/reranking path and then requests streamed generation.

The Worker emits normalized SSE events:

- `context`;
- `token`;
- `done`;
- `error`.

### Context Event

The context event is emitted after retrieval and contains:

- citation objects;
- vector candidate count;
- hydrated D1 document count;
- reranked document count;
- selected evidence count;
- model identities.

The browser can therefore show retrieval context before the complete generated answer exists.

### Token Event

Visible generation deltas are normalized into `token` events.

Provider bookkeeping frames and reasoning-only fields are not forwarded as answer text.

### Done Event

The final event contains:

- cited evidence labels;
- grounding warning.

### Streaming Verification Boundary

Current code and later feature documentation show that `/kiro-rag` calls this SSE route.

The available formal production acceptance record, however, explicitly certifies the synchronous backend route rather than claiming equivalent live acceptance coverage for streaming.

The corpus therefore records streaming as implemented and integrated while preserving the narrower scope of formal acceptance evidence.

## Browser RAG Client

### SSE Parser

`rag-client.ts` implements browser-side parsing for named SSE frames.

It supports CRLF/LF frame boundaries and multi-line data payload handling.

Malformed JSON reports which RAG event failed to parse and retains the underlying error as a cause.

### Abort Support

The streaming request accepts an `AbortSignal`.

The chat owns an `AbortController` for the active turn.

The user can stop generation instead of being forced to wait for completion.

### Incomplete Stream Detection

If the stream terminates without a `done` event and was not intentionally aborted, the client reports an incomplete-stream error.

That distinguishes successful network closure from protocol completion.

## Kiro Agent Chat

### Session-Local Conversation Presentation

The browser keeps a visual history of submitted turns during the current page session.

The backend does not pretend that those earlier turns are model memory.

Each question is independently retrieved and grounded against the portfolio corpus.

This keeps UI continuity separate from model-state claims.

### Turn State Machine

A turn moves through explicit statuses:

- retrieving;
- answering;
- complete;
- error;
- stopped.

### Suggested Questions

The UI provides starter prompts oriented around portfolio evidence, including:

- strongest backend engineering;
- testing-discipline evolution;
- product ownership beyond coding;
- weak portfolio evidence.

The inclusion of a “where is evidence weakest?” prompt aligns the interaction model with the limitation-aware retrieval policy rather than presenting the portfolio only as promotion.

### Streaming Answer Rendering

Visible answer text is appended as tokens arrive.

The UI handles lightweight headings, bullets, emphasis, and inline evidence labels.

### Citation Navigation

Inline `[E#]` references become links when the corresponding citation exists.

Selecting one opens/scrolls to the associated source evidence card.

### Cited Versus Considered Evidence

The source drawer distinguishes evidence the model actually cited from evidence that was retrieved and considered.

This avoids implying that every top-eight candidate directly supports the final answer.

### Retrieval Activity Trace

A collapsible activity panel shows counts for:

- retrieved vector candidates;
- reranked evidence;
- selected evidence notes.

The UI also exposes the broad model sequence.

This makes the retrieval process inspectable to a visitor without exposing infrastructure credentials.

### Stop and Regenerate

The active request can be stopped.

Stopped or failed turns can be regenerated using the same question.

### Composer Behavior

The chat supports:

- persistent bottom composer;
- Enter to send;
- Shift+Enter for newline;
- minimum question length;
- disabled sending while another turn is active.

### Scroll Behavior

Auto-follow is conditional.

The chat keeps following new output while the reader remains near the bottom, but stops forcing scroll position after the reader intentionally moves away.

This is a small but meaningful modern streaming-chat interaction detail.

## RAG Rate Limiting

The Worker binds a Cloudflare rate limiter for portfolio RAG requests.

Current configuration is:

- 10 requests;
- per 60 seconds;
- keyed by client IP in the runtime.

Both synchronous and streaming query paths enforce the rate limit before expensive retrieval/generation work.

## RAG Production Validation

### Embedding Acceptance

The recorded Cloudflare Workers AI embedding acceptance shows:

- 2,808 documents;
- 134 repositories;
- Qwen3 embedding model;
- 1,024 dimensions;
- 2,808 valid vectors;
- no missing vectors;
- no duplicate IDs;
- no NaN/Inf values;
- no zero vectors.

### Vectorize Publication Acceptance

The recorded index checks include:

- 2,808 / 2,808 remote vectors;
- exact remote ID-set match;
- stored-vector round-trip samples;
- compact metadata round-trip.

### Dense Retrieval Parity

Canonical query comparisons against exact local cosine recorded:

- minimum overlap@10: 100%;
- minimum overlap@25: 96%;
- minimum overlap@50: 100%.

This is stronger evidence than merely confirming that the Vectorize API returned some results.

### Local D1 Corpus Acceptance

Local validation recorded:

- 2,808 documents;
- 2,808 unique document IDs;
- 134 repositories;
- repository indices 1 through 134;
- no invalid required rows;
- no invalid JSON fields;
- no inconsistent repository mappings;
- corpus schema version 2.0.0;
- source corpus SHA-256 identity.

### Remote D1 Acceptance

The same core corpus invariants were checked after remote import.

The remote metadata SHA matched the authoritative source corpus.

### Worker Health Acceptance

The validation record reports:

- repository verification pass;
- Worker dry-run pass;
- Worker deployment pass;
- `GET /api/rag/health` HTTP 200;
- expected document count;
- expected repository count;
- expected Vectorize index name.

### First Live Query Failure

The first production synchronous query reached generation and returned HTTP 502 `generation_invalid`.

Because retrieval occurs before generation, the failure localized the problem after:

- query embedding;
- Vectorize search;
- D1 hydration;
- BGE reranking;
- evidence selection.

The error was therefore used diagnostically rather than being hidden as a generic RAG failure.

### GLM Response Correction

The correction disabled model thinking and hardened answer parsing to:

- accept legitimate visible strings;
- accept visible text/output-text blocks;
- normalize streaming deltas;
- reject reasoning-only output;
- never promote `reasoning_content` to visible answer text.

### Successful Live Query

After the fix, the acceptance record reports:

- verification pass;
- 64 / 64 tests passing;
- 11 / 11 test files passing;
- Worker dry-run pass;
- Worker deployment pass;
- `POST /api/rag/query` HTTP 200;
- approximately 10-second client latency for the recorded query;
- 22 ms Worker CPU time in the recorded request;
- no grounding warning.

The response included:

- grounded answer;
- eight evidence objects;
- inline cited labels;
- repository names/URLs;
- dense scores;
- rerank scores;
- source-fragment provenance;
- retrieval diagnostics;
- model identities.

## Retrieval-Quality Policy

The production record makes an explicit distinction between retrieval and final answer quality.

For the accepted backend-engineering query, some lower-ranked selected evidence was weaker than the strongest results.

The generator did not mechanically summarize every selected document.

The accepted policy is that:

- strong relevant evidence must be present;
- generation remains bounded to supplied evidence;
- weak retrieved evidence may be ignored;
- unsupported claims must not be invented;
- provenance remains inspectable.

This reflects a practical RAG architecture where retrieval candidates do not automatically become assertions.

## RAG Unit Testing

`worker/__tests__/rag-runtime.test.ts` directly tests retrieval/generation utility behavior.

### Query Validation Tests

Tests cover trimming valid questions and rejecting missing/oversized input.

### Repository-Diversity Test

A test verifies that evidence selection diversifies repository coverage before filling multiple slots from one repository.

### Limitation-Intent Test

A test verifies that limitation evidence can outrank a marginally higher positive result when the question explicitly asks about limitations or missing production evidence.

### Citation Extraction Test

The runtime extracts unique valid evidence labels and ignores labels outside the available evidence range.

### Generation Normalization Tests

Tests cover:

- ordinary chat-completion strings;
- legitimate visible text blocks;
- visible answer plus hidden reasoning metadata;
- rejection of reasoning-only responses;
- streaming text-block normalization;
- exclusion of reasoning deltas.

### Generation-Configuration Test

The suite fixes the expected generation configuration, including disabled thinking and the completion budget.

## Broader Worker Testing

The Worker test directory also contains focused suites for:

- authentication;
- router behavior;
- validation;
- RAG runtime.

The recorded production acceptance run reports 64 tests across 11 test files for the repository as a whole at that point.

## CI Quality Gate

The GitHub Actions workflow executes on pull requests and main-branch pushes.

The quality job runs before deployment.

Its steps include:

- dependency installation;
- legacy JavaScript migration rejection;
- active R2 integration rejection;
- legacy permanent-admin-token rejection;
- ESLint;
- frontend and Worker TypeScript checks;
- tests;
- local D1 migration validation;
- production frontend build;
- Worker dry-run bundle.

Deployment is gated on this quality job.

## Architecture Policy Checks

### Legacy Migration Guard

A repository script rejects legacy JavaScript migration files that should no longer participate in the active architecture.

### No-R2 Guard

A script rejects active object-storage integration after the deliberate move to D1-backed Base64 images.

### No-Legacy-Auth Guard

A script rejects reintroduction of the old permanent admin-token authentication path.

These checks are significant because they encode architectural decisions as executable repository policy.

They reduce the chance that old implementation paths quietly re-enter production during later maintenance.

## CI/CD Deployment Ordering

### Worker Deployment

On an eligible main-branch push after the quality gate:

1. Cloudflare deployment secrets are checked;
2. dependencies are installed;
3. remote D1 migrations are applied;
4. the Worker is deployed.

### Frontend Deployment

The Netlify deployment job depends on successful Worker deployment.

It then:

1. validates Netlify credentials;
2. installs dependencies;
3. builds the production frontend;
4. deploys the prebuilt `dist` directory to production.

This ordering reduces the chance that a newly deployed frontend expects backend/schema behavior that has not yet been deployed.

## Cloudflare Configuration

`wrangler.jsonc` declares the production runtime dependencies rather than leaving them implicit.

Bindings include:

- `DB` for D1;
- `AI` for Workers AI;
- `RAG_INDEX` for Vectorize;
- `RAG_RATE_LIMITER`;
- frontend origin;
- GitHub callback URL.

Worker observability is enabled in the Wrangler configuration.

## Historical RAG Migration

### Initial Corpus / Retrieval Work

Repository history shows an initial corpus, embedding, retrieval, and architecture phase.

### Pinecone-Backed Runtime

A Python/Pinecone runtime was then introduced and is still preserved under historical RAG files.

It is not the current production request path.

### Cloudflare-Native Migration

The architecture later migrated toward:

- Cloudflare Workers AI for embeddings;
- Cloudflare Vectorize for dense retrieval;
- D1 for authoritative evidence text/provenance;
- BGE reranking;
- GLM generation;
- TypeScript Worker orchestration.

This removed the historical Python runtime from the deployed request path.

### Why the Historical Files Matter

The older runtime remains useful as migration/regression history.

Its presence is not treated as evidence that production depends on Python or Pinecone today.

The current Worker, package scripts, deployment configuration, and production acceptance evidence establish the active architecture.

## Kiro Avatar Evolution

Repository history shows multiple avatar approaches rather than one final model appearing immediately.

The sequence includes:

- 2D avatar foundation;
- articulated React rig;
- continuous 2D deformation model;
- Three.js GLB runtime and controlled-animation backbone;
- Mixamo-ready FBX runtime;
- lifecycle-driven procedural motion.

This demonstrates iterative replacement of presentation architecture while preserving the broader Kiro product concept.

## Three.js / FBX Runtime

### Current Asset Contract

The active avatar asset is:

`public/models/kiro/kiro.fbx`.

The runtime loads it through Three.js `FBXLoader`.

The historical component filename `kiro-glb-avatar.tsx` is retained for compatibility even though the active loader now targets FBX.

### Skeleton Resolution

The 3D subsystem contains model contracts, skeleton/bone alias resolution, diagnostics, inspection utilities, and an animation controller.

The runtime can address meaningful body regions such as:

- head;
- spine;
- upper arms;
- forearms.

### Controlled Animation Boundary

The language model is not given arbitrary direct control of skeleton joints.

Application lifecycle state chooses animation semantics.

This creates a strong boundary between generated language and physical/visual character behavior.

### Procedural Motion

The supplied FBX is treated primarily as a rigged master pose rather than a complete conversational animation library.

The controller therefore implements bounded procedural movement including:

- calmer standing arm posture from the rig's base pose;
- subtle idle breathing;
- attentive retrieval behavior;
- alternating arm/head motion while answering;
- pointer-follow gaze;
- success reaction;
- error reaction.

### Semantic Clip Compatibility

The controller can also resolve meaningful authored animation clip names such as:

- Idle;
- Talking;
- Thinking;
- Success.

If compatible authored clips are added, the architecture can prefer them over procedural movement.

### Facial Animation Boundary

The current model does not expose a verified facial blend-shape/viseme contract.

The implementation therefore limits current claims to body/head animation rather than pretending to provide phoneme-accurate lip sync.

This is a concrete evidence boundary based on the asset contract.

## Real RAG Lifecycle Drives Avatar Motion

The avatar is connected to real chat state rather than an independent demo timer.

The lifecycle is:

```text
question submitted
   ↓
retrieving
   ↓
SSE context received
   ↓
answering
   ↓
visible token stream
   ↓
SSE done
   ↓
success
```

Failure transitions to `error`.

User cancellation returns toward idle/stopped behavior.

### No Artificial Waiting Delay

The feature documentation explicitly avoids delaying RAG responses merely to make animation more visible.

The visual layer follows system work rather than making system work slower for presentation.

### Reduced Motion

The avatar honors reduced-motion preferences.

This preserves the agent-presence concept without making motion mandatory for understanding state.

## Data and Trust Boundaries

### Browser Boundary

The browser calls the portfolio Worker.

It does not receive direct Vectorize, D1, or Workers AI credentials.

### OAuth Boundary

GitHub OAuth client-secret handling and identity verification occur in the Worker.

### Public / Admin Data Boundary

Public milestone endpoints expose published content only.

Admin endpoints require owner authentication.

### Opinion Publication Boundary

Visitor submission and public publication are separate states.

Explicit consent is required before a submission can enter the moderation workflow.

### RAG Evidence Boundary

Vectorize stores/searches vectors, while D1 stores authoritative evidence text/provenance.

The generator receives a bounded set of selected evidence rather than direct unrestricted database access.

### Avatar Control Boundary

Chat lifecycle drives semantic animation state; the language model does not manipulate bones directly.

These boundaries collectively keep external services and generative output subordinate to explicit application-controlled interfaces.

## Product Engineering Decisions

### Portfolio as a Living System

Milestones are data-driven and owner-editable rather than hard-coded permanently into page structure.

This allows the public career narrative to evolve without rebuilding every content component.

### Evidence Rather Than Self-Rating Alone

The skills and RAG surfaces emphasize source project evidence and provenance.

The system attempts to answer “what supports this claim?” rather than only displaying a confidence score.

### Negative Evidence Can Be Retrieved

Limitation-oriented questions receive dedicated retrieval handling.

This is a notable product choice for a portfolio application because the assistant is not designed solely to maximize promotional positivity.

### Inspectable RAG

The chat reveals citations, source repositories, provenance lines, and retrieval counts.

The user can inspect the basis of an answer instead of being asked to trust opaque generated prose.

### Moderated Human Contributions

Public opinions are not automatically published upon submission.

Consent and moderation preserve a distinction between what a visitor sends and what becomes part of the public portfolio.

## Engineering Evolution Inside the Repository

### Stage 1 — Interactive Portfolio

The early repository work establishes the React portfolio, timeline presentation, milestone interactions, skills presentation, responsive behavior, and visual chronology.

### Stage 2 — Public Opinions and Owner Administration

D1-backed content and moderated opinion workflows expand the product from read-only presentation toward managed public interaction.

GitHub OAuth establishes an owner-administration boundary.

### Stage 3 — Kiro Visual Identity

The Kiro concept begins as a 2D avatar and moves through progressively richer articulated representations.

### Stage 4 — Evidence Corpus and RAG Prototype

The repository gains a large portfolio evidence corpus, embeddings, retrieval tooling, and an initial Pinecone-backed runtime.

### Stage 5 — Cloudflare-Native RAG

The production architecture migrates to Workers AI, Vectorize, D1 evidence hydration, BGE reranking, and GLM generation inside the Worker.

### Stage 6 — Production Debugging and Acceptance

The live synchronous RAG path is validated, a generation-response incompatibility is isolated and corrected, and a successful cited production answer is recorded.

### Stage 7 — Streaming Agent Interface

The browser chat is connected to the Worker SSE route with stop/retry, source drawers, retrieval diagnostics, and streaming output.

### Stage 8 — Lifecycle-Driven Mixamo Avatar

The Kiro agent presence moves to a validated Mixamo-rigged FBX and procedural lifecycle motion connected to actual retrieval/generation state.

## Testing Discipline

The strongest testing evidence in this repository is layered rather than one single test suite.

It includes:

- unit tests for pure/runtime logic;
- Worker router/auth/validation tests;
- local D1 migration validation;
- compile/type checks for frontend and Worker;
- linting;
- Worker dry-run bundling;
- deterministic corpus validation;
- Vectorize publication validation;
- dense retrieval parity checks;
- local and remote D1 corpus checks;
- live Worker health verification;
- recorded production RAG query acceptance.

This is a significant progression beyond repositories where correctness is established only through local manual execution.

## Failure Diagnosis Evidence

The 2026-09-06 RAG acceptance record is especially useful because it preserves a failed production query before the successful one.

The initial 502 was not rewritten as success after the fact.

The execution order allowed the fault to be narrowed to generation-response handling after the retrieval chain had already completed.

The correction then changed the generation contract and parser, followed by another verification/deployment/live-query cycle.

This gives direct evidence of debugging through system boundaries and preserving the incident as documentation.

## Documentation Engineering

The repository contains structured documentation for:

- overall architecture;
- component interactions;
- request/data flows;
- trust boundaries;
- data/storage mapping;
- deployment;
- local development;
- RAG architecture;
- RAG runtime;
- RAG testing/regressions;
- QC/acceptance evidence;
- documentation change history.

Documentation is therefore treated as an operational artifact rather than a single root README.

## Documentation Staleness Handling

Some older RAG documentation became stale as the system moved quickly.

For example, an older known-issues document says the Kiro page did not call the production RAG API, while current code and later feature documentation show the SSE integration.

The important engineering lesson is not that all documentation is perfectly synchronized.

It is that implementation state, dated acceptance evidence, and historical documentation must be interpreted according to their temporal scope.

The corpus therefore distinguishes current implemented behavior from the narrower scope of formal production acceptance.

## Performance Evidence and Boundary

The recorded successful synchronous RAG request had approximately ten seconds of client-observed latency while Worker CPU time was only tens of milliseconds.

That suggests external model/service waiting dominated the recorded wall time rather than Worker CPU execution.

The repository also records a large frontend bundle warning associated with the current production build, particularly relevant to Three.js/Kiro loading.

These are concrete performance observations rather than generalized production-scale claims.

## Scale Evidence

The strongest directly verified scale quantities are corpus/integration scale rather than user-traffic scale.

The RAG subsystem operates over:

- 134 repositories;
- 2,808 evidence documents;
- 2,808 published vectors;
- 1,024-dimensional embeddings;
- top-40 dense retrieval;
- top-20 reranking;
- top-8 final evidence selection.

The repository does not need speculative traffic claims for these concrete system-scale measurements to be meaningful.

## Operational Maturity

The repository demonstrates multiple production-oriented behaviors:

- remote database migration before Worker deployment;
- Worker deployment before frontend deployment;
- production health endpoints;
- server-side secrets;
- GitHub OAuth;
- explicit rate limiting;
- CI policy guards;
- remote corpus validation;
- recorded live acceptance evidence;
- provenance-aware generated answers.

These features support describing the project as production-oriented rather than only as a local prototype.

## Major Engineering Work

### Full-Stack Portfolio Architecture

The project connects React frontend behavior to a typed serverless API and relational persistence while keeping content administration inside the same product boundary.

### Secure Owner Authentication

The GitHub OAuth flow implements signed state, immutable numeric identity authorization, one-time exchange, and signed application sessions.

### Persistence Migration

The system moves milestone image storage from an R2-key schema to validated Base64 D1 persistence and enforces the architectural decision through CI.

### Moderated Public Interaction

Visitor opinions combine explicit consent, pending-state ingestion, owner moderation, and approved-only public queries.

### Cloudflare-Native RAG

The production RAG runtime integrates Workers AI, Vectorize, D1 evidence, reranking, generation, rate limiting, and citations inside the Worker.

### Evidence-Aware Retrieval

Retrieval metadata influences selection, limitation questions receive negative-evidence support, and repository diversity is enforced before final generation context.

### Production RAG Acceptance

The project contains direct live deployment and query acceptance evidence, including a preserved failed attempt and corrected successful attempt.

### Agent-Style Streaming UI

The Kiro chat provides streaming tokens, inspectable sources, stop/retry behavior, and retrieval-state feedback.

### Three.js Character Runtime

The product loads and controls a Mixamo-rigged FBX through a bounded application animation layer tied to real RAG lifecycle state.

## Skills Demonstrated

### Full-Stack Web Engineering

- **React application engineering — strong evidence.**
- **TypeScript frontend engineering — strong evidence.**
- **Responsive interaction design — strong evidence.**
- **Stateful streaming UI design — strong evidence.**
- **Frontend/backend API contract integration — strong evidence.**

### Cloudflare / Serverless Backend

- **Cloudflare Worker engineering — strong evidence.**
- **Cloudflare D1 schema and repository design — strong evidence.**
- **D1 migrations — strong evidence.**
- **Cloudflare Workers AI integration — strong evidence.**
- **Cloudflare Vectorize integration — strong evidence.**
- **Cloudflare rate limiting — strong evidence.**
- **Wrangler deployment configuration — strong evidence.**

### Security and Identity

- **GitHub OAuth integration — strong evidence.**
- **HMAC-signed state/session design — strong evidence.**
- **Immutable external identity authorization — strong evidence.**
- **Short-lived one-time code exchange — strong evidence.**
- **SHA-256 token hashing — strong evidence.**
- **origin restriction — strong evidence.**
- **server-side secret handling — strong evidence.**

### Data Modeling

- **Relational content modeling — strong evidence.**
- **publication lifecycle modeling — strong evidence.**
- **ordered content-section modeling — strong evidence.**
- **moderation-state modeling — strong evidence.**
- **Base64 image persistence with explicit storage constraints — strong evidence.**
- **RAG evidence/provenance schema design — strong evidence.**

### Retrieval-Augmented Generation

- **RAG architecture — strong evidence.**
- **query embedding integration — strong evidence.**
- **vector retrieval — strong evidence.**
- **D1 evidence hydration — strong evidence.**
- **reranking — strong evidence.**
- **evidence-aware final selection — strong evidence.**
- **limitation-aware retrieval — strong evidence.**
- **cross-repository diversity control — strong evidence.**
- **grounded generation prompting — strong evidence.**
- **inline citation/provenance modeling — strong evidence.**
- **SSE streaming generation — strong evidence.**

### Testing and Quality

- **Vitest unit testing — strong evidence.**
- **Worker route/auth/validation testing — strong evidence.**
- **migration validation — strong evidence.**
- **embedding corpus validation — strong evidence.**
- **Vectorize publication validation — strong evidence.**
- **retrieval parity testing — strong evidence.**
- **remote D1 validation — strong evidence.**
- **live production acceptance testing — strong evidence.**
- **failure localization and regression correction — strong evidence.**

### CI/CD and Operations

- **GitHub Actions CI/CD — strong evidence.**
- **quality-gated deployment — strong evidence.**
- **remote schema migration before backend deployment — strong evidence.**
- **backend-before-frontend deployment ordering — strong evidence.**
- **Worker dry-run verification — strong evidence.**
- **architecture regression guards — strong evidence.**
- **Netlify deployment — strong evidence.**

### 3D Frontend Engineering

- **Three.js integration — strong evidence.**
- **FBXLoader integration — strong evidence.**
- **Mixamo skeleton handling — strong evidence.**
- **procedural skeletal animation — strong evidence.**
- **lifecycle-driven avatar state — strong evidence.**
- **reduced-motion-aware 3D interaction — strong evidence.**

### Product Engineering

- **career evidence product design — strong evidence.**
- **moderated public contribution workflow — strong evidence.**
- **evidence inspectability — strong evidence.**
- **owner content-management workflow — strong evidence.**
- **iterative architecture migration — strong evidence.**
- **explicit implementation/acceptance boundary tracking — strong evidence.**

## Capability Developed

`my-portfolio` consolidates many previously separate skills into one governed product surface.

Earlier repositories show frontend work, backend APIs, Firebase/Azure integrations, research tooling, CI, networking, and individual product experiments separately.

This repository combines full-stack product delivery with stronger operational boundaries:

- authenticated owner administration;
- schema migrations;
- moderated public content;
- quality-gated deployment;
- evidence-aware AI retrieval;
- production acceptance records;
- provenance-visible generated output.

The most important new capability is not simply “using an LLM.”

It is building an application-controlled evidence pipeline around a generative model so that retrieval, provenance, limitations, and operational state remain inspectable.

## Portfolio Evolution Context

Relative to earlier processed repositories, `my-portfolio` represents a substantial shift from individual technical utilities toward system composition and explicit architectural governance.

The product is built around migration history and controlled boundaries rather than assuming the first implementation should remain forever.

Examples include:

- R2-key image storage → Base64-in-D1 storage;
- permanent admin-token path → GitHub OAuth + short-lived signed session;
- historical Python/Pinecone RAG → Cloudflare-native Worker/Vectorize/D1 runtime;
- 2D Kiro rig → Three.js/Mixamo FBX runtime;
- opaque portfolio skill claims → evidence and source provenance.

Those pivots are valuable evidence because the repository records replacement of earlier approaches instead of merely accumulating technologies indefinitely.

## Historical Significance

Within the processed public corpus so far, this is the earliest observed repository that integrates all of the following in one deployed portfolio product:

- GitHub-OAuth owner administration;
- Cloudflare Worker + D1 content management;
- consent-gated moderated public opinions;
- Cloudflare-native evidence-aware RAG;
- Qwen embedding + Vectorize dense retrieval + BGE reranking + GLM generation;
- limitation-aware evidence selection;
- cross-repository retrieval diversity;
- source-fragment provenance in generated-answer citations;
- production RAG acceptance records;
- SSE agent chat;
- Three.js/Mixamo avatar motion driven by the real RAG lifecycle.

It is also the first processed repository where earlier portfolio evidence is itself transformed into a runtime product input through a governed RAG architecture.

## Overall Repository Narrative

`my-portfolio` begins as an interactive React career timeline and grows rapidly into a production-oriented career-intelligence platform.

The public product presents milestones, long-form stories, skills evidence, photographs, moderated opinions, and the Kiro portfolio agent. The private owner surface uses GitHub OAuth rather than a custom password database, verifies one immutable numeric GitHub identity, hands the browser a short-lived one-time exchange code, and issues signed one-hour application sessions.

The Cloudflare Worker owns public content, administration, image delivery, opinion moderation, and RAG orchestration. D1 stores milestones, sections, Base64 images, OAuth exchange hashes, opinions, and authoritative RAG evidence. The schema history records deliberate migrations, including removal of R2-backed image keys, while CI scripts prevent superseded storage and authentication paths from silently returning.

The production RAG pipeline embeds a visitor question with Qwen3, retrieves 40 Vectorize candidates, hydrates authoritative evidence from D1, reranks 20 candidates with BGE, then applies evidence-aware and repository-diverse selection before supplying up to eight contexts to GLM-4.7-Flash. Limitation-oriented questions explicitly receive stronger negative/limitation evidence weighting. The generation contract prohibits unsupported claims and requires inline `[E#]` citations, while citation objects preserve repository identity, dense/rerank scores, evidence class, and source-fragment provenance.

The repository also contains unusually concrete validation history. It verifies embedding integrity, exact Vectorize publication, dense-retrieval parity, local/remote D1 corpus integrity, Worker deployment and health. The first live synchronous generation failed after retrieval due to provider response handling; the failure was localized, the GLM contract/parser was corrected, tests and deployment were rerun, and a successful grounded production answer was recorded.

The `/kiro-rag` frontend turns that backend into a modern agent interaction with streaming output, stop/retry, source drawers, retrieval diagnostics, and session-local conversation presentation without falsely implying backend cross-turn memory. A Three.js FBX runtime connects the character's retrieving/answering/success/error behavior to real request lifecycle events. The LLM cannot directly drive arbitrary joints, and the current asset's lack of verified facial visemes is respected by limiting animation claims to the rigged body/head.

The strongest repository-level signal is therefore system governance: this project does not merely combine React, Cloudflare, AI, and Three.js. It repeatedly establishes explicit trust, evidence, migration, and deployment boundaries around them.

# Project Tags

## Project Type

- `production-oriented-portfolio-platform`
- `career-intelligence-platform`
- `full-stack-web-application`
- `serverless-web-application`
- `portfolio-rag-system`
- `individual-project`

## Languages and Frontend

- `typescript`
- `javascript`
- `sql`
- `react-19`
- `vite`
- `three-js`
- `responsive-web-ui`
- `reduced-motion`

## Backend and Cloud

- `cloudflare-worker`
- `cloudflare-d1`
- `cloudflare-workers-ai`
- `cloudflare-vectorize`
- `cloudflare-rate-limiter`
- `wrangler`
- `netlify`
- `serverless-api`
- `worker-observability`

## Authentication and Security

- `github-oauth`
- `immutable-numeric-user-authorization`
- `hmac-sha256`
- `signed-oauth-state`
- `signed-admin-session`
- `one-time-auth-exchange-code`
- `sha256-token-hash`
- `short-lived-session`
- `bearer-authentication`
- `origin-restriction`
- `server-side-secret-boundary`

## Content and Persistence

- `relational-content-model`
- `milestone-content-management`
- `publication-workflow`
- `ordered-content-sections`
- `base64-d1-image-storage`
- `image-validation`
- `single-cover-invariant`
- `binary-image-api`
- `d1-migrations`
- `r2-to-d1-migration`

## Public Opinions

- `visitor-opinions`
- `explicit-publication-consent`
- `pending-moderation-workflow`
- `approved-only-publication`
- `opinion-moderation`
- `honeypot-bot-signal`

## RAG Architecture

- `retrieval-augmented-generation`
- `qwen3-embedding`
- `1024-dimensional-embedding`
- `vectorize-dense-retrieval`
- `d1-evidence-hydration`
- `bge-reranking`
- `glm-4-7-flash`
- `evidence-aware-selection`
- `limitation-aware-retrieval`
- `negative-evidence-retrieval`
- `cross-repository-evidence-diversity`
- `grounded-generation-contract`
- `inline-evidence-citations`
- `source-fragment-provenance`
- `retrieval-diagnostics`
- `grounding-warning`
- `rag-rate-limiting`
- `rag-health-check`

## RAG Corpus Operations

- `2808-document-corpus`
- `134-repository-corpus`
- `corpus-sha256`
- `deterministic-rag-import`
- `bounded-rag-table-import`
- `vector-publication-validation`
- `dense-retrieval-parity`
- `remote-d1-corpus-validation`
- `production-rag-acceptance`

## Streaming Agent UI

- `server-sent-events`
- `streaming-rag`
- `sse-frame-parser`
- `abort-controller`
- `stop-generation`
- `retry-regenerate`
- `citation-source-drawer`
- `cited-vs-considered-evidence`
- `retrieval-activity-trace`
- `conditional-auto-scroll`
- `session-local-chat-history`
- `independent-turn-grounding`

## Three-Dimensional Agent Presence

- `three-js-avatar`
- `fbxloader`
- `mixamo-rig`
- `skeleton-alias-resolution`
- `procedural-skeletal-animation`
- `lifecycle-driven-avatar`
- `pointer-follow-gaze`
- `semantic-animation-state`
- `llm-bone-control-boundary`
- `body-head-animation`

## Testing and Quality

- `vitest`
- `worker-unit-tests`
- `auth-tests`
- `router-tests`
- `validation-tests`
- `rag-runtime-tests`
- `migration-validation`
- `embedding-validation`
- `vectorize-validation`
- `retrieval-parity-testing`
- `production-smoke-validation`
- `failure-localization`
- `regression-fix-validation`

## CI/CD and Architecture Governance

- `github-actions`
- `quality-gated-deployment`
- `frontend-typecheck`
- `worker-typecheck`
- `eslint`
- `worker-dry-run`
- `remote-d1-migration-before-deploy`
- `worker-before-frontend-deployment`
- `netlify-production-deployment`
- `legacy-migration-policy-gate`
- `no-r2-policy-gate`
- `no-legacy-auth-policy-gate`
- `architecture-regression-guard`

## Engineering Evolution

- `iterative-architecture-migration`
- `pinecone-to-cloudflare-rag-migration`
- `permanent-token-to-github-oauth-migration`
- `r2-to-d1-storage-migration`
- `2d-to-3d-avatar-evolution`
- `glb-to-mixamo-fbx-runtime`
- `implementation-vs-acceptance-boundary`
- `dated-qc-evidence`

## Portfolio Significance

- `earliest-observed-cloudflare-native-portfolio-rag-runtime`
- `earliest-observed-evidence-aware-cross-repository-rag-selector`
- `earliest-observed-limitation-aware-portfolio-retrieval`
- `earliest-observed-github-oauth-admin-portfolio-cms`
- `earliest-observed-consent-moderated-portfolio-opinions`
- `earliest-observed-source-provenance-rag-chat`
- `earliest-observed-lifecycle-driven-3d-rag-avatar`
- `earliest-observed-portfolio-corpus-as-production-product-input`
