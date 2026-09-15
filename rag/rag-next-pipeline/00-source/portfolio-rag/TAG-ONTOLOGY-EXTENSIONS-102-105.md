# Tag Ontology Extensions — Repositories 102–105

This file extends the corpus tag vocabulary with factual concepts positively evidenced in repositories 102–105.

## Full-Stack Web / Cloudflare

- `react-19` — React 19 application implementation.
- `react-router` — client-side route composition with React Router.
- `vite` — Vite development/build tooling.
- `hono` — Hono HTTP/API framework implementation.
- `cloudflare-workers-ready` — Worker-oriented API code and Wrangler configuration are implemented.
- `cloudflare-d1` — Cloudflare D1 is the implemented relational persistence abstraction.
- `wrangler` — Wrangler scripts/configuration support local Worker/D1 development and deployment.
- `public-api-routes` — application exposes implemented public API routes.
- `admin-api-routes` — application exposes implemented administrative API routes.
- `bearer-token-auth` — bearer-token middleware protects administrative routes.
- `secure-headers` — HTTP security headers middleware is configured.
- `request-id` — per-request identifiers are generated/propagated in API responses.
- `cors-configuration` — API CORS behavior is explicitly configured.
- `api-validation` — request/query payloads are validated before persistence/use.
- `body-size-limit` — HTTP request size is explicitly bounded.
- `repository-layer` — database access logic is separated into repository/data-access modules.
- `d1-migrations` — versioned D1/SQLite schema migration is checked in.
- `strict-sqlite-tables` — SQLite/D1 STRICT tables and CHECK constraints define domain invariants.
- `relational-status-workflow` — persisted lifecycle/status transitions model operational workflows.
- `status-history` — status changes are persisted as historical events.
- `base64-file-storage` — binary file content is encoded as Base64 for persistence.
- `base64-resume-storage` — job-application resumes are persisted as Base64 data.
- `file-signature-validation` — binary/file-type signatures are validated against declared content types.
- `job-board` — jobs are represented with public listing/detail flows.
- `job-application-workflow` — applicants can submit structured job applications.
- `human-review-workflow` — application states support administrative human review.
- `contact-request-workflow` — contact requests are persisted and reviewed through statuses.
- `project-inquiry-workflow` — structured project inquiries are persisted and reviewed.

## Automated Network-Lab Grading

- `mininet` — Mininet is used to construct/emulate the network topology.
- `dual-homed-load-balancer` — load balancer connects distinct client/backend subnets through two interfaces.
- `round-robin-load-balancing` — requests are distributed cyclically across backends.
- `thread-safe-round-robin` — shared round-robin state is guarded with a lock.
- `thread-per-client` — concurrent clients are handled by independent threads.
- `newline-framing` — TCP request framing uses newline-delimited messages.
- `automated-grading` — repository contains an automated grading/evaluation harness.
- `bash-grading-harness` — Bash orchestrates environment setup, execution and grading.
- `mininet-namespace-execution` — commands are executed inside Mininet host namespaces.
- `network-connectivity-matrix` — grading explicitly checks expected reachable/unreachable host pairs.
- `sequential-concurrent-evaluation` — both sequential and concurrent client cases are exercised.
- `csv-result-verification` — produced CSV records are programmatically validated and scored.
- `course-scaffold-boundary` — supplied course specification/scaffold is separated from attributable tooling/reference code.

## Shell Bootstrap / Source Build

- `strict-shell-mode` — Bash enables `set -euo pipefail`.
- `source-build` — software is cloned/configured/compiled from source.
- `autotools` — `autogen.sh` and `configure` drive the build configuration.
- `user-local-prefix` — software installs under a user-local prefix rather than a system path.
- `parallel-make` — build parallelism is derived from available processors.
- `shell-path-bootstrap` — installer persists a user-local binary directory in shell PATH configuration.
- `tmux-source-build` — tmux is built and installed from its upstream Git repository.

## RF Measurement / tinySA

- `tinysa` — software directly controls a tinySA spectrum analyzer.
- `usb-device-detection` — serial instrument discovery uses USB VID/PID matching.
- `pyserial` — PySerial drives serial instrument communication.
- `raw-scan-command` — tinySA raw spectrum scan command is issued directly.
- `binary-scan-decoding` — raw binary scan payloads are validated and decoded.
- `scheduled-sweep-acquisition` — repeated spectrum sweeps target explicit scheduled start times.
- `fixed-period-acquisition` — acquisition cadence is expressed as a fixed start-to-start period.
- `in-memory-acquisition-buffer` — completed sweep samples are retained in memory before export.
- `sweep-timing-metadata` — scheduled start, actual start, end, duration, offset and buffer are recorded.
- `spectrum-sweep-export` — sweep data and plots are exported to structured artifacts.
- `multipage-pdf-report` — a multi-page PDF report is generated from sweep results.
- `waterfall-analysis` — multiple sweeps are assembled into a two-dimensional power matrix.
- `frequency-axis-validation` — post-processing verifies sweep frequency axes before stacking.
- `rf-power-logging` — software records frequency-domain RF power measurements.

## Earliest-Observed Retrieval Tags

- `earliest-observed-hono-cloudflare-d1-full-stack-workflow` — repository 102.
- `earliest-observed-base64-resume-storage-in-d1` — repository 102.
- `earliest-observed-automated-mininet-grading-harness` — repository 103.
- `earliest-observed-thread-safe-round-robin-reference-solution` — repository 103.
- `earliest-observed-tmux-source-build-bootstrap` — repository 104.
- `earliest-observed-tinysa-automated-spectrum-sweep-tooling` — repository 105.
- `earliest-observed-rf-waterfall-post-processing` — repository 105.
