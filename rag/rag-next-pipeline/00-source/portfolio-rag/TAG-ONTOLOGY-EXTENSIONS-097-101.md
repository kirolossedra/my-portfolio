# Tag Ontology Extensions — Repositories 097–101

This file extends the corpus tag vocabulary with concepts positively evidenced in repositories 097–101. Tags remain factual retrieval metadata rather than ratings.

## Wireless Experiment Logging and Aruba Analysis

- `research-tooling` — utility code built to support experimental or research workflows.
- `wireless-networking` — implementation or analysis centered on wireless network behavior.
- `aruba` — Aruba wireless infrastructure is directly represented in the retained workflow.
- `aruba-log-analysis` — parsing and analysis of Aruba station/access-point log output.
- `semi-structured-log-parsing` — extraction of structured fields from non-tabular textual logs.
- `target-mac-filtering` — analysis explicitly filters observations to a configured MAC address.
- `bssid` — Basic Service Set Identifier values are parsed, tracked, or analyzed.
- `bssid-transition-analysis` — chronological changes between BSSIDs are explicitly detected.
- `roaming-analysis` — access-point association changes are analyzed in a roaming-oriented workflow.
- `wifi-channel-analysis` — Wi-Fi channel information is parsed or analyzed.
- `channel-transition-analysis` — chronological Wi-Fi channel changes are explicitly detected.
- `rssi` — Received Signal Strength Indicator is processed.
- `snr` — signal-to-noise-ratio data is processed.
- `timestamped-logging` — measurement/log entries are persisted with explicit timestamps.
- `cross-platform-command-handling` — code selects or adapts operating-system command behavior across platforms.
- `live-log-tailing` — a running tool's log file is read while the producer process is still active.
- `earliest-observed-aruba-station-log-analysis` — repository 097 is the earliest observed processed repository centered on dedicated Aruba station-log parsing.
- `earliest-observed-bssid-channel-transition-tooling` — repository 097 is the earliest observed processed repository combining explicit BSSID and channel transition detection.

## DHCP Extensions

Existing canonical DHCP/BOOTP tags from the 090–096 ontology remain applicable.

- `static-dhcp-reservation` — DHCP behavior includes a deterministic MAC-to-IP reservation table.
- `dhcp-release-handling` — DHCP RELEASE messages cause tracked lease state to be relinquished.

## Browser-Based Experiment Analysis

- `browser-based-log-analyzer` — local browser application parses uploaded experiment logs and renders analysis without a separate backend.
- `chartjs` — Chart.js is used for data visualization.
- `drag-and-drop-files` — browser interface accepts files through drag-and-drop input.
- `multi-axis-plotting` — one chart renders multiple measurement scales using distinct axes.
- `clipboard-image-copy` — rendered plots can be copied to the system clipboard as images.
- `timestamp-alignment` — heterogeneous measurements are synchronized using timestamps.
- `timestamp-unification` — experiment workflow explicitly standardizes timestamp representation across data sources.
- `log-slicing` — a larger log is reduced to a selected experiment time interval.
- `experiment-window-alignment` — multiple logs are restricted/aligned to a common experiment window.
- `sample-alignment` — arrays from separate measurement sources are trimmed, padded, or otherwise aligned for comparison.
- `multi-run-analysis` — multiple experimental runs are aggregated or compared.
- `statistical-analysis` — explicit quantitative statistical processing is implemented.
- `mean` — arithmetic mean is computed as an analysis statistic.
- `standard-deviation` — standard deviation is computed across repeated measurements.
- `outlier-handling` — explicit logic modifies, filters, or substitutes configured outlying measurements.
- `experimental-reproducibility` — retained setup, logs, traces, alignment diagnostics, or configuration materially support repeatability/inspection.

## Cellular Modem and 5G Experimentation

- `quectel-modem` — Quectel cellular modem hardware is directly integrated or documented in the experiment.
- `qconnectmanager` — QConnectManager is used to bring up/manage the modem interface.
- `cellular-modem` — a cellular modem is directly controlled or measured.
- `at-commands` — modem interaction uses AT commands.
- `at-command-telemetry` — AT command responses are parsed into measurement telemetry.
- `lte` — LTE serving-cell metrics are directly represented.
- `5g` — fifth-generation cellular network behavior is directly represented.
- `nr5g-nsa` — 5G Non-Standalone serving-cell information is parsed or analyzed.
- `rsrp` — Reference Signal Received Power is represented.
- `rsrq` — Reference Signal Received Quality is represented.
- `sinr` — Signal to Interference plus Noise Ratio is represented.
- `arfcn` — Absolute Radio-Frequency Channel Number is represented.
- `pyserial` — Python serial-port APIs are used for modem/device communication.
- `json-logging` — measurements are persisted as JSON logs.
- `earliest-observed-quectel-5g-modem-telemetry` — repository 098.
- `earliest-observed-nr5g-nsa-serving-cell-parser` — repository 098.
- `earliest-observed-integrated-wifi-cellular-robot-experiment-workspace` — repository 098.

## Robot / RF Experiment Context

- `husky-robot` — Clearpath Husky robot setup is directly documented as part of the experiment.
- `multi-ap-experiment` — a physical experiment uses or plans measurements across multiple Wi-Fi access points.
- `station-presence` — analysis derives station/client presence in infrastructure logs.
- `noise-floor` — RF noise-floor measurement is directly represented in experiment configuration or analysis.
- `rf-experiment` — physical radio-frequency experiment conditions are directly adjusted or measured.
- `experimental-systems-engineering` — multiple acquisition, physical setup, synchronization, and analysis components are coordinated as one experimental system.

## UDP Broadcast and Desktop Receiver Tooling

- `udp-broadcast` — UDP/IP broadcast traffic is sent, received, or simulated.
- `tkinter` — Python Tkinter is used for desktop GUI implementation.
- `desktop-gui` — retained code implements a desktop graphical interface.
- `multithreading` — multiple threads perform concurrent work.
- `thread-safe-queue` — a queue is used to safely pass messages from worker threads to GUI/update logic.
- `burst-throughput-measurement` — packet bursts are grouped and converted into byte/MiB/Mbps measurements.
- `packaged-executable` — a built executable artifact is retained as distribution/execution evidence.

## ns-3 Broadcast Simulation

- `802-11g` — IEEE 802.11g is explicitly configured in the ns-3 model.
- `custom-ns3-application` — repository defines its own ns-3 `Application` subclass.
- `wifi-broadcast-simulation` — ns-3 simulation models Wi-Fi broadcast transmission/reception.
- `mac-header-inspection` — code reads Wi-Fi MAC headers to identify/count broadcast traffic.
- `pcap` — packet capture output is enabled for experiment/simulation inspection.

## Repository Placeholder Evidence

- `repository-placeholder` — repository has only minimal naming/placeholder content and no substantive implementation artifact.
- `project-concept` — repository title preserves a project idea/topic without enough retained implementation evidence to expand technical claims.
- `jackal-performance-heatmaps-using-mmwave-title` — repository 099 preserves exactly this project-title concept; the tag does not assert implementation of any component named in the title.

## Ray-Tracing Reference Material

- `mathworks-example` — retained source explicitly carries MathWorks copyright/example attribution.
- `rf-propagation` — RF propagation modeling is represented.
- `ray-tracing` — propagation paths are modeled with ray tracing.
- `3d-scene` — propagation workflow uses a three-dimensional scene model.
- `gltf` — glTF scene format is used.
- `glb` — binary glTF scene file is used.
- `siteviewer` — MATLAB Site Viewer is used.
- `txsite` — MATLAB transmitter-site object is used.
- `rxsite` — MATLAB receiver-site object is used.
- `cartesian-coordinates` — transmitter/receiver positions use Cartesian coordinates.
- `propagation-model` — a configured propagation model is created.
- `reflections` — reflected propagation paths are part of the modeled mechanism.
- `diffraction` — diffracted paths are part of the modeled mechanism.
- `comm-ray` — MATLAB `comm.Ray` propagation path objects are represented.
- `material-aware-propagation` — scene material mappings contribute to propagation analysis.
- `propagation-path-visualization` — calculated ray paths are displayed in the 3-D environment.
- `earliest-observed-matlab-3d-rf-ray-tracing-workflow` — repository 100; this marks earliest observed study/retention of the workflow, not original authorship of the externally attributed source.

## Content Retrieval and Document Automation

- `desktop-utility` — a small user-facing desktop utility automates a practical workflow.
- `content-automation` — external content is transformed into generated artifacts.
- `web-retrieval` — HTTP retrieval is a core workflow stage.
- `web-scraping` — HTML pages are parsed to extract targeted content.
- `requests` — Python Requests is used for HTTP.
- `beautifulsoup` — Beautiful Soup parses HTML.
- `html-parsing` — structured values are extracted from HTML.
- `genius-integration` — Genius search/page content is integrated into the workflow.
- `lyrics-processing` — lyrics text is parsed/transformed as input content.
- `section-parsing` — text is segmented into named bracket-delimited sections.
- `text-normalization` — text is normalized before downstream output.
- `ascii-normalization` — metadata is converted to ASCII for output consistency.
- `filename-sanitization` — user/query-derived filenames are restricted to safer characters.
- `python-pptx` — the `python-pptx` library is used.
- `powerpoint-generation` — PowerPoint files are generated programmatically.
- `document-automation` — document/presentation construction is automated from structured input.
- `pptx-export` — generated output is persisted as `.pptx`.
- `dynamic-font-sizing` — font size is chosen based on content length.
- `programmatic-layout` — slide geometry and visual formatting are set in code.
- `batch-processing` — multiple user items are processed in one operation.
- `progress-logging` — user-visible progress is logged during a multi-step workflow.
- `failure-isolation` — per-item failures are handled so batch processing can continue.
- `filesystem-output` — generated artifacts are written to local filesystem paths.
- `output-directory-management` — the utility creates/uses a configurable output directory.
- `external-content-boundary` — external retrieved content is distinguished from authored software.
- `incremental-productization` — commit history visibly evolves a script into a more complete user-facing utility.
- `earliest-observed-python-pptx-workflow` — repository 101.
- `earliest-observed-automated-powerpoint-generation` — repository 101.
- `earliest-observed-lyrics-to-pptx-desktop-tool` — repository 101.
