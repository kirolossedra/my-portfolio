# Repository 132 — LInC-Church-Management

## Repository Identity

- **Repository:** `kirolossedra/LInC-Church-Management`
- **Product name:** LInC One
- **Repository index:** 132
- **Start date:** 2026-04-29
- **Latest meaningful update:** 2026-09-08
- **Latest meaningful commit:** `e06ed291d6e01db89cdbac61c22afbd43f06e16c` — `docs(ai-context): link factorial experiment runbook`
- **Primary stack:** React 19, TypeScript, Vite, Hono, Cloudflare Workers, Firebase Authentication, Firebase Realtime Database
- **Collaboration classification:** `individual-project`
- **Deployment state:** documented production frontend and backend surfaces with dedicated production-smoke workflows
- **Primary domain:** bilingual church/ministry operations, pastoral workflows, spiritual-development administration, people/service coordination, governance, resources, support, and AI-assisted operations

## What This Repository Is

`LInC-Church-Management` is the source repository for **LInC One**, a large bilingual ministry-management platform.

It is not a single-purpose church calendar or form application.

The current codebase spans:

- public ministry-facing pages;
- authentication and canonical identity;
- protected capability routing;
- Pastor scheduling and booking;
- People Notes;
- People Development;
- assessment forms;
- Ministry operations;
- Mission Trips;
- Servant Management;
- Discipleship;
- attendance;
- public Library resources;
- support ticketing;
- administrator governance;
- server-side AI assistants;
- transactional email;
- object storage;
- abuse controls;
- production observability;
- CI/CD and E2E verification;
- a separate commit-synchronized AI-context research system.

This is one of the broadest product-engineering repositories in the portfolio corpus.

## Product Purpose

LInC One acts as a shared digital operating surface for a ministry rather than a collection of disconnected admin tools.

The implementation attempts to preserve one canonical person/account identity while projecting different capabilities to different domains.

That design is visible in the separation between:

```text
Firebase identity
        |
        v
canonical application account
        |
        +--> ordinary participant capabilities
        +--> Pastor capability
        +--> servant/service capabilities
        +--> Ministry capabilities
        +--> administrator authority
        +--> support authority
```

The repository repeatedly treats authentication, identity, membership, consent, and authorization as distinct concepts.

## Current Production Surfaces

The root README documents two independent production surfaces:

- **Frontend:** `lincministry.com`, hosted on Netlify.
- **Backend:** Cloudflare Worker at the LInC backend workers.dev endpoint.

The repository explicitly treats frontend and backend deployment as separate systems.

A successful frontend deployment is not assumed to mean the Worker was deployed, and vice versa.

This distinction is reinforced by separate production-smoke workflows.

## High-Level Architecture

The current architecture is hybrid:

```text
Browser
  |
  v
React + TypeScript + Vite
  |
  +--> Firebase Authentication
  |
  +--> selected established Firebase data subscriptions
  |
  v
Hono API on Cloudflare Workers
  |
  +--> canonical identity / authorization
  +--> Firebase Realtime Database
  +--> Backblaze B2
  +--> Brevo
  +--> Google Gemini
  +--> Cloudflare rate limiting
  +--> Durable Object abuse guard
```

The source does not falsely claim that every browser data path has already been migrated behind the Worker.

Instead, the architecture explicitly identifies retained direct Firebase data paths while preferring the Worker for sensitive and transactional behavior.

## Frontend Stack

The root package is a modern TypeScript frontend.

Observed runtime dependencies include:

- React 19;
- React DOM;
- React Router;
- Firebase;
- date-fns;
- Leaflet;
- React Leaflet;
- Google Maps loader;
- Motion;
- Lucide React;
- YAML parsing.

The application uses Vite for development and production bundling.

## Frontend Application Spine

The root README describes `src/App.tsx` as a composition point rather than a monolithic application component.

The application separates:

- provider composition;
- route composition;
- session authority;
- feature modules;
- services.

The important session flow is:

```text
Firebase Auth
    |
    v
SessionProvider
    |
    v
canonical account
    |
    v
useSession()
    |
    v
AppRoutes / RequireAccess / feature UI
```

## Single Session Authority

A notable frontend architecture rule is the **single production auth-state observer**.

`SessionProvider` owns:

- Firebase authentication-state observation;
- canonical-account loading;
- session refresh behavior;
- identity-switch race protection.

Ordinary pages and features consume `useSession()` rather than independently recreating Firebase auth observers and canonical-account caches.

This is not just a documentation preference.

`npm run check:architecture` exists to enforce the boundary.

## Authentication Is Not Authorization

The repository states this explicitly and repeatedly.

Firebase Authentication establishes authenticated identity.

Application authority is determined later from canonical identity and domain policy.

A successful login therefore does not automatically grant:

- Pastor access;
- administrator authority;
- Spiritual Program participation;
- Ministry authority;
- service membership;
- Discipleship teaching authority;
- support-desk authority.

This is one of the strongest architectural themes in the project.

## Canonical Identity Directory

Primary identity roots include:

```text
userDirectory/users
userDirectory/identityLinks
```

The effective resolution flow is:

```text
Firebase UID
   |
   v
identity link
   |
   v
canonical UID / account
   |
   v
active access state
   |
   +--> labels
   +--> servant labels
   +--> administrator authority
   +--> domain-specific policy
```

This avoids treating each product feature as if it owned a separate copy of a person.

## Access Activation and Suspension

Canonical application access has explicit state rather than being inferred only from the existence of a Firebase account.

The platform supports governance around:

- account activation;
- suspension;
- identity reconciliation;
- deletion protection;
- access requests.

This is evidence of application-level identity lifecycle management beyond login/logout.

## Protected Route UX

The frontend centralizes protected-route behavior through `RequireAccess`.

An anonymous visitor can remain on the requested route and receive the shared authentication gateway instead of being blindly redirected away from context.

After authentication, lack of capability produces an explicit access-denied/request flow rather than silently treating identity as permission.

## Access Requests

Requestable capabilities include protected areas such as:

- Spiritual Program;
- People Development / Group Notes;
- Ministry;
- Discipleship;
- servant/service workflows.

The request records the attempted capability and route for human review.

The system does not grant the capability automatically merely because it was requested.

Pastor workspace access is intentionally not treated as a self-service capability request.

## Pastor Authority

Pastor authority is represented through the canonical account/label system.

It is separate from administrator authority.

This allows a Pastor to have pastoral capabilities without implicitly becoming a global administrator, and an administrator to perform delegated administration without automatically receiving confidential pastoral access.

## Administrator Hierarchy

Administrator state is stored under:

```text
administration/adminHierarchy
```

Observed lifecycle states include:

- `pending`;
- `active`;
- `suspended`.

## Capability-Based Administration

The platform does not reduce administrator authorization to one `isAdmin` boolean.

Documented authorities include:

- `manageAssessmentForms`;
- `manageAttendance`;
- `manageLibrary`;
- `manageMinistry`;
- `managePeopleAccess`;
- `manageAbout`;
- `manageWebsiteSettings`.

The Chief receives the full authority set.

Other administrators receive only explicitly allocated capabilities.

This is evidence of fine-grained role/capability modelling.

## Legacy Authority Migration

The historical NextGen domain has been replaced by Ministry.

A legacy `manageNextGenQa` value is retained as a compatibility alias for current `manageMinistry` reads.

Current authority writes use the current name.

This is a concrete migration strategy:

```text
old persisted authority
        |
        v
compatibility read
        |
        v
current domain name for new writes
```

## Bilingual Product Design

The product supports English and Arabic.

That includes RTL-aware UI behavior rather than simple text substitution.

Localization therefore affects:

- navigation;
- forms;
- resource content;
- layouts;
- Ministry workflows;
- support/participant experiences.

## Public Application Hub

Public visitors can reach product entry surfaces without possessing a canonical account.

Public areas include combinations of:

- application navigation;
- About/Legal content;
- booking;
- Library resources;
- Oholiab Support.

Protected domains are then layered on top of the same application.

## Assessment System

Assessments/forms are represented through structured YAML-defined form content and backend-mediated response/control operations.

The platform therefore separates assessment definitions from hardcoded component trees.

Administrator authority controls form administration independently from ordinary participant use.

## Public Pastor Booking

The platform contains a public booking system for Pastor meetings.

Documented behavior includes:

- 30-minute slots;
- public schedule projection;
- request creation;
- conflict-safe reservation logic;
- earliest-available booking mode;
- server-side revalidation at mutation time.

The browser schedule is treated as a projection, not as an authoritative reservation lock.

## Conflict-Safe Booking

The root README explicitly explains that a slot visible in the browser can still be rejected if another reservation/meeting claims it before mutation.

This demonstrates awareness of stale-client race conditions.

The backend revalidates availability when the booking request is committed.

## Pastor Calendar

The Pastor workspace supports a substantial scheduling domain.

Current capabilities include:

- meeting creation;
- meeting updates;
- meeting deletion;
- participant selection;
- invitation delivery;
- meeting-request review;
- conflict-safe acceptance/rejection;
- availability;
- unavailability;
- editable availability ranges;
- trim-style range interaction;
- flexible recurring group scheduling;
- Pastor notifications;
- People Development schedule awareness;
- ICS export;
- Bezalel assistance.

## Availability as Domain Data

Availability ranges are persisted business data, not purely decorative calendar elements.

That distinction allows booking and scheduling logic to consume the same state used for rendering.

## Meeting Invitations

Transactional meeting invitation delivery is mediated by a backend route family.

This keeps server-side mail credentials and message-generation concerns out of the React client.

## People Notes

People Notes is a confidential Pastor-only domain.

It supports person-specific records such as:

- note items;
- comments;
- follow-up state;
- deletion.

Administrator authority alone does not grant access to these confidential notes.

This is an important privacy/authorization boundary.

## People Development

People Development manages development groups and participant-facing group workflows.

Documented capabilities include:

- group assignment;
- assignments;
- PDF material;
- recurring schedules;
- private Pastor notes;
- participant-facing group notes;
- notification workflows;
- canonical identity linkage.

## Group Notes

The Group Notes portal first passes through the shared capability boundary and then applies feature-specific participant projection.

That means route-level access and resource-level visibility are separate decisions.

## Ministry Domain

`Ministry` is the active domain replacing historical NextGen functionality.

The main subdomains are:

```text
Ministry
  |
  +--> Mission Trips
  +--> Servant Management
  +--> Discipleship
```

These subdomains do not share one unrestricted mutation authority.

## Mission Trips

Mission Trips model reusable trip/location concepts plus dated instances.

Documented concepts include:

- trip definitions;
- dated instances;
- clearance deadlines;
- responsibilities;
- accommodation entities;
- transportation entities;
- participant allocation;
- PDF roster/export behavior;
- participant notification.

The implementation references canonical users instead of duplicating a separate Ministry-only people database.

## Servant Management

Servant Management is one of the clearest examples of domain modelling in the repository.

The project explicitly encodes the principle:

> selection is not membership.

A leader can invite a servant, but that does not immediately create service membership.

## Consent-Based Service Membership

The lifecycle is:

```text
eligible servant
      |
      v
pending invitation
   /       \
accept     decline
  |           |
  v           v
member     declined state
```

Invitation records preserve:

- who invited the person;
- when the invitation occurred;
- how/when the recipient responded.

This is evidence of consent-aware workflow modelling rather than automatic allocation.

## Service-Scoped Leadership

A service leader receives management authority for the applicable service.

That does not imply authority over every Ministry domain.

This localizes authorization to the resource/domain scope that requires it.

## Weekly Servant Availability

The weekly Sunday workflow distinguishes standing service membership from date-specific availability.

A servant submits availability for the applicable Sunday.

Assignment candidates are then constrained by:

- accepted membership;
- submitted availability;
- relevant service role;
- acting leader/Chief authority.

## Weekly Assignment History

Published assignments become part of Sunday history.

The system does not model old weekly availability as if it were still an actionable present-tense form.

This shows temporal-domain reasoning rather than storing all weekly forms as interchangeable records.

## Recipient-Scoped Weekly Files

Weekly service files can target specific recipient UIDs.

That allows leaders to distribute material to intended servants without exposing every file to the full service membership.

## Discipleship

Discipleship has a distinct access and authority model.

Documented capabilities include:

- bilingual/location-specific forms;
- participant form submission;
- persisted baseline enrollment form;
- language selection;
- application emails;
- constrained availability choices;
- multi-city teacher assignment;
- location-scoped submission review;
- explicit enrollment/admission;
- enrollment removal without silently deleting underlying access.

## Discipleship State Separation

The repository distinguishes:

- route/access label;
- form submission;
- enrollment;
- teaching authority.

Those are not collapsed into one state field.

This supports more accurate lifecycle behaviour.

## Location-Scoped Teaching Authority

Teaching authority is validated against active servant status and assigned locations.

A teacher may be assigned to multiple active church locations.

This is an example of multi-scope authorization inside one domain.

## Attendance

Attendance is implemented through protected administrator workflows rather than only direct browser writes.

Capabilities include:

- people listing;
- person editing;
- person deletion;
- Sunday attendance workflow;
- record updates;
- search/filtering;
- analytics;
- individual attendance analysis;
- photo/camera-related person information where applicable.

## Public Library

The Library is a public resource catalog with protected management.

Public behaviors include:

- folder listing;
- published file listing;
- signed view/download URLs;
- Bezalel Library chat using selected resource context.

Management behaviors include:

- folder management;
- uploads;
- publication completion;
- deletion;
- AI-summary metadata for PDFs.

## Library Storage Separation

The storage architecture separates catalog metadata from binary objects.

```text
Firebase RTDB
  -> Library catalog + metadata

Backblaze B2
  -> file objects

private metadata
  -> AI summary/context support
```

This avoids putting large Library binaries directly into Firebase.

## Signed Object Operations

B2 credentials remain server-side.

Browser transfers use signed operations produced after authorization.

This is an explicit trust-boundary design.

## Resource Evolution and Blog Publishing

Recent September 2026 commits add Pastor blog publishing to the Resources experience and then fix the surrounding management/undo/test paths.

The commit sequence includes:

- `feat(resources): add Pastor blog publishing`;
- UUID-safe blog test-fixture correction;
- render-safe blog undo state correction;
- navigation tests aligned with Resources;
- Pastor workspace blog-management exposure.

This shows the feature was integrated across source, tests, navigation, and Pastor workflow rather than existing only as an isolated screen.

## Oholiab Support

Oholiab is the public support/ticketing system.

Public users can:

- submit contact information and a message;
- optionally attach a voice recording;
- receive a tracking code;
- track ticket state/activity without an application account.

## Support Ticket Lifecycle

Current documented states are:

```text
submitted
open
in_progress
resolved
closed
```

Support staff can:

- list tickets;
- inspect details;
- assign a support agent;
- change status through validated transitions;
- send public updates;
- request information;
- trigger transactional email;
- review voice data while available.

## Support Voice Data

Voice messages are stored as validated Base64 support audio in the current implementation.

The voice data is deleted when the ticket is closed.

The repository treats this as a deliberate current-state exception rather than a generic pattern for all binary data.

## Governance Layer

Governance is modeled explicitly rather than as incidental logging.

Important roots include:

```text
administration/auditLog
governance/notifications
governance/approvals
governance/accessRequests
```

## Actor Origin

Governed actions can identify origin such as:

- direct;
- Bezalel;
- system.

This preserves whether a change originated from an ordinary UI flow, an AI-mediated proposal, or an automated system process.

## Actor Role

Governance can distinguish roles such as:

- Chief;
- administrator;
- Pastor;
- servant;
- participant.

This provides more context than a generic user ID alone.

## Approval Lifecycle

The repository documents approval states such as:

```text
pending
   |
   v
executing
  /   \
 v     v
approved failed

pending -> rejected
```

This supports privileged operations that require a human decision before execution.

## Auditability

Governed mutations can record:

- actor;
- action origin;
- target;
- recipients;
- read state;
- approval state;
- destructive-action history where applicable.

## Deletion Recovery

Selected governed deletions have recovery/accountability mechanisms.

The design does not assume every privileged deletion should become immediately invisible and irreversible.

## Bezalel AI

Bezalel is the product's server-mediated AI capability.

Google Gemini is the model provider.

The application, not the model, remains the authority boundary.

## AI as Proposal, Not Authority

The repository explicitly disallows treating model output as automatic authorization or ministry judgment.

A model proposal must pass the same domain constraints as a comparable manual action.

The model does not get a bypass around:

- authorization;
- membership rules;
- consent;
- approval workflows;
- sensitive-domain policy.

## Bounded AI Context

Gemini receives bounded context appropriate to the specific Bezalel mode.

The architecture avoids treating the entire application database as unrestricted model context.

This is particularly important because the product contains pastoral and people-related information.

## Human Authority Boundary

The repository documentation emphasizes human responsibility for ministry decisions affecting participation, status, or pastoral judgment.

AI can assist with navigation, drafting, summarization, and constrained proposals, but does not silently convert human ministry decisions into autonomous model decisions.

## Bezalel Modes

The backend exposes Bezalel through domain-dependent API routes.

Examples include assistance around:

- booking;
- Pastor workflows;
- Library resources.

Each mode has a different context and action surface.

## Backend Runtime

The backend is a TypeScript Hono application deployed to Cloudflare Workers.

Observed direct runtime dependencies are intentionally small:

- Hono;
- Zod;
- aws4fetch.

Wrangler is used for local development, deployment, and Worker type generation.

## Backend Validation

Zod provides runtime validation at server boundaries.

The architecture consistently positions backend validation near protected operations rather than trusting browser types as a security mechanism.

## Worker Route Families

Documented API roots include:

- `/api/v1/auth`;
- `/api/v1/people-notes`;
- `/api/v1/people-development`;
- `/api/v1/booking`;
- `/api/v1/bezalel`;
- `/api/v1/pastor-calendar`;
- `/api/v1/assessment`;
- `/api/v1/website-settings`;
- `/api/v1/admin`;
- `/api/v1/about`;
- `/api/v1/support`;
- `/api/v1/ministry/servant-management`;
- `/api/v1/ministry`;
- `/api/v1/library`;
- `/api/v1/meeting-invitations`;
- `/api/v1/governance`.

## Router Ordering as Policy

The dedicated Servant Management router is mounted before the broader Ministry router.

The repository documents this as intentional so older/direct membership semantics cannot accidentally bypass the newer consent-aware contract.

This is an example where route composition participates in preserving a business invariant.

## Firebase Realtime Database

Firebase RTDB is the primary structured persistence store.

Important logical roots include:

- canonical users;
- identity links;
- administrator hierarchy;
- audit log;
- governance notifications;
- approvals;
- access requests;
- website settings;
- Mission Trips;
- Servant Management services/members/invitations/roles/Sundays;
- Discipleship;
- Library metadata;
- support tickets/tracking/audio;
- People Notes;
- assessment-response lineage.

## Canonical UID Reuse

The data model prefers canonical UIDs across domains rather than copying person identity into each feature.

That supports cross-domain consistency and reduces identity drift.

## Backblaze B2

B2 is used for Library/archive object storage through the S3-compatible API.

Server-side signing isolates provider credentials from the browser.

The repository recognizes older/special Base64 domains separately rather than pretending all binary storage has one implementation.

## Brevo

Brevo provides transactional email transport from the Worker.

Email sending is a backend responsibility for protected workflows.

The external provider is not itself owner-authored; the integration, templates, authorization, and recipient logic are application evidence.

## Cloudflare Public Abuse Controls

Public routes are deliberately exposed for use cases such as:

- public booking;
- support submission/tracking;
- public AI booking chat.

The Worker applies abuse controls including:

- Cloudflare rate-limit bindings;
- a Durable Object `PublicAbuseGuard`;
- enforcement mode configuration.

## Rate Limiting Is Not Authorization

The repository explicitly keeps abuse mitigation separate from business validation.

Rate limiting protects exposed endpoints from excessive use.

It does not decide whether a business operation is valid.

## Durable Object Abuse Guard

The Durable Object provides stateful abuse-control behavior for public surfaces.

This is distinct from Firebase domain data and distinct from application authorization.

## Scheduled Work

The Worker contains scheduled work via a Saturday cron trigger.

The scheduled service-reminder logic still applies its own domain/time-zone checks instead of assuming the raw cron execution timestamp is itself the ministry deadline.

## Website Settings

Global settings are persisted under `website/settings`.

Website Settings authority controls mutation.

Current dark-theme IDs include multiple configured theme variants rather than one hardcoded dark mode.

## Design System

The frontend has a shared design-system layer.

The repository includes a design-system quality gate so new pages cannot freely diverge into independent styling systems without detection.

## Frontend Architecture Gate

`npm run check:architecture` validates architectural invariants such as the centralized session authority.

This converts architecture from documentation-only guidance into executable quality policy.

## Design-System Gate

`npm run check:design-system` validates shared UI/design constraints.

This supports consistency across a large multi-domain frontend.

## Bundle Gate

`npm run check:bundle` validates the built bundle against repository-defined expectations/budgets.

This makes bundle behavior part of release quality.

## Frontend Quality Pipeline

`npm run ci:quality` composes:

- TypeScript type checking;
- ESLint with zero warnings;
- architecture checks;
- design-system checks;
- test coverage.

## Frontend Release Pipeline

`npm run ci:release` adds:

- production dependency audit;
- production bundle generation;
- bundle checks;
- built-distribution smoke testing.

This is a stronger release gate than a plain `vite build`.

## Unit and Integration Testing

The frontend uses:

- Vitest;
- Testing Library;
- V8 coverage.

The backend also uses Vitest and Cloudflare's Worker testing pool.

## Backend Testing

The root documentation identifies backend tests around:

- authorization;
- route contracts;
- persistence;
- provider adapters;
- governance;
- Ministry;
- support;
- Library;
- security behavior.

## Playwright E2E

The repository contains an isolated `e2e/` project using Playwright.

The CI E2E workflow:

- installs locked dependencies;
- installs Chromium and Linux dependencies;
- runs public/anonymous scenarios;
- retains reports;
- retains failure artifacts.

## Protected-Route E2E

The anonymous protected-route suite checks that a visitor:

- remains on the requested path;
- sees the shared login gateway;
- preserves the capability being requested.

That verifies product-level access UX rather than only component rendering.

## Test Environment Isolation

The documentation explicitly warns against using the production Firebase project as disposable E2E state.

Anonymous Playwright tests use isolated frontend Firebase configuration so public rendering tests do not depend on production identity state.

## Production Smoke Testing

Frontend and backend each have dedicated production-smoke workflows.

This matches the two-surface deployment model.

Observed workflow files include:

```text
.github/workflows/frontend-build.yml
.github/workflows/frontend-e2e.yml
.github/workflows/frontend-production-smoke.yml
.github/workflows/backend-tests.yml
.github/workflows/backend-production-smoke.yml
.github/workflows/ai-context-sync.yml
```

## CI/CD Separation

Netlify and Cloudflare are separate delivery systems.

The repository preserves this operational distinction in both documentation and workflow structure.

## Production Observability

Recent September 2026 commits add structured Worker request telemetry and export it to Better Stack.

The dependency documentation records an important decoupling decision:

- telemetry uses OpenTelemetry/OTLP;
- application code does not depend on a Better Stack SDK package;
- changing OTLP backends does not require rewriting Hono routes.

This is evidence of provider-independent observability architecture.

## Structured Request Telemetry

The observability feature records structured request-level information from the Worker rather than relying only on ad-hoc console text.

The export path is separated from individual business routes.

## OpenTelemetry Boundary

Using OTLP as the protocol makes Better Stack an observability destination rather than a deeply coupled application framework.

This improves exit/migration options.

## Dependency Modelling

The repository contains a dedicated `docs/dependency-modelling/` body of work.

It records:

- direct dependencies;
- provider roles;
- migration/exit paths;
- coupling strength;
- dependency evidence.

This is unusual for a hobby/project repository and is direct evidence of architecture-level dependency reasoning.

## Cost Analysis

`docs/cost-analysis/` models the active provider inventory and cost considerations.

The repository therefore treats cloud-service choice as an engineering constraint rather than an invisible deployment detail.

## Security Programme

`docs/security/` contains dedicated security/threat-modelling work.

Security boundaries described in the root README include:

- authentication vs authorization;
- public endpoint validation;
- confidential Pastor data;
- bounded AI context;
- provider credentials;
- recipient privacy;
- object-storage signing;
- deletion/audit behavior.

## Privacy Boundaries

The product contains human/ministry information, so authorization is intentionally domain specific.

Examples include:

- People Notes restricted to Pastor authority;
- administrator capability not implying universal pastoral access;
- recipient-scoped service files;
- location-scoped Discipleship authority;
- public support projections separated from staff operations.

## Email Privacy

The documentation differentiates group BCC-style messaging from individualized confidential delivery.

It also prefers server-generated templates over arbitrary browser-provided HTML.

## Object-Storage Security

B2 provider credentials stay on the Worker side.

Authorized clients receive signed operations instead of raw storage credentials.

## Legacy Direct Firebase Paths

The repository explicitly records that selected direct Firebase data paths remain.

This transparency matters for RAG accuracy.

The project should not be retrieved as evidence of a completely Worker-mediated data architecture.

However, Firebase **authentication state** is centralized even while some data subscriptions remain direct.

## Repository Documentation System

The repository contains extensive technical documentation beyond the root README.

Major areas include:

- database ERDs;
- finite-state machines;
- design patterns;
- security;
- testing;
- road-to-100 maturity work;
- dependency modelling;
- AI-context management;
- engineering-evolution study;
- cost analysis;
- incidents;
- Gantt history/roadmap.

## Text-Native Diagram Policy

The project prefers maintainable text-native diagrams.

Supported editing surfaces include:

- Mermaid in Markdown;
- `.mmd` Mermaid source;
- YAML-to-Mermaid generation;
- LaTeX/TikZ.

Generated screenshots are not treated as the primary editable diagram source.

## Gantt Source of Truth

The Gantt workflow uses a YAML source and generator:

```text
docs/gantt/source/churchone-gantt.yaml
          |
          v
docs/gantt/generate-gantt.py
       /          \
      v            v
Mermaid        LaTeX/TikZ
```

This is evidence of documentation-as-code.

## Change Manifests

The repository contains feature/change manifests for significant updates.

Observed root-level examples include work around:

- Mission Trips;
- People Development PDFs;
- phased architecture changes;
- Spiritual Program overhaul.

These provide explicit delivery evidence and affected-surface records.

## AGENTS Contract

`AGENTS.md` contains repository-specific engineering instructions for coding agents.

This is separate from the user-facing README.

It participates in the project's broader attempt to make AI-assisted engineering reproducible and bounded.

## AI Context System

`ai-context/` is a distinct engineering/research subsystem inside the repository.

It generates cumulative metadata-only branches describing the exact accepted `main` source revision.

The branches are:

```text
ai-context-v1
ai-context-v2
ai-context-v3
ai-context-v4
ai-context     # compatibility alias of V1
```

## AI Context Core Invariant

The treatments are cumulative:

```text
V1 ⊂ V2 ⊂ V3 ⊂ V4
```

For one successful synchronization, every generated version refers to the same source commit.

Generated branches contain repository metadata, not a second copy of application implementation.

## Exact-Commit Context

The context system writes `SOURCE-COMMIT` metadata and materializes actual source from the matching `main` revision.

The consumer refuses source/projection commit mismatch by default.

This directly addresses stale AI context.

## V1 — Repository Intelligence

V1 includes conservative repository intelligence such as:

- Git-tracked file inventory;
- file classes;
- source-cost estimates;
- feature/domain inference;
- local import edges;
- Hono route composition;
- frontend-to-backend API mapping;
- verification relationships;
- authorization relationships;
- database-expression hints;
- canonical/generated provenance;
- architecture-drift reporting;
- sparse manifests;
- basic heuristic task-aware selection.

## Protective Relationships

The context graph recognizes relationships such as:

```text
AUTHORIZED_BY
TESTED_BY
```

These are treated as protective context relationships rather than optional ranking decoration.

## V2 — Ranked Task Projection

V2 extends V1 with explicit task-routing metadata.

The flow is roughly:

```text
task text
  |
  v
candidate domains
  |
  v
lexical / metadata relevance
  |
  v
ranked seeds
  |
  v
bounded graph expansion
  |
  v
auth/test protective floor
  |
  v
must-read / likely / fallback tiers
  |
  v
optional context budget
```

The repository is careful not to mislabel this deterministic lexical/metadata ranking as embedding-based semantic retrieval.

## V2 Budget Semantics

A T4/context budget can constrain ordinary candidate selection.

Protective/core context is allowed to exceed the requested budget when required.

The system does not drop authorization/test evidence merely to satisfy a smaller numeric token target.

## V3 — AST-Backed Symbol Projection

V3 introduces fine-grained symbol/range projection for large files.

Parser policy includes:

- Python standard-library AST;
- TypeScript compiler API for JS/TS/JSX/TSX.

A heuristic parser exists only as an operational fallback and is not accepted as publication-grade JS/TS analysis.

## V3 Symbol Types

The symbol extractor can identify constructs such as:

- functions;
- arrow/function-expression declarations;
- React-style components;
- classes;
- class methods/accessors;
- interfaces;
- type aliases;
- enums;
- Hono route calls;
- Vitest/Jest-style test calls;
- Playwright `test.describe` structures.

## Bounded Range Materialization

For large selected files, V3 can score symbols and merge selected source ranges.

Small files, protective files, parser uncertainty, and unsafe cases fall back to whole-file inclusion.

This balances context reduction against reliability.

## V3 Information Barrier

V1/V2 publications intentionally strip symbol and symbol-parser metadata.

This prevents experimental treatments from accidentally receiving later-version information.

## V4 — Evolution and Research Intelligence

V4 adds repository-evolution and controlled research features.

It does **not** take credit for V1 capabilities such as architecture drift or basic freshness.

## Repository Evolution Metadata

V4 can record changes between repository states such as:

- added files;
- removed files;
- modified files;
- domain changes;
- symbol-count changes;
- repository change ratio;
- trust/drift state.

## Rename-Aware Co-Change

The research subsystem derives co-change evidence from Git history using rename detection.

Historical paths are normalized toward current renamed paths before pair counts are used.

The repository explicitly treats co-change as a ranking hint, not architectural truth.

## Controlled Ablations

V4 exposes reproducible ablation switches including:

```text
no-auth-floor
no-test-floor
no-provenance-rewrite
no-graph-expansion
no-task-ranking
no-symbol-slicing
no-cochange
no-feedback
```

This turns architectural retrieval choices into measurable experimental factors.

## Feedback Partitioning

Projection misses can be recorded with dataset partition metadata.

Only retrieval-eligible training data can influence future ranking.

Development/evaluation records may be stored for analysis but are not fed back into retrieval.

The current task ID can also be excluded from feedback loading.

This is explicit benchmark-leakage control.

## Static-History Factorial Treatments

Recent commits add static-history factorial treatments and associated research documentation.

The latest commit sequence includes:

- static-history factorial treatment implementation;
- static-history research protocol;
- static-history research model;
- factorial branch/publication documentation;
- script contracts;
- benchmark test plan;
- metrics and validity plan;
- experiment runbook;
- root/context linkage.

This shows the context system is being treated as an experimental research object rather than only a developer convenience.

## AI Context Publication Pipeline

The synchronization workflow performs a multi-stage publication process.

Documented steps include:

1. checkout exact source commit with full history;
2. install Python/Node dependencies;
3. install TypeScript dependencies for parser-grade AST extraction;
4. run context regression tests;
5. record source commit;
6. load prior baselines where available;
7. analyze the repository once;
8. compute drift/evolution metadata;
9. generate cumulative publications;
10. validate profiles and information barriers;
11. transfer the publication matrix as a workflow artifact;
12. recheck remote `main` immediately before publication;
13. create metadata-only commits;
14. atomically update V1–V4 plus compatibility branch.

## Atomic Multi-Ref Publication

Publication uses an atomic Git push across the generated branches.

If `main` advanced, the stale run updates no generated branch.

If atomic publication fails, the experimental versions cannot partially advance.

This is strong evidence of consistency-oriented CI design.

## Latest AI Context Workflow Evidence

At the latest repository head, GitHub Actions run 128 of **AI Context Sync** completed successfully.

The successful run used head SHA:

`e06ed291d6e01db89cdbac61c22afbd43f06e16c`

That is the same latest meaningful commit recorded for this corpus analysis.

Therefore the context-publication mechanism is not only documented; a successful workflow run exists at the analyzed head.

## Publication Validation

Validation checks include invariants such as:

- common source commit across generated profiles;
- information separation between V1/V2 and symbol-aware versions;
- V2 routing artifacts;
- V3/V4 symbol metadata;
- publication-grade TypeScript compiler coverage for JS/TS text files;
- V4 evolution/research artifacts;
- cumulative version prefixes;
- unsupported verification/architecture mechanisms remaining visible as drift rather than disappearing silently.

## Context Materialization

A materializer consumes projection metadata and reads actual source from the exact recorded commit.

This separates:

- metadata publication;
- future task arrival;
- task-specific projection;
- exact-source materialization.

The generated context branches are not claimed to predict unknown future engineering tasks.

## Context Safety Philosophy

The documented optimization target is:

> the smallest sufficient trustworthy context

rather than the smallest context at any cost.

Authorization, verification, provenance, and contradictory runtime evidence outrank a numeric context budget.

## Engineering-Evolution Study

The repository also contains a dedicated mathematical/software-evolution study under documentation.

That sits alongside the AI-context research but is conceptually distinct: it studies how the software changes, while the context system tries to project sufficient repository knowledge for future engineering tasks.

## Better Stack / OTLP Observability and AI Context Together

The coexistence of structured production telemetry and repository-context research shows two different observability layers:

- runtime observability of the deployed Worker;
- repository-state observability for AI-assisted engineering.

The corpus keeps those concepts separate.

## Product Maturity Evidence

LInC One has evidence across several maturity dimensions:

- multiple production deployment surfaces;
- a broad multi-role domain model;
- backend authorization;
- canonical identity;
- capability-based administration;
- governance/audit state;
- consent-based membership;
- object-storage separation;
- public abuse controls;
- unit/integration testing;
- Playwright E2E;
- production smoke tests;
- release-quality scripts;
- observability;
- documentation-as-code;
- dependency/cost/security modelling;
- context-synchronization CI.

This is much stronger evidence than a UI prototype or CRUD-only application.

## Architectural Strengths

Strong architecture evidence includes:

- single frontend session authority;
- canonical identity distinct from Firebase auth;
- fine-grained admin capabilities;
- domain-scoped authority;
- consent-aware servant membership;
- backend revalidation for booking races;
- bounded AI authority;
- governed destructive actions;
- provider credential isolation;
- B2 signed storage operations;
- separate production surfaces;
- executable architecture/design-system gates;
- exact-commit AI context.

## Product-Engineering Strengths

Strong product evidence includes:

- differentiated user roles;
- public and authenticated journeys;
- bilingual/RTL behavior;
- scheduling and availability;
- support workflows;
- resource publication;
- role-specific content distribution;
- ministry-instance modelling;
- human-consent workflows;
- access-request UX;
- operational administration.

## Backend Engineering Skills

The repository provides evidence of:

- Hono route architecture;
- Cloudflare Worker deployment;
- Zod validation;
- Firebase Admin/service integration;
- authorization middleware/policy;
- server-side provider adapters;
- scheduled work;
- audit/governance workflows;
- signed object operations;
- transactional email;
- AI-provider integration;
- rate limiting;
- Durable Objects.

## Frontend Engineering Skills

The repository provides evidence of:

- React 19;
- TypeScript;
- Vite;
- centralized session/context architecture;
- React Router;
- protected-route composition;
- bilingual/RTL UI;
- design-system enforcement;
- complex form/workflow UI;
- map integrations;
- calendar/scheduling interaction;
- typed frontend service boundaries;
- unit/integration testing;
- Playwright E2E.

## Cloud Engineering Skills

The deployed system integrates:

- Netlify;
- Cloudflare Workers;
- Cloudflare rate limiting;
- Cloudflare Durable Objects;
- Firebase Auth;
- Firebase RTDB;
- Backblaze B2;
- Brevo;
- Gemini;
- Better Stack through OTLP;
- GitHub Actions.

## Security Engineering Skills

Evidence includes:

- authentication/authorization separation;
- canonical identity resolution;
- domain-specific authorization;
- backend validation;
- provider secret isolation;
- signed object access;
- abuse mitigation;
- sensitive-domain access boundaries;
- governance/audit trails;
- approval lifecycle;
- controlled deletion/recovery;
- AI authority boundaries.

## Testing and Quality Skills

Evidence includes:

- TypeScript type checking;
- ESLint zero-warning policy;
- Vitest;
- Testing Library;
- coverage;
- architecture checks;
- design-system checks;
- bundle checks;
- built-dist smoke testing;
- production smoke testing;
- Playwright;
- Worker tests;
- AI-context regression tests;
- CI artifact retention.

## Research Engineering Skills

The AI-context subsystem adds evidence of:

- experimental treatment design;
- cumulative treatment invariants;
- information barriers;
- deterministic task ranking;
- token/context budgeting;
- AST extraction;
- symbol-range projection;
- Git-history co-change analysis;
- rename normalization;
- controlled ablation;
- train/dev/eval partition discipline;
- benchmark leakage prevention;
- exact-commit reproducibility;
- atomic publication.

## Documentation Engineering Skills

Evidence includes:

- text-native architecture diagrams;
- ERDs;
- FSMs;
- generated Gantts;
- feature change manifests;
- security documentation;
- testing documentation;
- dependency modelling;
- cost modelling;
- incident records;
- AI-agent contracts;
- README/documentation changelogs.

## Business / Domain Modelling Skills

The project demonstrates modelling beyond simple tables:

- role/capability separation;
- canonical identity;
- consent-based invitation state;
- date-specific availability;
- trip definition vs trip instance;
- enrollment vs access;
- location-scoped teaching authority;
- support ticket lifecycle;
- governance approval lifecycle;
- meeting availability/reservation conflict;
- recipient-specific files.

## Scale and Complexity Character

The repository contains many interacting domains but intentionally uses a modular-monolith/serverless architecture rather than claiming microservices.

The main deployment surfaces are:

- one React frontend;
- one Hono Worker backend;
- external managed providers.

The complexity comes from product/domain breadth, authorization, integrations, and operational governance rather than from a large number of independently deployed services.

## Maturity Assessment

LInC One is a **production-deployed, multi-domain full-stack application with explicit authorization/governance architecture, substantial automated verification, operational observability, and a separate research-grade AI-context subsystem**.

The repository still documents migration boundaries and retained direct Firebase paths, which is a strength for corpus accuracy: maturity does not require pretending every historical architectural decision has already been eliminated.

The current implementation should be retrieved as evidence of sustained product evolution and architecture hardening, not merely feature accumulation.

## RAG Retrieval Guidance

This repository is a particularly strong match for queries involving:

- React/TypeScript product architecture;
- Hono on Cloudflare Workers;
- Firebase Authentication;
- Firebase Realtime Database;
- canonical identity systems;
- authentication vs authorization;
- capability-based administration;
- role-based/domain-scoped authorization;
- public booking;
- calendar scheduling;
- consent-based membership;
- workflow state machines;
- Backblaze B2 signed uploads;
- transactional email;
- Gemini/LLM integration with human authority boundaries;
- public rate limiting;
- Durable Objects;
- production observability;
- Better Stack / OTLP;
- Vitest/Playwright;
- production smoke testing;
- documentation-as-code;
- dependency modelling;
- AI context engineering;
- AST-based context slicing;
- Git co-change retrieval;
- controlled retrieval ablations;
- exact-commit context synchronization.

It is also a strong source for questions about moving from a feature-rich hobby application toward explicit operational/product engineering discipline.

# Project Tags

- `linc-one`
- `church-management-platform`
- `ministry-management`
- `full-stack-application`
- `production-deployed`
- `react-19`
- `typescript`
- `vite`
- `react-router`
- `hono`
- `cloudflare-workers`
- `firebase-authentication`
- `firebase-realtime-database`
- `backblaze-b2`
- `brevo`
- `google-gemini`
- `netlify`
- `cloudflare-rate-limiting`
- `cloudflare-durable-objects`
- `canonical-identity`
- `identity-linking`
- `authentication-authorization-separation`
- `capability-based-authorization`
- `domain-scoped-authorization`
- `administrator-hierarchy`
- `access-request-workflow`
- `pastor-workspace`
- `pastoral-booking`
- `conflict-safe-booking`
- `calendar-scheduling`
- `availability-management`
- `ics-export`
- `people-notes`
- `people-development`
- `group-notes`
- `recurring-schedules`
- `assessment-forms`
- `yaml-defined-forms`
- `ministry-domain`
- `mission-trip-management`
- `servant-management`
- `consent-based-membership`
- `service-invitations`
- `weekly-availability`
- `recipient-scoped-files`
- `discipleship`
- `location-scoped-authority`
- `attendance-management`
- `attendance-analytics`
- `public-library`
- `signed-object-storage`
- `blog-publishing`
- `pastor-blog-management`
- `support-ticketing`
- `voice-support-messages`
- `governance-workflows`
- `audit-logging`
- `human-approval-workflow`
- `deletion-recovery`
- `constrained-ai-actions`
- `human-in-the-loop-ai`
- `bounded-ai-context`
- `public-abuse-protection`
- `zod-validation`
- `server-side-secrets`
- `scheduled-worker-cron`
- `bilingual-ui`
- `arabic-rtl`
- `design-system`
- `architecture-gates`
- `bundle-gates`
- `vitest`
- `testing-library`
- `playwright`
- `e2e-testing`
- `production-smoke-tests`
- `github-actions`
- `structured-telemetry`
- `opentelemetry`
- `otlp`
- `better-stack`
- `dependency-modelling`
- `cost-modelling`
- `security-modelling`
- `documentation-as-code`
- `mermaid`
- `finite-state-machines`
- `entity-relationship-diagrams`
- `change-manifests`
- `ai-context-system`
- `commit-synchronized-context`
- `exact-commit-materialization`
- `task-aware-context-selection`
- `context-budgeting`
- `ast-symbol-indexing`
- `typescript-compiler-api`
- `python-ast`
- `symbol-range-projection`
- `rename-aware-cochange`
- `git-history-analysis`
- `controlled-ablations`
- `feedback-partitioning`
- `benchmark-leakage-prevention`
- `atomic-git-publication`
- `static-history-factorial-experiment`
- `software-evolution-research`
