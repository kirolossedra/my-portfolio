# Tag Ontology Extensions — Repositories 130–134

This file records corpus concepts first introduced or materially sharpened by repositories 130–134. It supplements the historical ontology snapshots without changing the positive-evidence rule.

## Repository 130 — LogicApp

### `azure-logic-apps`

A declarative Azure workflow implementation whose source of truth is a Logic Apps workflow definition rather than a custom application runtime.

### `workflow-orchestration`

Coordination of heterogeneous managed services through explicit trigger, action, condition, fan-out, run-after, and termination relationships.

### `sensor-event-processing`

Transformation of queued sensor messages into validated domain data, persisted event metadata, enriched client/sensor context, notifications, and downstream HTTP events.

### `managed-connectors`

Use of externally implemented provider connectors such as Service Bus, SQL, Office 365, Excel Online Business, and Twilio. The tag denotes composition/integration skill, not authorship of those services.

### `notification-routing`

Business-state-dependent routing of alerts across email, SMS, linked-user fan-out, and special recipient sources.

## Repository 131 — 5G-SA

### `private-5g-testbed`

Operation of a controlled 5G Standalone laboratory stack combining an external 5G core, gNB software, SDR radio hardware, and a commercial UE modem.

### `5g-standalone`

SA-specific registration and user-plane workflow in which core control-plane registration and PDU-session establishment are validated as separate stages.

### `open5gs`

Operational use of Open5GS network functions. This tag means testbed operation/configuration, not implementation of Open5GS itself.

### `srsran`

Operational use of srsRAN as the gNB implementation with USRP B210 hardware. It does not imply authorship of srsRAN.

### `measurement-alignment`

Cropping and normalizing independent throughput, latency, and modem-RF recordings to a common experiment time window.

### `cellular-rf-metrics`

Processing of serving-cell measurements such as RSRP, RSRQ, SINR, PCI, ARFCN, and radio band metadata.

## Repository 132 — LInC-Church-Management

### `canonical-identity`

An application-level person/account identity resolved from authentication identity and reused across product domains rather than duplicated per feature.

### `authentication-authorization-separation`

Explicit architecture in which successful authentication establishes identity but domain capabilities are resolved independently and revalidated at protected operations.

### `capability-based-authorization`

Administrative/pastoral authority expressed as explicit capabilities rather than a single universal admin boolean.

### `domain-scoped-authorization`

Authority constrained to the relevant ministry, service, location, support, or confidential-data scope.

### `consent-based-membership`

A workflow where selection/invitation does not itself create membership; the invited person must accept before becoming an active member.

### `governance-workflows`

Persisted audit, notification, approval, action-origin, actor-role, and recovery state around privileged product mutations.

### `human-in-the-loop-ai`

AI assistance that remains subordinate to the same authorization, consent, approval, and domain rules as human-triggered actions.

### `bounded-ai-context`

Server-controlled restriction of model context to the material required for the relevant assistant mode instead of unrestricted database exposure.

### `public-abuse-protection`

Rate limiting and stateful abuse controls for intentionally public application endpoints, separate from business authorization.

### `signed-object-storage`

Server-authorized generation of signed object-storage operations so browser clients do not receive provider credentials.

### `production-smoke-tests`

Automated checks against deployed frontend/backend surfaces, kept separate because the two deployment systems can advance independently.

### `architecture-gates`

Executable repository checks that reject violations of architectural invariants such as multiple production authentication-state authorities.

### `opentelemetry`

Provider-independent structured telemetry through the OpenTelemetry model/protocol boundary.

### `otlp`

OpenTelemetry Protocol export used to decouple application request telemetry from a specific observability vendor SDK.

### `ai-context-system`

A repository-intelligence subsystem that publishes metadata-only, commit-synchronized context treatments for future engineering tasks.

### `commit-synchronized-context`

Generated context metadata tied to one exact accepted source revision, with materialization guarded against source/projection mismatch.

### `task-aware-context-selection`

Deterministic ranking of repository evidence from future task text using lexical/metadata relevance plus bounded graph expansion and protective evidence floors.

### `ast-symbol-indexing`

Parser-grade extraction of source symbols and exact line ranges using Python AST and the TypeScript compiler API.

### `symbol-range-projection`

Selection of bounded source ranges from large files when parser confidence and protective-context rules permit slicing.

### `rename-aware-cochange`

Git-history co-change evidence normalized through rename detection before it is used as a ranking hint.

### `controlled-ablations`

Reproducible switches that remove individual retrieval/context mechanisms so their contribution can be measured experimentally.

### `feedback-partitioning`

Separation of retrieval-eligible training feedback from development/evaluation observations to prevent benchmark leakage.

### `atomic-git-publication`

All-or-nothing publication of multiple generated context refs after a final remote-source revision check.

### `static-history-factorial-experiment`

Controlled evaluation of context/retrieval treatments over frozen historical repository states.

## Repository 133 — Password-Hashing-Function-for-Bitwarden

### `deterministic-password-generation`

Reproducible password derivation from a master secret, service/account namespace, and requested length.

### `web-crypto-api`

Use of browser-native cryptographic primitives such as `crypto.subtle.importKey` and `deriveBits` rather than handwritten cryptographic implementations.

### `service-specific-salt`

Derivation salt namespaced by the target service/account so one master secret does not directly yield the same derived stream across services.

### `deterministic-shuffle`

A reproducible Fisher-Yates-style permutation driven by derived bytes, preserving repeatability while avoiding fixed required-character positions.

## Repository 134 — Thesis

### `thesis-data-pipeline`

Research-specific transformation of acquired experiment logs into clipped, normalized, statistically aggregated, publication-ready evidence.

### `exact-timestamp-clipping`

Use of exact motion start/stop timestamps as the authority for deciding which network/link samples belong to a robot-motion interval.

### `trajectory-normalization`

Conversion from absolute experiment clock time to local elapsed trajectory time only after exact temporal membership has been established.

### `forward-backward-analysis`

Preservation of trajectory direction as a first-class experimental grouping variable after globally ordering motion events.

### `run-weighted-aggregation`

Aggregation in which each experimental run contributes one summary statistic per bin, preventing a denser-sampled run from dominating a repeated-run result.

### `p99-latency`

High-percentile latency analysis retained as tail-behavior evidence alongside central statistics such as P50.

### `special-case-preprocessing`

Explicit alternate processing paths for experiment conditions that violate the normal protocol assumption, rather than silently rewriting the standard rule.

### `raw-derived-data-separation`

Preservation of original experiment logs while generated clips, statistics, figures, CSVs, and checklists live in derived output locations.

## Earliest Observed in This Batch

- `azure-logic-apps` — repository 130
- `sensor-event-processing` — repository 130
- `private-5g-testbed` — repository 131
- `5g-standalone` — repository 131
- `canonical-identity` — repository 132
- `consent-based-membership` — repository 132
- `governance-workflows` — repository 132
- `public-abuse-protection` — repository 132
- `commit-synchronized-context` — repository 132
- `ast-symbol-indexing` — repository 132
- `rename-aware-cochange` — repository 132
- `controlled-ablations` — repository 132
- `feedback-partitioning` — repository 132
- `atomic-git-publication` — repository 132
- `static-history-factorial-experiment` — repository 132
- `deterministic-password-generation` — repository 133
- `web-crypto-api` — repository 133
- `exact-timestamp-clipping` — repository 134
- `run-weighted-aggregation` — repository 134
- `special-case-preprocessing` — repository 134
