# Mobile-Robots-Telecommunications

## Repository Identity

- Repository: 127 / 138
- Name: `Mobile-Robots-Telecommunications`
- Start date: 2025-11-30
- Latest meaningful update: 2025-12-25
- Latest meaningful commit: `a82d7783edf5b219d59d327e231062e8b1fb9877`
- Primary repository language metadata: HTML
- Technical field: mobile-robot wireless networking, Wi-Fi and cellular experimental analysis
- Domain: robotics telecommunications research
- Context: Rogers / University of Waterloo mobile-robot networking experimentation
- Collaboration type: `research-collaboration`

## Collaboration and Evidence Context

This repository is a research tooling and operating journal rather than a conventional software product.

The root documentation explicitly names a `Rogers Experiment`.

It also refers to:

- a Husky mobile robot,
- University of Waterloo RoboHub infrastructure,
- a credentialed UWaterloo QConnectManager repository,
- Quectel cellular hardware,
- Wi-Fi access-point configurations,
- 5G experiments.

The appropriate interpretation is therefore a research collaboration context.

Repository-specific HTML tools, experiment procedures, and analysis workflows are strong evidence of hands-on experimental engineering.

The QConnectManager driver itself is described as being cloned from a University of Waterloo repository and must be treated as external research infrastructure rather than owner-authored modem-driver code.

## What This Project Is

`Mobile-Robots-Telecommunications` is a research toolkit for collecting, aligning, processing, visualizing, and statistically analyzing wireless performance data while a mobile robot operates across Wi-Fi and 5G networks.

The project connects several experimental dimensions:

- robot mobility,
- Wi-Fi association and roaming,
- 5G radio metrics,
- latency,
- throughput,
- packet loss,
- retransmissions,
- signal quality,
- multi-run statistics.

The repository is organized by wireless technology and experiment shape.

Major branches include:

- Wi-Fi single-access-point analysis,
- Wi-Fi mesh / multi-access-point analysis,
- 5G modem operation,
- 5G data processing.

The repository therefore bridges **experiment operation** and **post-processing**.

It is not just a set of plots.

It records how the networking experiment is run, how clocks are normalized, how raw outputs are transformed, and how mobility events are related to network performance.

## Mobile Robot Experimental Setup

The root README documents basic Husky access.

The workflow includes:

1. configuring the Ethernet host on the same subnet as the Husky,
2. pinging the Husky to verify connectivity,
3. connecting through SSH,
4. enabling joystick operation.

This grounds the project in a physical robot workflow rather than a purely simulated network dataset.

## Rogers Experiment Workstreams

The documented completed work includes:

- mid-range 5G modem sanity checking,
- collecting useful AT-command behavior,
- repeating a two-access-point Wi-Fi setup,
- repeating a single-access-point Wi-Fi setup,
- collecting uplink data,
- collecting downlink data,
- logging noise-floor information,
- running separate 5G uplink and downlink tests.

These are concrete experimental operations.

## Experimental-System Improvements

The root documentation records a sequence of changes intended to improve measurement quality and repeatability.

### Unified Timestamps

The workflow was moved toward unified timestamps across:

- logs,
- latency data,
- iperf data.

This matters because the entire analysis depends on aligning multiple time series.

### Lightweight Multi-Laptop Arrangement

The experiment was reorganized around two Linux laptops.

This reduced system overhead and distributed experiment responsibilities.

### Consolidated Logging

Instead of generating multiple files for each access point, the process was changed toward generating logs once per experiment.

This reduces file-fragmentation and alignment complexity.

### RF Placement

The equipment was moved onto a plastic shelf instead of directly on concrete.

This is an example of physical-layer experimental awareness rather than treating the network purely as software.

### Access-Point Transmit Power

Transmit power was reduced so that roaming could occur in the two-AP experiment.

That is an important research-control decision: the network was intentionally configured to expose the mobility phenomenon being studied.

### Retransmission and Noise-Floor Data

The experiment scripts were updated to surface retransmission information and add noise-floor logging.

## Repository Architecture

A useful high-level view is:

```text
Physical robot + Wi-Fi / 5G links
              ↓
raw network / radio / mobility logs
              ↓
timestamp normalization and preprocessing
              ↓
alignment across latency, throughput, and radio state
              ↓
statistical aggregation
              ↓
interactive plots / tables / exportable evidence
```

The project has no single runtime service.

Instead, the architecture is a pipeline of research artifacts.

## Wi-Fi Single-AP Processing Suite

The `Wi-Fi/Single AP` directory contains a sequence of browser tools identified as `sap1`, `sap2`, and later versions.

The README documents the purpose of these variants.

### `sap1`

`sap1` performs multi-run analysis of SNR with throughput and latency.

It supports:

- multiple runs,
- fixed-duration enforcement,
- SNR averaging,
- throughput averaging,
- latency averaging,
- latency segmentation,
- SNR-versus-performance plotting.

### `sap2`

`sap2` builds on that analysis with:

- latency outlier filtering,
- contiguous latency-region statistics,
- plotting of categorized regions.

### `sap3`

`sap3` focuses on statistical latency analysis.

Its outputs include:

- percentile summaries,
- CDF information,
- histograms,
- copy-paste-ready LaTeX tables.

This is direct evidence of tooling aimed at research reporting, not merely visual inspection.

### `sap4`

`sap4` preserves the statistical workflow while moving from Unix timestamps to EST timestamps.

The distinction reflects an active effort to standardize time representation.

### `sap5`

`sap5` introduces time-range segmentation.

It can divide a run into:

- a user-selected interval,
- the remainder of the run.

Statistics and tables are then generated separately for the segments.

This supports questions such as comparing motion or transition periods against the rest of the trajectory.

### `sap6`

`sap6` performs throughput-oriented statistics on iperf3 data.

The documented output includes:

- throughput statistics,
- time-series statistics,
- jitter,
- retransmits,
- LaTeX-ready tables.

### `sap7`

`sap7` converts Unix timestamps in ping logs to Eastern time.

It acts as a preprocessing utility before downstream tools.

### `sap8`

`sap8` reduces 20 Hz ping data to 1 Hz by averaging groups of twenty measurements.

This addresses mismatched sampling rates across experiment sources.

### `sap9` and `sap11`

These versions alter latency categorization/display thresholds while keeping the broader plotting workflow.

### `sap10`

`sap10` aligns throughput and latency based on throughput timestamps.

This is another concrete synchronization utility in the pipeline.

### `sap12`

`sap12` cleans ping data by:

- removing duplicate entries,
- inserting explicit lost-packet markers when sequence/timing gaps indicate loss.

This improves downstream loss-rate analysis.

### `sap13`

The documented purpose of `sap13` is advanced statistical handling of high-variability latency data using randomized techniques.

The README describes randomized or bootstrap/Monte-Carlo-style filtering intended to reduce outlier bias.

### Later Visual Iteration

`sap15` and `sap16` represent stylistic/visual iteration on the analytical plotting tools.

This indicates that research presentation quality became part of the tooling workflow.

## Wi-Fi Mesh / Roaming Analysis

The `Wi-Fi/Mesh` directory shifts from a single AP to association changes between access points.

### AP Presence

`tap1` plots signal strength against access-point presence.

The analysis can therefore show which AP the client is associated with at a given time.

### SNR and AP Association

`tap2` plots SNR against AP presence.

This links radio quality directly with roaming/association state.

### Performance Overlay

The documented `tap3` design overlays:

- latency,
- throughput,
- AP1/AP2 presence.

The throughput stream is aligned with presence.

The tool also includes plot copy-to-clipboard behavior.

This is direct evidence of investigating network mobility rather than analyzing performance as a stationary aggregate.

## 5G Operating Workflow

The `5G/Operating/MidBand` documentation describes how a Quectel modem is brought into service under Linux.

### ModemManager Isolation

The procedure stops Linux `ModemManager` when direct modem access is needed.

### QConnectManager

The documented workflow clones UWaterloo's QConnectManager repository and builds it locally.

The project records:

- compiling the driver/tooling,
- running `quectel-CM`,
- exposing a `wwan0` interface,
- using IPv4 and IPv6.

The QConnectManager code itself is external research infrastructure.

The engineering evidence here concerns setup, integration, troubleshooting, and use in the experiment.

### Interface-Bound Network Testing

The documentation includes ping and iperf3 commands that explicitly bind to the cellular interface.

This helps ensure the measurement traverses the intended network path.

### AT Commands

The project uses serial AT commands through tools such as `minicom`.

`AT+QENG="servingcell"` is used to obtain serving-cell information.

### LTE Metrics

The documentation interprets fields including:

- MCC,
- MNC,
- Cell ID,
- physical cell ID,
- EARFCN,
- band,
- uplink/downlink bandwidth,
- tracking-area code,
- RSRP,
- RSRQ,
- RSSI,
- SINR,
- CQI,
- transmit power.

### 5G NSA Metrics

For the NR leg it interprets fields such as:

- physical cell ID,
- RSRP,
- SINR,
- RSRQ,
- ARFCN,
- band,
- subcarrier information.

This is strong evidence of cellular measurement literacy and not merely use of a generic speed-test application.

## 5G Processing Suite

The `5G/Processing` directory contains `fg` analysis tools.

### `fg1`: Unified Multi-Source Viewer

`fg1` combines:

- device JSON logs,
- latency measurements,
- iperf3 throughput.

The documentation explicitly notes that the input sources originally use mixed Unix and EST timestamps.

The tool is designed to synchronize them onto a common timeline for viewing.

### `fg2`: Throughput Versus Radio Quality

`fg2` aggregates multiple runs.

It relates throughput to radio metrics such as:

- RSRP,
- SINR,
- RSSI.

Outputs include:

- box plots,
- CDFs,
- scatter plots,
- correlation statistics.

### `fg3`: Latency Versus Radio Quality

`fg3` applies the same multi-run analytical idea to latency.

This provides a direct way to investigate whether radio-state degradation corresponds to latency degradation.

### `fg4`: Timestamp Normalization

`fg4` converts raw JSON log timestamps from Unix time into EST.

This preprocessing stage exists specifically to reduce ambiguity before multi-run correlation.

### `fg5`: Mobility Impact

`fg5` investigates throughput during mobility.

The documented analysis includes:

- handovers,
- AP switches,
- walking-route transitions,
- speed estimation from log transitions,
- throughput degradation per mobility event.

That is one of the most distinctive research capabilities in the repository.

It moves analysis from static radio-quality correlation toward event-oriented mobility analysis.

## Latest SNR Extraction Work

The latest meaningful commit adds a browser-based SNR log extractor.

Its commit description states that it supports:

- log-file upload,
- MAC-address input,
- extraction of timestamps,
- extraction of `Last_Rx_SNR` values,
- user-facing processing.

This continues the pattern of making raw network logs directly usable through lightweight browser utilities.

## Browser-Based Research Utilities

A large fraction of this repository is implemented as standalone HTML tools.

This design has practical research advantages:

- no application server is needed,
- a tool can be opened locally,
- raw logs can be processed interactively,
- plots can be inspected immediately,
- utilities can be iterated independently.

The HTML tools use JavaScript for parsing, transformation, plotting, and export behavior.

## Statistical Analysis Capability

Across the documented tools, the project uses or generates:

- averages,
- percentiles,
- CDFs,
- histograms,
- box plots,
- scatter plots,
- correlations,
- segmented statistics,
- outlier handling,
- packet-loss markers,
- jitter/retransmission summaries,
- multiple-run aggregation.

This is more than visualization.

It is an analytical pipeline from raw experimental logs to publication-ready evidence.

## Time-Series Engineering

Time alignment is a recurring engineering concern throughout the repository.

Evidence includes:

- Unix-to-EST conversion,
- mixed-source synchronization,
- throughput/latency alignment,
- 20 Hz to 1 Hz downsampling,
- fixed-duration clipping,
- time-range segmentation,
- event overlays.

This is a core skill demonstrated by the project because radio, latency, throughput, and mobility sources originate from separate logging systems.

## Experimental Verification and Reproducibility

The repository contains multiple forms of positive reproducibility evidence.

### Repeated Runs

Several analysis tools explicitly accept multiple runs.

### Controlled Experiment Configuration

The root README records:

- access-point count,
- transmit-power adjustment,
- RF placement,
- uplink/downlink direction,
- noise-floor collection.

### Stable Processing Pipeline

Preprocessors convert older or heterogeneous formats into the formats expected by downstream tools.

### Publication-Oriented Outputs

LaTeX table generation makes the statistics transferable into research manuscripts or reports.

## Scale and Complexity

The repository contains many independent processing utilities and multiple experimental modes.

The complexity comes from crossing several dimensions at once:

- physical motion,
- two wireless technology families,
- different access-point topologies,
- radio metrics,
- latency,
- throughput,
- packet loss,
- mixed timestamp domains,
- multiple runs.

The codebase is therefore best characterized as a research analysis toolbox rather than a single application.

## Skills Demonstrated

### Wireless Networking

- Wi-Fi measurement,
- Wi-Fi roaming analysis,
- 5G NSA measurement,
- cellular modem operation,
- serving-cell interpretation,
- radio-quality analysis.

### Mobile Robotics Experimentation

- Husky network access,
- physical robot operation,
- mobility-path reasoning,
- handover-event analysis.

### Linux Networking

- SSH,
- interface-specific ping,
- iperf3,
- serial modem access,
- ModemManager control.

### Data Processing

- log parsing,
- timestamp normalization,
- downsampling,
- deduplication,
- packet-loss reconstruction,
- multi-stream synchronization.

### Statistical Analysis

- multi-run aggregation,
- percentile analysis,
- CDF analysis,
- histogram/boxplot/scatter generation,
- correlation statistics,
- segmented analysis.

### Research Reporting

- LaTeX-ready table generation,
- browser visualizations,
- reusable preprocessing tools.

## Historical Portfolio Significance

This repository shows a distinct shift from generating network traffic to systematically **interrogating the experiment**.

Earlier FTP and networking repositories focus heavily on creating workloads.

Here, the tooling increasingly asks:

- what happened during motion,
- when did association change,
- what was the radio condition,
- how did throughput or latency respond,
- how can heterogeneous logs be aligned,
- how can the result be summarized across runs.

That transition is central to the portfolio's research-engineering progression.

## Overall Project Narrative

`Mobile-Robots-Telecommunications` is a mobile-network research toolbox built around the practical difficulties of measuring Wi-Fi and 5G performance on a moving robot.

It combines experiment operation, modem integration, raw-log cleanup, time normalization, statistical aggregation, mobility-event reasoning, and publication-oriented visualization.

The repository demonstrates that the engineering challenge is not only collecting throughput and latency.

It is building enough instrumentation and processing around those measurements to make cross-run and cross-layer conclusions defensible.

# Project Tags

- `wireless-networking`
- `mobile-robotics`
- `husky-robot`
- `wifi`
- `wifi-roaming`
- `multi-ap`
- `5g`
- `5g-nsa`
- `n78`
- `quectel`
- `qconnectmanager`
- `linux-networking`
- `ssh`
- `iperf3`
- `at-commands`
- `minicom`
- `rsrp`
- `rsrq`
- `rssi`
- `sinr`
- `snr`
- `noise-floor`
- `throughput-analysis`
- `latency-analysis`
- `packet-loss-analysis`
- `retransmission-analysis`
- `handover-analysis`
- `mobility-analysis`
- `timestamp-normalization`
- `time-series-alignment`
- `downsampling`
- `cdf-analysis`
- `correlation-analysis`
- `statistical-analysis`
- `latex-table-generation`
- `browser-analysis-tools`
- `html`
- `javascript`
- `research-collaboration`
- `rogers-experiment`
- `uwaterloo`
