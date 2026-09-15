# Tag Ontology Extensions — Repositories 113–119

This file extends the corpus tag vocabulary with factual concepts positively evidenced beginning with repository 113. It will be extended as repositories 114–119 are processed.

## Portfolio Platform and Content Management

- `production-oriented-portfolio-platform` — Portfolio is implemented as a deployed application with managed content, backend APIs, persistence, and operational deployment paths.
- `career-intelligence-platform` — Product exposes structured career evidence through interactive and retrieval-oriented interfaces rather than only static biography.
- `milestone-content-management` — Application materially supports owner-managed chronological milestone content.
- `publication-workflow` — Persistent content moves through explicit draft/published state with public-query enforcement.
- `ordered-content-sections` — Long-form content is decomposed into persistently ordered sections.
- `base64-d1-image-storage` — Binary image content is Base64-encoded and persisted directly in Cloudflare D1.
- `single-cover-invariant` — Application/schema materially enforce at most one cover image for a content entity.
- `binary-image-api` — Backend converts persisted encoded image content into ordinary binary HTTP image responses.
- `r2-to-d1-migration` — Repository history materially migrates image storage from an R2-key design to direct D1 storage.

## Moderated Public Contributions

- `visitor-opinions` — Product materially accepts public visitor statements/opinions.
- `explicit-publication-consent` — Submission requires explicit consent before entering the publication workflow.
- `pending-moderation-workflow` — New public submissions are stored in a pending state before review.
- `approved-only-publication` — Public reads materially filter content to administrator-approved records.
- `opinion-moderation` — Administrative workflow materially approves/rejects submitted public content.
- `honeypot-bot-signal` — Public form includes a non-user-facing honeypot field used as a lightweight automated-submission signal.

## GitHub OAuth and Session Security

- `github-oauth` — GitHub OAuth materially authenticates the application administrator.
- `immutable-numeric-user-authorization` — Authorization is anchored to an immutable external numeric user ID rather than mutable username text.
- `signed-oauth-state` — OAuth state is cryptographically signed and age-validated before callback acceptance.
- `hmac-sha256` — HMAC-SHA256 materially signs application security tokens/state.
- `one-time-auth-exchange-code` — OAuth handoff uses a short-lived single-use application exchange token.
- `sha256-token-hash` — Persisted handoff state stores a cryptographic token hash instead of the raw token.
- `signed-admin-session` — Application issues and verifies its own signed administrator session after OAuth identity verification.
- `short-lived-session` — Security-sensitive application session has a bounded explicit lifetime.
- `origin-restriction` — Backend materially checks allowed browser origin for sensitive API paths.
- `server-side-secret-boundary` — OAuth/provider credentials are materially kept behind the server/Worker interface.
- `permanent-token-to-github-oauth-migration` — Repository materially replaces an earlier permanent administrator-token path with OAuth-backed short-lived sessions.

## Cloudflare Serverless Application

- `cloudflare-worker` — Cloudflare Worker materially hosts application backend behavior.
- `cloudflare-d1` — Cloudflare D1 materially stores application/runtime data.
- `cloudflare-workers-ai` — Cloudflare Workers AI materially executes production AI model calls.
- `cloudflare-vectorize` — Cloudflare Vectorize materially serves production vector retrieval.
- `cloudflare-rate-limiter` — Cloudflare rate-limit binding materially constrains expensive application requests.
- `wrangler` — Wrangler materially configures, validates, migrates, and deploys the Worker system.
- `worker-observability` — Worker observability is explicitly enabled in deployment configuration.

## Evidence-Aware RAG

- `retrieval-augmented-generation` — Generated answers are materially conditioned on retrieved repository evidence.
- `qwen3-embedding` — Qwen3 embedding materially produces production query/document vectors.
- `1024-dimensional-embedding` — Production embedding contract explicitly uses 1,024 dimensions.
- `vectorize-dense-retrieval` — Dense similarity candidates are materially retrieved from Cloudflare Vectorize.
- `d1-evidence-hydration` — Vector candidate IDs are materially resolved to authoritative text/provenance stored in D1.
- `bge-reranking` — BGE reranker materially reorders dense retrieval candidates before generation.
- `glm-4-7-flash` — GLM-4.7-Flash materially performs production answer generation.
- `evidence-aware-selection` — Final context selection materially uses evidence metadata rather than rank alone.
- `limitation-aware-retrieval` — Explicit limitation/weakness questions materially alter evidence-selection weighting.
- `negative-evidence-retrieval` — Negative-polarity evidence receives intentional support when user intent requests limitations.
- `cross-repository-evidence-diversity` — Final selection intentionally limits per-repository concentration before filling remaining evidence slots.
- `grounded-generation-contract` — Generation prompt materially prohibits unsupported portfolio claims and requires evidence-grounded synthesis.
- `inline-evidence-citations` — Generated factual claims materially use bounded evidence labels such as `[E1]`.
- `source-fragment-provenance` — Citation objects materially preserve source section/path/line/hash provenance.
- `grounding-warning` — Runtime explicitly signals when generated output fails to emit expected inline evidence citations.
- `rag-health-check` — Runtime health endpoint materially validates expected evidence corpus state.
- `rag-rate-limiting` — RAG queries are rate limited before expensive retrieval/generation execution.

## RAG Corpus Operations and Validation

- `2808-document-corpus` — Runtime/publishing contract materially validates 2,808 evidence documents.
- `134-repository-corpus` — Runtime/publishing contract materially validates evidence across 134 repositories.
- `corpus-sha256` — Corpus identity is materially tracked using SHA-256 metadata.
- `deterministic-rag-import` — Rebuilding runtime evidence from the same finalized source produces deterministic data apart from import timestamp.
- `bounded-rag-table-import` — Corpus publication deliberately mutates only dedicated RAG runtime tables.
- `vector-publication-validation` — Remote vector publication is materially checked for count, IDs, samples, and metadata.
- `dense-retrieval-parity` — Hosted dense retrieval is materially compared against exact local cosine results.
- `remote-d1-corpus-validation` — Remote D1 corpus integrity is materially checked after publication.
- `production-rag-acceptance` — Deployed RAG path has a dated live acceptance record with concrete request outcome and diagnostics.
- `failure-localization` — Failed end-to-end execution is materially scoped to a system stage using known completed upstream stages.
- `regression-fix-validation` — A discovered production incompatibility is corrected and then reverified through tests/deployment/live execution.

## Streaming Agent Interface

- `server-sent-events` — Server-Sent Events materially stream application generation state/output.
- `streaming-rag` — RAG generation is materially exposed through an SSE streaming endpoint.
- `sse-frame-parser` — Browser code materially parses named SSE frames and payloads.
- `abort-controller` — Browser uses AbortController to stop an active request.
- `stop-generation` — User can materially cancel ongoing streamed generation.
- `retry-regenerate` — Failed/stopped turns can materially rerun their question.
- `citation-source-drawer` — Chat UI materially exposes retrieved citation/source cards.
- `cited-vs-considered-evidence` — UI distinguishes evidence actually cited in generated prose from evidence only retrieved/considered.
- `retrieval-activity-trace` — UI materially presents retrieval/reranking/selection counts.
- `conditional-auto-scroll` — Streaming chat auto-follow materially respects user scroll position rather than forcing continuous bottom lock.
- `session-local-chat-history` — Browser materially preserves visible turn history for the active session.
- `independent-turn-grounding` — Backend materially retrieves each question independently instead of claiming unsupported cross-turn model memory.

## Three-Dimensional Agent Runtime

- `three-js-avatar` — Three.js materially renders the portfolio agent character.
- `fbxloader` — Three.js FBXLoader materially loads the active avatar asset.
- `mixamo-rig` — Active character asset materially uses a Mixamo-compatible skeleton.
- `skeleton-alias-resolution` — Runtime materially resolves semantically relevant bones through explicit aliases.
- `procedural-skeletal-animation` — Runtime materially synthesizes bounded body movement from skeletal transforms.
- `lifecycle-driven-avatar` — Avatar state/motion materially follows real request lifecycle states.
- `pointer-follow-gaze` — Character head/gaze materially responds to pointer position.
- `semantic-animation-state` — Application uses semantic states such as idle/thinking/answering/success instead of raw arbitrary joint commands.
- `llm-bone-control-boundary` — Generative model is deliberately prevented from directly controlling arbitrary skeleton joints.
- `body-head-animation` — Verified active animation contract covers body/head movement without unsupported facial-viseme claims.
- `2d-to-3d-avatar-evolution` — Repository history materially replaces earlier 2D character approaches with a 3D runtime.
- `glb-to-mixamo-fbx-runtime` — Active character-loading architecture materially evolves from GLB-oriented runtime to Mixamo FBX.

## CI/CD and Architecture Governance

- `quality-gated-deployment` — Deployment jobs materially depend on successful quality checks.
- `worker-dry-run` — CI materially bundles/validates the Worker without deployment before release.
- `remote-d1-migration-before-deploy` — Production database migrations materially execute before Worker deployment.
- `worker-before-frontend-deployment` — Frontend production deployment materially waits for successful backend deployment.
- `legacy-migration-policy-gate` — CI materially rejects superseded JavaScript migration paths.
- `no-r2-policy-gate` — CI materially rejects reintroduction of active R2 integration after storage migration.
- `no-legacy-auth-policy-gate` — CI materially rejects reintroduction of superseded permanent administrator-token authentication.
- `architecture-regression-guard` — Repository uses executable checks to preserve an explicit architectural decision against regression.
- `implementation-vs-acceptance-boundary` — Documentation/QC materially distinguishes implemented behavior from behavior covered by formal live acceptance.
- `dated-qc-evidence` — Repository preserves dated operational acceptance evidence rather than only generic test claims.

## Question-Bank Domain Modeling

- `question-bank-application` — Application materially authors and organizes reusable question-bank content.
- `portable-content-application` — Application treats content packages as transferable artifacts across installations/workflows.
- `category-subcategory-question-model` — Persistent hierarchy materially uses Category → Subcategory → Question → Option.
- `generic-question-grouping` — Question groups are modeled generically rather than hard-coding one source-domain entity such as chapter.
- `mcq` — Single-correct multiple-choice questions are materially modeled and validated.
- `multi-select-question` — Multiple-correct-option questions are materially modeled and validated.
- `markdown-content-storage` — Question/explanation/option bodies materially use Markdown text as storage/interchange content.
- `explicit-position-ordering` — Ordered child entities materially persist explicit position values.
- `cascade-delete` — Relational foreign keys materially cascade parent deletion through subordinate entities.
- `shared-domain-validation` — The same domain validation logic materially serves multiple write paths such as interactive creation and import.
- `question-cardinality-validation` — Question validation materially enforces minimum option counts and answer-cardinality rules.
- `correct-answer-cardinality` — Correct-option count is materially constrained according to question type.
- `parent-updated-at-propagation` — Child creation materially updates the parent category's recency metadata.

## Portable Question-Bank Import and Export

- `category-import-export` — Complete question-bank categories materially round-trip through an application import/export boundary.
- `versioned-json-format` — Interchange documents materially include explicit schema versioning.
- `kiroq-json` — `.kiroq.json` is materially used as the recognizable category-package suffix.
- `database-id-independent-export` — Export deliberately excludes installation-specific database IDs.
- `fresh-id-import` — Imported domain entities materially receive newly generated local identities.
- `whole-document-import-validation` — Import document is materially validated across its complete nested domain before persistence statements are built.
- `json-each-bulk-insert` — SQLite/D1 `json_each()` materially expands collected JSON rows into relational bulk inserts.
- `json-to-relational-import` — Nested portable JSON materially maps into normalized relational tables.
- `relational-to-json-export` — Normalized relational content materially maps back into nested portable JSON.
- `content-disposition-download` — Backend materially returns export packages as downloadable HTTP attachments.
- `portable-question-bank-package` — A category and nested question content materially form a self-contained transferable package.
- `relational-storage-json-transport-separation` — Persistence and interchange deliberately use different representations optimized for their separate jobs.
- `storage-interchange-separation` — Application materially separates query/edit storage structure from portable transport structure.
- `versioned-interchange-contract` — Importer materially validates both package kind and schema version.

## Compact Cloudflare Application Delivery

- `cloudflare-static-assets` — Cloudflare Worker deployment materially serves the built frontend asset directory.
- `spa-fallback` — Static asset configuration materially supports single-page-application fallback routing.
- `worker-first-api-routing` — `/api/*` routes materially execute through the Worker before static asset handling.
- `d1-migration` — Repository materially defines and applies Cloudflare D1 schema migrations.
- `successful-ci-build` — The latest inspected GitHub Actions build completed successfully.
- `build-verified-application-scaffold` — Application has concrete successful CI build evidence while environment-specific deployment configuration remains to be supplied.
- `generic-domain-abstraction` — Persistent schema is deliberately centered on reusable domain concepts rather than one narrow presentation metaphor.
- `book-schema-decoupling` — Book/chapter semantics are deliberately kept out of the persistent entity model while remaining usable as category/group names.
- `reusable-question-bank-schema` — One schema materially supports book-based, topic-based, and other question-grouping conventions.
- `parallel-relational-read-assembly` — Backend materially reads multiple relation levels in parallel and reconstructs a nested API representation.

## Earliest-Observed Retrieval Tags

- `earliest-observed-cloudflare-native-portfolio-rag-runtime` — repository 113.
- `earliest-observed-evidence-aware-cross-repository-rag-selector` — repository 113.
- `earliest-observed-limitation-aware-portfolio-retrieval` — repository 113.
- `earliest-observed-github-oauth-admin-portfolio-cms` — repository 113.
- `earliest-observed-consent-moderated-portfolio-opinions` — repository 113.
- `earliest-observed-source-provenance-rag-chat` — repository 113.
- `earliest-observed-lifecycle-driven-3d-rag-avatar` — repository 113.
- `earliest-observed-portfolio-corpus-as-production-product-input` — repository 113.
- `earliest-observed-versioned-question-bank-category-package` — repository 114.
- `earliest-observed-d1-question-bank-import-export` — repository 114.
- `earliest-observed-book-schema-decoupled-question-bank` — repository 114.
- `earliest-observed-json-to-relational-question-bank-import` — repository 114.
