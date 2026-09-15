# Tag Ontology Extensions — Repositories 120–124

This file extends the corpus tag vocabulary with factual concepts positively evidenced in repositories 120–124.

## MATLAB Network and Communications Experiments

- `udp-broadcast` — MATLAB sender materially transmits IPv4 UDP datagrams to the broadcast address.
- `shared-port-reception` — Multiple MATLAB receiver sessions materially bind the same UDP port with port sharing enabled.
- `callback-driven-networking` — Datagram reception materially executes through MATLAB receive callbacks.
- `packet-indexing` — Traffic payloads materially carry application-level sequence indices that receivers parse and log.
- `fixed-payload-traffic` — Sender materially normalizes packets to a configured payload size before transmission.
- `packet-rate-measurement` — Receiver materially relates received-packet count to elapsed time.
- `awgn` — Receiver variants materially apply additive white Gaussian noise using MATLAB's `awgn` function.
- `byte-error-measurement` — Noisy re-quantized bytes are materially compared with original datagram bytes.
- `packet-loss-simulation` — Byte-error measurements materially feed a stochastic packet-drop decision.
- `packet-error-rate` — Receiver termination statistics materially report lost packets relative to total processed/lost packets.
- `lost-packet-index-tracking` — Simulated drops materially preserve explicit packet sequence indices per receiver.

## Browser-Based Network Analysis

- `network-log-analysis` — Browser code materially parses semi-structured network-performance logs into structured measurements.
- `throughput-visualization` — Upload/download throughput is materially visualized as time-series data.
- `ftp-log-analysis` — A separate browser analyzer materially parses FTP completion, duration, and byte-count records.
- `ftp-performance-analysis` — FTP transfer times and derived MB/s are materially summarized and plotted.
- `moving-average` — Client-side code materially applies configurable trailing-window smoothing.
- `timestamp-normalization` — Absolute log timestamps are materially converted into experiment-relative elapsed seconds.
- `duplicate-removal` — FTP analysis materially deduplicates equivalent transfer observations before statistics.
- `descriptive-statistics` — Mean and population standard deviation are materially computed for FTP time and speed.
- `clipboard-api` — Rendered chart images are materially written to the browser clipboard.
- `canvas-api` — Offscreen canvases materially prepare chart images with a controlled background.
- `csv-export` — Normalized network measurements are materially exported as CSV.
- `single-file-browser-analysis` — Analysis UI, parsing logic, statistics, and presentation are materially packaged inside standalone HTML documents.

## Safety-Constrained Robot Control

- `control-lyapunov-function` — Repository materially implements a CLF-style goal-seeking controller for robot motion.
- `control-barrier-function` — Repository materially constructs obstacle barrier values and constraints.
- `clf-cbf-qp` — Desired CLF motion and CBF safety constraints are materially combined through quadratic programming.
- `quadratic-programming` — CVXOPT materially solves constrained velocity optimization problems.
- `soft-constraints` — QP formulation materially includes weighted slack for constrained control.
- `solver-fallback` — Controller materially defines alternate control behavior for QP solver failure.
- `geometric-waypoint` — Repository materially creates obstacle-offset waypoints from path geometry.
- `stuck-detection` — Navigation loop materially tracks recent progress and prolonged lack of motion.
- `line-of-sight-evasion` — Danger-zone recovery materially scans explicit candidate escape headings.
- `rotation-arc-safety` — Candidate rotations materially sample the projected gripper sweep for obstacle proximity.
- `sampled-path-checking` — Candidate and executing linear paths materially sample intermediate positions against obstacles.
- `fail-closed-robot-safety` — Emergency behavior materially commands a halt when no safe route exists or a route becomes invalid.
- `gripper-aware-navigation` — Goal and safety geometry materially account for the gripper's offset from the robot base.

## iOS Networking Integration and Provenance

- `local-pod-integration` — Example iOS application materially consumes STFTPNetwork through a local CocoaPods path dependency.
- `corewifi` — Incorporated Objective-C component materially uses Apple's CoreWiFi APIs.
- `wifi-scanning` — Incorporated component materially performs active Wi-Fi network scans.
- `wifi-association` — Incorporated component materially selects and associates with a scanned network.
- `rssi` — Network selection and experiment logging materially use received signal strength.
- `external-library-integration` — Repository materially assembles externally authored networking components into an iOS project environment.
- `vendored-dependencies` — Checked-in CocoaPods materially form a large part of the repository tree.
- `source-attribution` — Repository source/README materially names authors of incorporated networking components.
- `certificate-cleanup` — Git history materially records deletion of a `.p12` certificate artifact.
- `provisioning-profile-cleanup` — Git history materially records deletion of a mobile provisioning artifact.
- `research-networking-integration` — Repository materially combines Wi-Fi selection behavior and FTP-transfer infrastructure in an experimental project archive.

## Repository Markers

- `repository-initialization` — Checked-in source materially establishes a repository identity through its initial commit.
- `portfolio-marker` — Repository materially contributes a dated project marker to portfolio chronology.

## Earliest-Observed Retrieval Tags

- `earliest-observed-matlab-udp-broadcast-packet-loss-experiment` — repository 120.
- `earliest-observed-browser-network-log-analysis-suite` — repository 121.
- `earliest-observed-browser-ftp-time-speed-statistics` — repository 121.
- `earliest-observed-clf-cbf-qp-with-linear-evasion-backup` — repository 122.
- `earliest-observed-rotation-arc-gripper-safety-check` — repository 122.
- `earliest-observed-ios-networking-integration-with-explicit-external-attribution` — repository 123.
- `earliest-observed-repository-only-portfolio-marker` — repository 124.
