# Tag Ontology Extensions — Repositories 106–112

This file extends the corpus tag vocabulary with factual concepts positively evidenced in repositories 106–112.

## Cellular Modem Validation

- `automated-test-harness` — Software materially executes a defined test procedure and computes test outcomes.
- `network-validation-tool` — Tool is built to validate concrete network availability, registration, configuration, or behavior.
- `plmn-scan` — Cellular operator/PLMN discovery is materially performed and parsed.
- `manual-operator-selection` — Software explicitly commands cellular manual network/operator selection.
- `eps-registration` — EPS/LTE registration state is materially inspected or validated.
- `pdp-context` — Cellular PDP context configuration or state is materially inspected.
- `rrc-state` — Radio Resource Control state is materially inspected or recorded.
- `cellular-signal-telemetry` — Cellular signal measurements are parsed into structured test/telemetry data.
- `serial-port-discovery` — Software discovers and probes candidate serial interfaces rather than assuming one fixed device path.
- `timeout-management` — External/device operations use explicit bounded timeouts as part of control flow.
- `device-state-restoration` — Tool explicitly restores hardware/network state after a test sequence.
- `conditional-test-execution` — Later test steps execute only when prerequisite evidence succeeds.
- `sim-allowlist-validation` — Test execution materially validates subscriber/SIM identity against an approved inventory.
- `repeated-registration-monitoring` — Cellular registration is evaluated across bounded repeated observation rounds.
- `diagnostic-capture` — Automated tests preserve additional diagnostic evidence for success/failure investigation.
- `test-case-model` — Test cases are represented as explicit runtime objects or structured records.
- `json-reporting` — Run/test results are emitted as structured JSON reports.
- `text-reporting` — Run/test results are emitted as human-readable text reports.
- `latex-reporting` — Software generates LaTeX report source programmatically.
- `raw-command-log` — Raw device command/response traffic is preserved as an audit/debug artifact.

## Career Document Engineering

- `career-document` — Repository materially maintains a career-facing document as a primary artifact.
- `cv-source` — Editable CV source is version-controlled as a first-class artifact.
- `version-controlled-document` — Document evolution is intentionally maintained through source control.
- `reproducible-document-authoring` — Source format and tooling support deterministic/repeatable document regeneration.
- `structured-document-composition` — Document source materially encodes reusable sections/layout structure.
- `career-positioning` — Repository explicitly develops how experience is positioned toward target role families.
- `audience-aware-communication` — Technical content is deliberately adapted for distinct reader/audience needs.
- `jargon-translation` — Specialized terminology is intentionally translated into broader technical language while preserving meaning.
- `information-prioritization` — Repository explicitly decides which evidence/concepts should appear first or receive emphasis.
- `role-taxonomy` — Target professional roles are organized into an explicit reusable taxonomy.

## IoT Provisioning and Simulation

- `iot-test-toolkit` — Repository combines tools for exercising or validating an IoT system rather than one isolated component.
- `gateway-provisioning-tool` — Tool materially records or manages operational gateway-build/provisioning metadata.
- `hardware-simulation` — Software or firmware materially substitutes for physical device behavior in a test path.
- `desktop-operations-tool` — Desktop GUI supports an operational engineering/technician workflow.
- `azure-sql` — Azure-hosted SQL Server is materially integrated as persistence.
- `pyodbc` — PyODBC materially implements database connectivity.
- `relational-schema` — Repository defines a structured relational application schema.
- `database-check-constraints` — SQL CHECK constraints materially enforce allowed domain values.
- `parameterized-sql` — User/data values are supplied through query parameters rather than value string concatenation.
- `firebase-rest-api` — Firebase Realtime Database REST endpoints are materially read or written.
- `azure-iot-hub` — Azure IoT Hub is materially integrated for device/cloud messaging.
- `mqtt` — MQTT materially carries application/device messages.
- `paho-mqtt` — Paho MQTT materially implements MQTT client behavior.
- `mqtt-qos-1` — MQTT QoS 1 delivery is explicitly configured.
- `hardware-stub` — Software intentionally emulates a hardware/device telemetry producer.
- `esp32` — ESP32 firmware materially participates in repository behavior.
- `gpio-control` — Firmware materially controls GPIO state.
- `periodic-device-cycle` — Embedded/test behavior repeats on an explicit timed device cycle.
- `https-post` — HTTPS POST requests materially send application/device data.
- `cloud-path-simulation` — Test tooling exercises a cloud integration path using simulated input/device behavior.
- `hardware-behavior-simulation` — Timing/state behavior of hardware is deliberately emulated for validation.
- `provisioning-audit-log` — Structured records preserve gateway/device provisioning attributes and history context.
- `operational-dashboard` — Web UI is built around monitoring or manipulating operational state.
- `alert-monitoring` — UI materially displays and updates alert/event records.

## Live Network Measurement Telemetry

- `reverse-mode-iperf` — iperf3 reverse mode materially implements server-to-client/downlink measurement.
- `parallel-streams` — Network tests materially configure or interpret multiple concurrent iperf streams.
- `interface-binding` — Measurement traffic is explicitly bound to a selected local network interface/address.
- `dual-interface-measurement` — Measurement and reporting traffic are intentionally assigned to separately selected interfaces.
- `source-bound-http` — HTTP client sockets are explicitly bound to a selected local source address.
- `ipv4-interface-discovery` — Runtime enumerates usable local IPv4 interfaces for operator selection.
- `firebase-stream-telemetry` — Realtime Firebase records carry interval/sample-level measurement streams.
- `measurement-timestamp-reconstruction` — Wall-clock measurement timestamps are reconstructed from experiment/run timing and sample intervals.
- `telemetry-normalization` — Incoming telemetry variants are normalized into one internal representation.
- `schema-compatibility` — Application explicitly supports multiple historical/compatible field aliases.
- `producer-consumer` — Independent producer/consumer work is coordinated through a queue or comparable handoff.
- `multi-stream-plotting` — Visualization renders multiple separately identified measurement streams.
- `stable-stream-identity` — Logical stream identity is explicitly preserved independently of mutable display labels or ambiguous interface names.
- `browser-diagnostics` — Browser UI materially exposes data-grouping/timestamp/processing diagnostics.
- `finite-infinite-test-duration` — Measurement tool supports both bounded and operator-stopped continuous runs.
- `measurement-reporting-path-separation` — Architecture explicitly separates the path under measurement from the path used to report telemetry.
- `synchronized-plots` — Multiple measurement streams are intentionally aligned on comparable time coordinates.
- `local-and-remote-measurement-logging` — Measurement data is retained locally while also published to a remote datastore.

## Multi-CV Build and Artifact Browser

- `multi-cv-library` — Repository maintains multiple simultaneously active CV variants in a structured hierarchy.
- `document-build-system` — Automation materially compiles editable document source into distributable artifacts.
- `artifact-browser` — User-facing application is built around discovering and retrieving generated artifacts.
- `automated-latex-pdf-build` — CI/material automation compiles LaTeX sources into PDFs.
- `generated-artifact-commit` — Automation commits changed generated artifacts back into the repository.
- `path-filtered-ci` — CI execution is materially constrained by repository path-change filters.
- `repository-tree-browser` — UI reconstructs and presents a repository's hierarchical tree.
- `recursive-navigation` — UI navigation materially represents nested arbitrary-depth content.
- `localstorage-cache` — Browser localStorage materially caches fetched application/repository data.
- `cache-then-refresh` — UI renders acceptable cached state and subsequently refreshes from the source.
- `email-password-authentication` — Email/password credentials materially authenticate application sessions.
- `github-api` — GitHub API materially supplies application data or behavior.
- `github-recursive-tree-api` — GitHub recursive tree endpoint materially supplies repository hierarchy data.
- `api-rate-limit-handling` — Application explicitly detects and surfaces remote API rate-limit exhaustion.
- `role-specific-cv-variants` — Multiple CV artifacts intentionally target distinct professional role categories.
- `single-branch-document-variants` — Multiple active document variants coexist structurally on one branch rather than branch-per-variant.
- `source-artifact-pairing` — Editable source and its generated artifact are intentionally associated/colocated.
- `pyside6` — PySide6 materially implements desktop GUI behavior.
- `pyqtgraph` — pyqtgraph materially implements live plotting.
- `live-signal-plotting` — Measurement signals are rendered live while acquisition proceeds.
- `physical-board-disambiguation` — Software distinguishes multiple serial interfaces belonging to the same physical debug/device board.
- `timestamped-run-folders` — Measurement runs are persisted into uniquely timestamped directories.

## Multi-Language CLI Practice

- `multi-language-practice` — Repository deliberately implements comparable programming exercises across multiple languages.
- `cli-applications` — Repository contains multiple substantive command-line applications.
- `go` — Go is materially used in repository-specific implementation.
- `ruby` — Ruby is materially used in repository-specific implementation.
- `php` — PHP is materially used in repository-specific implementation.
- `rust` — Rust is materially used in repository-specific implementation.
- `local-file-persistence` — Application state is materially persisted to local files.
- `temporary-file-replacement` — Persistence writes new state to a temporary file before rename/replacement of the canonical file.
- `domain-modeling` — Repository defines domain entities/services with explicit state and behavior.
- `search-filtering` — User-facing data is materially searched or filtered according to runtime criteria.
- `state-transition-modeling` — Domain behavior contains explicit valid state transitions.
- `cli-command-dispatch` — CLI input is dispatched into distinct application commands/actions.
- `task-manager` — Application materially implements task lifecycle management.
- `library-manager` — Application materially implements a book/library borrowing workflow.
- `inventory-manager` — Application materially implements product/inventory management.

## Lab Equipment Lifecycle Tracking

- `lab-equipment-tracker` — Application materially tracks physical laboratory equipment and its operational state.
- `inventory-management` — Application materially manages inventory records and quantities.
- `operational-web-application` — Browser application supports ongoing real-world operational workflows.
- `persistent-auth-session` — Authentication persistence intentionally survives ordinary browser reload/session flow.
- `authenticated-database-access` — Application data reads/writes are materially restricted to authenticated users.
- `realtime-subscriptions` — UI state materially updates from realtime database subscriptions.
- `atomic-multipath-update` — One database operation updates multiple related paths as a coordinated mutation.
- `server-timestamps` — Server-generated datastore timestamps materially record lifecycle events.
- `base64-photo-storage` — Image data is validated/encoded as Base64 data URLs for persistence.
- `nested-to-tabular-export` — Nested domain records are flattened into tabular export rows.
- `serial-number-inventory` — Physical inventory is tracked at individual serial-number granularity.
- `equipment-location-tracking` — Structured physical location is materially stored and updated for equipment instances.
- `equipment-lending-workflow` — Equipment serials materially transition through lend/return states.
- `borrower-tracking` — Person/member identity is materially associated with currently lent equipment.
- `inventory-notes` — Equipment records materially support dated operational notes.
- `activity-history` — Operational state changes materially produce persisted history records.
- `historical-log-preservation` — Historical activity records are deliberately retained when current entities are deleted.
- `inventory-reporting` — Service/application materially assembles inventory data for human-readable reports.
- `domain-invariant-validation` — Application explicitly enforces cross-field/domain consistency rules before mutation.
- `duplicate-prevention` — Domain logic materially rejects duplicate identity records.
- `state-transition-guards` — Application blocks invalid lifecycle transitions according to current state.
- `audit-coupled-state-change` — Current-state mutation and its audit/history event are deliberately written together.
- `user-attribution` — Persisted operational changes materially record authenticated actor identity.

## Earliest-Observed Retrieval Tags

- `earliest-observed-automated-quectel-network-validation-harness` — repository 106.
- `earliest-observed-plmn-gated-modem-test-plan` — repository 106.
- `earliest-observed-explicit-systems-career-repositioning-artifact` — repository 107.
- `earliest-observed-azure-iot-mqtt-hardware-stub` — repository 108.
- `earliest-observed-azure-sql-gateway-provisioning-tool` — repository 108.
- `earliest-observed-integrated-iot-provisioning-simulation-dashboard-toolkit` — repository 108.
- `earliest-observed-dual-interface-iperf-firebase-measurement-agent` — repository 109.
- `earliest-observed-stream-code-isolated-realtime-throughput-dashboard` — repository 109.
- `earliest-observed-automated-multi-cv-latex-build-library` — repository 110.
- `earliest-observed-authenticated-github-cv-artifact-browser` — repository 110.
- `earliest-observed-go-ruby-php-rust-comparative-practice-repository` — repository 111.
- `earliest-observed-serial-level-lab-equipment-lifecycle-tracker` — repository 112.
- `earliest-observed-audit-coupled-firebase-inventory-workflow` — repository 112.
