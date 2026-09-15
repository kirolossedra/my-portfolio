# Tag Ontology Extensions — Repositories 125–129

This batch adds repository-specific vocabulary for native iOS FTP integration, repeatable FTP experiment orchestration, mobile-robot wireless research, normalized-motion analysis, and publication-oriented network automation.

## Repository 125 — SwiftFTP

- `white-raccoon` — externally authored Objective-C FTP library by Valentin Radu, explicitly preserved with source attribution.
- `cfnetwork` — Apple CFNetwork primitives are used by the incorporated FTP library.
- `nsstream` — Foundation stream abstractions and `NSStreamDelegate` underpin asynchronous transfer behavior.
- `legacy-library-integration` — an older Objective-C networking library is incorporated into a later research application context.
- `uwaterloo-research-context` — the surrounding SedraFTP scene source carries University of Waterloo project context.

## Repository 126 — SedraFTPVariant

- `udp-control-plane` — UDP commands and status messages coordinate FTP experiment execution independently from the measured bulk-data path.
- `queue-based-ui-events` — background UDP/network threads deliver events to Tkinter through a thread-safe queue.
- `automated-network-testing` — FTP workloads are executed repeatedly with explicit trial-count and separation controls.
- `virtual-filesystem` — `pyftpdlib` is extended with custom virtual-file behavior.
- `generated-streaming-data` — server-side file-like objects generate data during reads instead of relying on a finite stored payload.
- `partial-file-download` — downloads are written to a temporary `.part` path before finalization.
- `atomic-file-replace` — `os.replace` commits a completed download into its final path.
- `apple-simpleping` — Apple's externally authored SimplePing sample is incorporated as a diagnostic component.
- `experiment-logging` — automated iOS runs create timestamped milestone logs and serialize writes through a dispatch queue.

## Repository 127 — Mobile-Robots-Telecommunications

- `wifi-roaming` — Wi-Fi association changes and access-point presence are analyzed against signal/performance data.
- `multi-ap` — the research includes multi-access-point experimental configurations.
- `handover-analysis` — performance is related to wireless mobility/handover events.
- `noise-floor` — noise-floor measurements are incorporated into the Wi-Fi experiment workflow.
- `packet-loss-analysis` — processing utilities identify or reconstruct packet-loss information from logs.
- `retransmission-analysis` — iperf-oriented processing includes retransmission evidence.
- `timestamp-normalization` — heterogeneous Unix/EST timestamp sources are transformed toward a common representation.
- `time-series-alignment` — latency, throughput, radio, and association data are synchronized for joint interpretation.
- `downsampling` — high-frequency latency samples are averaged into lower-rate series for alignment.
- `cdf-analysis` — empirical cumulative distributions are generated for research statistics.
- `correlation-analysis` — throughput/latency is related statistically to radio-quality metrics.
- `latex-table-generation` — browser tools produce LaTeX-ready statistics for reports or manuscripts.
- `browser-analysis-tools` — self-contained HTML/JavaScript utilities perform local research-log processing and visualization.
- `rogers-experiment` — repository documentation explicitly identifies the Rogers experimental context.

## Repository 128 — Indoor-Journal-

- `research-journal` — experiment plans, field observations, failures, fixes, and tooling coexist as an evolving research record.
- `indoor-mobility` — wireless measurements are tied to an indoor moving-robot trajectory.
- `kernel-module-operations` — modem operation includes rebuilding, installing, removing, and loading QMI-related Linux kernel modules.
- `ros2-logging` — robot motion start/stop timing is incorporated into the experiment acquisition procedure.
- `motion-event-analysis` — network data is segmented using logged motion-event windows.
- `repeatability-analysis` — repeated route durations are summarized statistically before cross-run comparison.
- `coefficient-of-variation` — motion repeatability tooling computes CV alongside mean, SD, quartiles, and range.
- `trajectory-normalization` — runs with different durations are mapped to a common normalized motion coordinate.
- `normalized-motion-progress` — link/performance samples are represented by fractional route progress rather than raw elapsed time alone.
- `time-series-binning` — normalized trajectories are aggregated into progress bins with per-bin statistics.
- `sustained-load-testing` — an endless download workload supports long-running speed/thermal experiments.
- `thermal-testing` — sustained network load is used in a thermal/performance experimentation context.
- `traffic-throttling` — the repository includes a C++ rate-control layer for constrained traffic experiments.

## Repository 129 — Apple-Publication

- `research-publication-tooling` — experiment and processing utilities are assembled around publication-oriented network analysis.
- `experiment-scripting` — experiment sequences are represented as editable command programs.
- `domain-specific-language` — the Net++ runner defines a small language for `automate` and `sleep` operations.
- `syntax-validation` — Net++ source is parsed and checked before execution.
- `semantic-validation` — command argument presence, type, and range constraints are validated during build.
- `comment-parsing` — the Net++ parser explicitly handles `#` comments, with repository history showing iteration on that behavior.
- `interface-binding` — iperf3 test traffic can be bound to a selected local network interface/address.
- `tcp-ramp-analysis` — tshark time-bin data is transformed into early TCP delivery/ramp evidence.
- `tcp-slow-start-analysis` — cumulative byte growth and doubling points are used to inspect TCP startup behavior.
- `cumulative-bytes` — packet-delivery bins are accumulated into `B(t)`.
- `doubling-point-analysis` — the tool identifies first crossing times for `B0 × 2^k` targets.
- `packet-capture-analysis` — tshark `io,stat` output derived from packet captures is parsed and visualized.
- `cross-repository-code-reuse` — identical Git blobs and evolved copies are explicitly tracked as reused portfolio infrastructure rather than counted as separate inventions.
