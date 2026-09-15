# Indoor-Journal-

## Repository Identity

- Repository: 128 / 138
- Name: `Indoor-Journal-`
- Start date: 2025-12-13
- Latest meaningful update: 2026-03-04
- Latest meaningful commit: `59ae627d8852c780cbccd276fedab911a079e39f`
- Primary repository language metadata: Python
- Technical field: indoor wireless experimentation, mobility, 5G/Wi-Fi measurement and processing
- Domain: mobile-robot telecommunications research
- Context: evolving indoor experimental journal and research-tool repository
- Collaboration type: `research-collaboration`

## What This Project Is

`Indoor-Journal-` is an evolving research workspace for designing, running, debugging, and processing indoor mobile-network experiments.

It combines:

- experimental plans,
- field notes,
- data-collection scripts,
- ROS-related motion logging,
- Wi-Fi measurements,
- 5G modem measurements,
- throughput and latency tooling,
- repeatability analysis,
- link-quality analysis,
- traffic generation,
- throttling,
- thermal/sustained-load infrastructure.

The term `Journal` is accurate.

The repository does not only preserve polished final tools.

It also records operational discoveries and protocol changes while experiments are being developed.

That makes it valuable evidence for research engineering because it exposes the feedback loop between:

```text
experiment design
      ↓
data collection
      ↓
failure / observation
      ↓
tool or protocol correction
      ↓
next experiment
```

## Research Context

The experiment design compares wireless technologies while a robot follows a route containing different propagation conditions.

The data-collection notes describe:

- line-of-sight portions,
- non-line-of-sight portions,
- Wi-Fi handover behavior,
- 5G conditions,
- motion event timing.

The repository therefore links network measurements to a physical trajectory rather than treating samples as context-free points.

## Experimental Matrix

The data-collection plan defines repeated experiments across a broad matrix.

### 5G n78

The plan includes:

- uplink,
- downlink,
- bidirectional traffic,

at:

- morning,
- noon,
- evening.

### 5G mmWave

The same directional/time-of-day structure is described for mmWave experiments.

### Wi-Fi 6

Wi-Fi 6 experiments are structured across:

- 80 MHz,
- 40 MHz,
- uplink,
- downlink,
- bidirectional traffic,
- morning/noon/evening windows.

### Wi-Fi 6E

Wi-Fi 6E experiments include:

- 80 MHz,
- 160 MHz,
- uplink,
- downlink,
- bidirectional traffic,
- time-of-day repetition.

### Wi-Fi 5

Wi-Fi 5 experiments include:

- 80 MHz,
- 40 MHz,
- traffic-direction variants,
- time-of-day variants.

### Repeat Count

The plan states that each experiment is intended to be run ten times.

This creates a substantial repeatability requirement and explains why the repository contains dedicated repeatability-statistics tooling.

## Mobility-Aware Experiment Procedure

The data-collection procedure emphasizes running several data sources at the same time.

The plan calls for:

- throughput collection during each test,
- latency measurement,
- motion start/stop markers,
- AirRecorder or cellular logs,
- synchronized timestamps.

Motion events can be tied to ROS2 logging.

That relationship enables later analysis to ask how network behavior changes specifically during motion.

## TCP Latency Measurement

The root journal records a TCP SYN measurement command using `hping3`.

The command is run with:

- TCP SYN packets,
- port 80,
- high-frequency interval,
- timestamping through `ts`,
- output logging.

The notes describe measuring in both directions between server and client.

This provides an additional latency-observation method beyond ordinary ICMP ping.

## Experiment-Day Feedback Loop

The data-collection journal records issues discovered during actual experiment days.

Examples include:

- a motion-logging script failing and being fixed,
- a ping command initially not writing its output to file,
- observing stable route completion times,
- selecting a longer route to create a more informative experiment,
- observing anchoring in deep NLOS,
- observing throughput changes around handover.

These entries are useful evidence of iterative experiment debugging.

They show that the protocol was revised from observed behavior rather than assumed correct before collection.

## Repository Architecture

The repository is divided into research responsibilities.

```text
Data Collection/
    5G/
    Wi-Fi/
    ROS monitor

Logs Processing/
    5G analytics
    throughput processing
    latency processing

Thermal Platform/
    sustained speed-test server

Throttling/
    rate control

System Setup/
Dynamic MultiConnectivity/
```

Some subdirectories are planning/organization markers.

The implemented code is concentrated in data collection, processing, load generation, and rate-control tools.

## 5G Data Collection and Modem Operations

The `Data Collection/5G` material documents the Quectel modem workflow in detail.

### Linux Setup

The documented environment uses Linux/Ubuntu.

The modem is connected over USB, with emphasis on the correct USB interface.

### ModemManager Coordination

The setup temporarily stops Linux `ModemManager` when direct control of the Quectel interface is required.

### QConnectManager Build and Install

The project documents:

- cloning the UWaterloo QConnectManager repository,
- compiling it,
- installing its kernel module,
- running `quectel-CM`.

The QConnectManager source itself is external research infrastructure.

The owner-attributable evidence is the setup, troubleshooting, automation, and use in the experimental platform.

### Kernel-Module Lifecycle

The documentation explicitly recognizes that Linux kernel updates can invalidate previously built modules.

The recovery procedure includes:

- checking the running kernel,
- rebuilding,
- reinstalling,
- validating with `modinfo`,
- rerunning the startup flow.

This is concrete systems-operation experience around experimental networking hardware.

### Automated Startup Script

The documented `runtest` workflow automates modem startup.

Its shell logic:

1. stops ModemManager,
2. removes/reloads QMI-related kernel modules,
3. waits between transitions,
4. runs QConnectManager with IPv4 and IPv6.

The script is described as a practical workaround for obtaining stable modem operation and throughput.

## Cellular Radio Monitoring

The repository documents continuous monitoring of radio metrics such as:

- SINR,
- RSRP,
- RSRQ.

It also uses manual AT-command inspection through `minicom`.

The serving-cell output is interpreted for both LTE and NR legs.

This provides cross-layer context around performance measurements.

## Wi-Fi Data Collection

The Wi-Fi directory contains utilities including:

- `AppleSNRMonitor.py`,
- `Wi-FiMetrics.bash`,
- `dhcp_takeover.bash`,
- `rssi.sh`.

The latest commits add Wi-Fi metrics and DHCP-related operating scripts.

These tools show an effort to pull signal/network state from the client/AP environment rather than relying only on throughput.

## ROS Motion Monitoring

`ROSMontior.py` is part of the data-collection layer.

The broader procedure uses robot motion start/stop times so that logs can be segmented around physical movement.

This creates the event boundaries used by downstream repeatability and link-quality analysis.

## 5G Log Processing

The `Logs Processing/5G` directory contains several substantial Python GUI tools.

These tools move the project from one-off scripts toward reusable analysis applications.

## Motion Repeatability Statistics

`RepeatabilityStatistics.py` is a PySide6 GUI for motion-duration repeatability.

### Duration Extraction

The parser searches for logged motion-event durations.

Durations are converted to numeric seconds.

### Filtering

A configurable minimum-duration threshold can be applied.

The checked-in UI defaults to retaining runs longer than 50 seconds.

### Forward and Backward Separation

After filtering, the tool interprets alternating runs as:

- forward,
- backward.

This creates direction-specific repeatability groups.

### Cycle Pairing

Forward and backward runs can be paired.

The code derives:

- complete-cycle durations,
- backward-minus-forward differences.

### Statistical Outputs

The `Stats` dataclass contains:

- sample count,
- mean,
- standard deviation,
- coefficient of variation,
- median,
- Q1,
- Q3,
- interquartile range,
- minimum,
- maximum.

This is direct evidence of evaluating trajectory repeatability before relying on mobility-aligned network comparisons.

### GUI Workflow

The PySide6 application supports:

- drag-and-drop files,
- browse controls,
- an optional second input part,
- configurable threshold,
- results table,
- text report,
- CSV export,
- report copy.

## Link Quality and Throughput Over Normalized Motion

`linkQuality.py` is one of the most important analytical tools in the repository.

Its documented workflow is:

1. recursively scan a selected experiment root,
2. identify monitor/timing logs,
3. identify throughput logs,
4. identify link-quality JSON logs,
5. select a monitor file,
6. choose throughput or link-quality mode,
7. extract motion events,
8. filter invalid/short runs,
9. split alternating runs into forward/backward,
10. slice network samples by motion windows,
11. normalize each run to motion progress,
12. bin normalized progress,
13. compute per-bin statistics,
14. export plots and text reports.

### Motion Normalization

For each run, the tool computes a normalized progress variable:

```text
tau = (sample_time - run_start) / (run_stop - run_start)
```

This is a powerful experimental normalization.

Runs of slightly different wall-clock duration can be compared at the same **fraction of trajectory progress**.

### Progress Binning

The tool can aggregate normalized motion into percentage bins.

The documented default interpretation includes 1% progress bins.

### Bin Statistics

For each bin it computes:

- minimum,
- maximum,
- mean,
- standard deviation,
- sample count.

### Throughput Mode

The parser reads timestamped iperf output.

It recognizes throughput units including:

- bits/sec,
- Kbits/sec,
- Mbits/sec,
- Gbits/sec.

All values are normalized into Mbps for comparison.

### Link-Quality Mode

The tool reads JSON link-quality logs.

It can select radio technology/metric combinations such as:

- LTE SINR,
- LTE RSRP,
- LTE RSRQ,
- 5G SINR,
- 5G RSRP,
- 5G RSRQ.

This creates a consistent analysis path for both application performance and radio state.

## Why Normalized Motion Matters

This repository does not assume ten runs take exactly the same number of seconds.

Instead, the link-quality tool can map every run onto a common 0-to-1 motion coordinate.

That lets later analysis compare:

- the beginning of a route,
- corridor transitions,
- NLOS portions,
- handover regions,
- route completion,

across repeated trials.

This is a substantial research-data-engineering technique.

## Throughput-Only Processing

`ThroughputOnly.py` provides a dedicated throughput-analysis path.

Its existence alongside `linkQuality.py` shows that the processing suite separates specialized views instead of forcing every analysis into one monolithic application.

## General 5G Processing GUI

`Logs Processing/5G.py` is a large Python application in the processing layer.

Its repository size and commit history show iterative GUI and visualization work around cellular logs.

Related commits mention:

- improved GUI,
- time representation changes,
- physical-cell-ID handling,
- color/legend refinement.

This is evidence of repeated refinement of the research-analysis interface.

## Link-Quality Processing Evolution

The commit history records a dedicated `linkQuality.py` addition after the other processing tools.

This indicates the analysis grew from throughput/repeatability toward a more explicitly cross-layer representation combining:

- motion,
- throughput,
- cellular link metrics.

## Throughput Processing

`throughputProcessor.py` provides another reusable processing artifact for throughput logs.

Combined with the specialized GUI tools, it demonstrates a layered approach:

- raw log conversion,
- focused processing,
- statistical presentation.

## Latency Processing

The repository also contains a `latencyPerfect` artifact in the log-processing directory.

Its placement beside throughput processors indicates latency was maintained as an independent analysis stream in the indoor experimental pipeline.

## Thermal / Sustained-Load Platform

`Thermal Platform/server.py` is an HTTPS endless-download speed-test server.

Its purpose is explicitly described as a high-performance endless download server for speed testing.

### Browser Interface

The server embeds an HTML UI that reports:

- current speed,
- downloaded amount,
- duration,
- peak speed,
- average speed.

### Streaming Test

The browser fetches an `/infinite` endpoint.

It reads the response as a stream and continuously accumulates byte counts.

### Instantaneous Speed

The page periodically computes instantaneous speed from:

- bytes received since the last update,
- elapsed time since the last update.

### Average Speed

Average transfer rate is computed over the full elapsed test.

### Abort Support

The browser uses `AbortController`.

The operator can stop an active endless-download test without closing the page.

### Why the Thermal Platform Exists

An endless/sustained workload is useful for investigating:

- stable throughput,
- long-duration behavior,
- thermal effects,
- throttling behavior.

This extends the research from short discrete transfers toward sustained system stress.

## Traffic Throttling

The `Throttling` directory contains a C++ rate-control program.

This adds a different systems layer to the repository.

Rather than only measuring whatever bandwidth the environment naturally provides, the experiment platform can include explicit traffic-rate shaping behavior.

The presence of a compiled C++ rate tool alongside Python processing and Bash setup scripts reflects the multi-language nature of the research platform.

## Dynamic Multi-Connectivity Research Direction

The journal describes an environment-aware multi-connectivity idea.

The proposed policy is conceptually:

- favor 5G when Wi-Fi is roaming and 5G has strong LOS conditions,
- favor Wi-Fi when 5G enters NLOS.

The repository currently documents this as a research direction/design concept.

It should not be confused with evidence of a fully implemented production multi-connectivity controller.

The important portfolio evidence is the cross-layer reasoning: network selection is being framed as a function of environmental and mobility state rather than static preference.

## Research Tooling Stack

### Python

Python is used for:

- GUIs,
- log parsing,
- repeatability statistics,
- link-quality analysis,
- throughput processing,
- server tooling.

### PySide6

PySide6 provides desktop analysis interfaces for several tools.

### Matplotlib

Matplotlib is used to render analytical plots from processed experiment data.

### Bash

Shell scripts support:

- Wi-Fi metrics,
- DHCP/network operations,
- RSSI collection,
- modem/kernel-module workflows.

### C++

C++ appears in the throttling layer.

### Linux Networking Tools

The repository uses or documents:

- `hping3`,
- `iperf3`,
- `ssh`,
- `minicom`,
- `modprobe`,
- `rmmod`,
- `modinfo`,
- QMI network interfaces.

## Experimental Reproducibility

This repository contains unusually strong evidence of reproducibility work.

### Explicit Repetition

Experiments are structured around ten repeated runs.

### Repeatability Statistics

The project measures route-duration variability before using the runs in aligned analysis.

### Motion Event Logging

Start/stop timestamps create common segmentation boundaries.

### Cross-Source Time Alignment

Throughput and link-quality samples are mapped into motion windows.

### Normalized Trajectory Coordinate

Runs are compared by relative progress, reducing sensitivity to small motion-duration differences.

### Experiment Journal

Operational failures and protocol fixes are recorded rather than silently discarded.

This gives the project an auditable evolution path.

## Scale and Complexity

`Indoor-Journal-` crosses several engineering layers:

- physical robot motion,
- cellular modem integration,
- Wi-Fi client/AP measurement,
- Linux networking,
- shell automation,
- Python GUIs,
- statistical processing,
- sustained-load serving,
- C++ throttling.

The experiment matrix itself spans:

- multiple radio technologies,
- bandwidths,
- traffic directions,
- times of day,
- repeated trials.

The codebase exists because that matrix would be difficult to execute and interpret manually.

## Skills Demonstrated

### Research Engineering

- designing a multi-factor experiment matrix,
- logging experiment-day failures,
- changing procedures in response to observed issues,
- developing supporting tools alongside data collection.

### Wireless Systems

- Wi-Fi metrics,
- 5G radio metrics,
- LOS/NLOS reasoning,
- handover observation,
- cellular interface operation.

### Linux Systems

- kernel-module rebuild/install,
- network-interface control,
- shell scripting,
- SSH,
- modem serial access.

### Data Engineering

- recursive experiment discovery,
- heterogeneous log parsing,
- timestamp parsing,
- unit normalization,
- motion-window slicing,
- relative-time normalization.

### Statistical Analysis

- mean,
- standard deviation,
- coefficient of variation,
- quartiles,
- IQR,
- min/max,
- direction-specific comparison,
- normalized-bin statistics.

### GUI Development

- PySide6 analysis tools,
- file selection,
- drag-and-drop,
- result tables,
- export workflows.

### Performance Engineering

- sustained download workload,
- instantaneous/average speed measurement,
- rate throttling.

## Historical Portfolio Significance

This repository represents a move from isolated network measurement tools toward an integrated **experimental operating system of small utilities**.

Earlier work demonstrates traffic generation and post-processing.

Here, the portfolio connects:

- planning,
- acquisition,
- motion instrumentation,
- repeatability verification,
- cross-layer link analysis,
- sustained-load generation,
- troubleshooting.

The repository therefore preserves not just code, but how the wireless research methodology became more systematic.

## Overall Project Narrative

`Indoor-Journal-` is a research engineering journal for indoor mobile-network experiments.

Its technical value comes from the way it binds physical motion and wireless state into a reproducible data pipeline.

The project treats data acquisition, modem operation, robot timing, link-quality parsing, statistics, and sustained-load infrastructure as connected parts of one experimental system.

It also preserves real failure-and-fix episodes, which makes the repository especially useful for understanding how the experimental method evolved rather than only seeing a final polished analysis.

# Project Tags

- `research-journal`
- `research-collaboration`
- `wireless-networking`
- `mobile-robotics`
- `indoor-mobility`
- `wifi`
- `wifi-5`
- `wifi-6`
- `wifi-6e`
- `5g`
- `5g-nsa`
- `n78`
- `mmwave`
- `los-nlos`
- `handover`
- `roaming`
- `quectel`
- `qconnectmanager`
- `qmi`
- `kernel-module-operations`
- `linux-networking`
- `hping3`
- `tcp-latency`
- `iperf3`
- `ros2-logging`
- `motion-event-analysis`
- `repeatability-analysis`
- `coefficient-of-variation`
- `link-quality-analysis`
- `trajectory-normalization`
- `normalized-motion-progress`
- `time-series-binning`
- `throughput-analysis`
- `sinr`
- `rsrp`
- `rsrq`
- `python`
- `pyside6`
- `matplotlib`
- `bash`
- `cpp`
- `sustained-load-testing`
- `thermal-testing`
- `traffic-throttling`
- `experimental-reproducibility`
