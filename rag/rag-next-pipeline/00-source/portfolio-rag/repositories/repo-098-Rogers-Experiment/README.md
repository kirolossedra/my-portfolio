# Rogers-Experiment

## Repository Identity

- **Repository:** `kirolossedra/Rogers-Experiment`
- **Corpus index:** 098
- **Repository start date:** 2025-11-03
- **Last meaningful update date:** 2025-11-30
- **Latest meaningful commit:** `dc9174ba68e53f15f4b221268cc565b068d19ad0`
- **Primary repository language:** HTML
- **Project form:** wireless networking research and experiment-analysis workspace
- **Collaboration classification:** `individual-project`

## Evidence Basis

This repository contains a broad set of experiment artifacts rather than one application.

The source tree includes:

- Aruba Wi-Fi log-processing tools;
- browser-based latency/throughput/SNR analyzers;
- Windows measurement scripts;
- Linux measurement scripts;
- 5G modem setup and telemetry scripts;
- Husky robot experiment notes;
- UDP broadcast receiver tooling;
- ns-3 broadcast simulations;
- packaged experiment artifacts.

The latest commit is attributed to the repository owner.

Its change adds a concrete experiment task concerning timestamp unification, so 2025-11-30 is retained as the last meaningful update date.

The root README records completed experimental improvements as well as remaining tasks.

Those records are useful evidence of iterative experimental design.

Binary archives and packaged executables are treated as experiment/distribution artifacts.

Engineering claims are anchored to inspectable source files.

Retained environment notes are used only as evidence of experiment-environment documentation; the corpus prose keeps the focus on engineering-relevant configuration.

## What This Project Is

`Rogers-Experiment` is a multi-part research workspace for measuring and analyzing wireless-network behavior around a mobile-robot experiment environment.

The retained work spans Wi-Fi and cellular measurement.

A major focus is synchronization:

- Aruba access-point logs;
- ping latency;
- iperf3 throughput;
- station presence;
- BSSID;
- SNR;
- noise-floor information;
- cellular modem radio metrics.

The repository also carries a separate broadcast-networking research track with:

- real UDP receiver tooling;
- desktop monitoring;
- ns-3 Wi-Fi broadcast simulations.

The source therefore represents both physical-experiment support and simulation-oriented network research.

## Research Context

The root README documents a Husky robot setup.

It records practical steps for:

- placing a host on the robot's Ethernet subnet;
- checking connectivity with ping;
- connecting to the robot through SSH;
- using the joystick controller.

The experiment task list explicitly references:

- two-access-point tests;
- single-access-point tests;
- uplink;
- downlink;
- noise-floor measurement;
- 5G tests.

The retained improvement list shows deliberate iteration in the experiment design.

## Experiment Improvements Recorded in the Repository

Completed improvements in the root README include:

- unified timestamps across files, logs, latency, and iperf workflows;
- use of two Linux laptops for a lighter measurement system;
- generating a single main log per experiment rather than separate logs per AP;
- moving RF equipment onto a plastic shelf instead of directly on concrete;
- reducing transmit power to make roaming occur in the two-AP experiment;
- preparing uplink and downlink scripts;
- including retransmission information;
- adding noise-floor logging commands.

The latest commit adds an additional task to move from Unix-based timestamp handling toward fully unified actual timestamps.

These records show that experiment architecture itself was being refined, not only post-processing code.

## Repository Scope

The retained workspace covers several major subsystems:

1. Wi-Fi/Aruba acquisition and processing;
2. endpoint latency and throughput capture;
3. browser-based synchronized visualization;
4. repeated-run statistical aggregation;
5. 5G modem setup and radio telemetry;
6. mobile-robot experiment setup;
7. UDP broadcast receiver tooling;
8. ns-3 broadcast simulation.

## High-Level System Shape

A central research-data path is:

```text
Aruba AP logs ───────────────┐
                             │
ping latency logs ───────────┼─→ timestamp alignment
                             │        ↓
iperf3 throughput logs ──────┤   slicing / parsing
                             │        ↓
station SNR/presence ────────┘   synchronized plots
                                      ↓
                              per-run / aggregate analysis
```

A cellular path is:

```text
Quectel modem
     ↓ serial AT commands
AT+QENG="servingcell"
     ↓
LTE + NR5G-NSA fields
     ↓
structured Python dictionaries
     ↓
timestamped JSON log
```

A broadcast-research path is:

```text
real UDP broadcast traffic
      ↓
threaded Python receiver + GUI
      ↓
packet / byte / Mbps statistics

and

ns-3 Wi-Fi topology
      ↓
custom UDP broadcast application
      ↓
MAC-layer TX trace + PCAP
      ↓
broadcast throughput statistic
```

## Technical Stack

### HTML, CSS, and JavaScript

A large part of the analysis layer is implemented as self-contained browser tools.

These files combine:

- interface layout;
- drag-and-drop file handling;
- local parsing;
- analysis logic;
- chart rendering.

This allows researchers to open local experiment files directly in a self-contained browser analysis tool.

### Chart.js

The browser analyzers use Chart.js for interactive plotting.

The tools construct:

- multiple datasets;
- multiple y-axes;
- categorical presence traces;
- throughput curves;
- latency curves;
- SNR curves;
- tooltips;
- exported PNG images.

### Python

Python is used for:

- network measurement acquisition;
- Linux/Windows helper scripts;
- modem serial communication;
- JSON logging;
- UDP broadcast reception;
- desktop GUI behavior;
- experiment automation.

### Shell

Shell scripts are present in the cellular-modem workflow and experiment launch environment.

### C++ / ns-3

The files named with `.pp` in the ns-3 subtree contain C++ ns-3 source.

The inspected broadcast simulation uses:

- ns-3 Wi-Fi;
- mobility;
- Internet stack;
- UDP applications;
- packet tracing;
- PCAP.

The actual C++ syntax is the authoritative language evidence despite the unusual `.pp` filename extension.

## Aruba Wi-Fi Experiment Processing

### Two-AP Log Context

`Aruba Processing/README.md` states that the main Aruba logs are collected from two access points.

The analysis workflow slices the large Aruba log using time windows derived from:

- iperf3 logs;
- latency logs.

This is an important experiment-design choice.

Instead of comparing unrelated samples, the tools align radio-side records to the same time period as endpoint performance measurements.

### Log Slicing

The repository contains multiple specialized browser tools for Aruba data.

Time ranges can be:

- entered manually;
- derived from uploaded iperf3 files;
- derived from uploaded ping files.

The browser code parses timestamps and converts those ranges into analysis slices.

### Synchronized Throughput Analysis

`pingiperf3.html` and related tools parse iperf3 output.

The parser extracts:

- timestamps;
- Mbps values.

The interface supports uploaded logs and local time slices.

A smoothing window can be applied before plotting.

### Synchronized Latency Analysis

Ping files are parsed for:

- date;
- timestamp;
- round-trip latency in milliseconds.

The same slice mechanism allows latency to be placed on a time-aligned experiment window.

### Comprehensive Multi-Mode Analyzer

`Aruba Processing/Comprehensive.html` combines several previously separate views.

The mode selector provides:

- throughput;
- latency;
- presence/SNR;
- custom all-data mode.

The interface accepts:

- a target IP;
- a target MAC when relevant;
- log files;
- slice files;
- manual slice boundaries;
- smoothing-window configuration.

### Presence Analysis

The comprehensive analyzer derives whether a target address or station is present in a given Aruba log observation.

That presence signal is plotted as a categorical trace.

For multiple AP log files, the interface assigns AP labels and renders separate presence datasets.

### SNR Analysis

For MAC-focused analysis the browser parser retains station-side radio information including:

- BSSID;
- last ACK SNR;
- last receive SNR.

The plot can display:

- AP presence;
- ACK SNR;
- receive SNR.

This enables visual correlation between association state and signal quality.

### Multi-Metric Custom Mode

The `all` mode supports per-slice checkboxes for:

- presence;
- throughput;
- latency;
- SNR.

This turns the browser file processor into a flexible local analysis dashboard rather than a one-purpose chart.

### Multiple Axes

When multiple metrics are selected, the chart configuration creates distinct axes for:

- connection presence;
- throughput;
- latency;
- SNR.

That preserves metric units while keeping the traces synchronized.

### Plot Export

Generated plots can be:

- exported as PNG;
- copied to the clipboard.

The export functions operate directly on rendered canvas output.

## Repeated-Run Statistical Analysis

The single-AP analysis subtree contains tools that aggregate multiple experiment runs.

The inspected outlier-analysis file demonstrates several important steps.

### Fixed Experiment Window

Throughput and latency processing can enforce a strict first-100-seconds analysis window.

This makes different runs comparable on a shared duration.

### Cross-Log Time Alignment

Wi-Fi SNR observations are filtered to the start/end range of each throughput run.

Latency data is paired with throughput runs and aligned to their effective sample lengths.

### Trim and Pad Logic

The analysis records differing run lengths.

It then trims or pads latency arrays to match the target run length.

A debug table reports:

- throughput filename;
- latency filename;
- throughput point count;
- latency point count;
- durations;
- final aligned length.

This makes synchronization behavior inspectable.

### Outlier Handling

One retained analysis path replaces latency observations above its configured high-latency threshold with a neighboring valid sample.

The corpus treats this as the behavior of that specific analysis file rather than a universal project-wide statistical rule.

### Mean and Standard Deviation

Across repeated runs, the browser code computes pointwise:

- RX SNR mean;
- RX SNR standard deviation;
- throughput mean;
- throughput standard deviation;
- latency mean;
- latency standard deviation.

This is direct evidence of multi-run aggregation rather than only single-run plotting.

### Sample-Rate-Aware Length Capping

The code estimates an average sample rate and caps the aggregated series to a length corresponding to the fixed analysis duration.

This is another explicit attempt to make multiple experimental runs comparable.

## 5G Modem Experiment Tooling

### Quectel Modem Setup

The `5G Modem/README.md` documents Linux-side setup for a Quectel cellular modem.

The workflow includes:

- connecting the modem over USB;
- stopping Linux ModemManager when direct modem access is required;
- building and running QConnectManager;
- identifying the WWAN network interface;
- testing connectivity;
- using minicom for AT commands.

### QConnectManager

The documentation records QConnectManager use for bringing up the modem's network interface.

The sample flow identifies QMI-mode behavior and a WWAN interface.

The repository therefore preserves practical cellular-modem integration work in addition to post-processing.

### AT Command Interaction

The documented interactive path uses:

```text
AT+QENG="servingcell"
```

to retrieve serving-cell information.

The README explains LTE and NR5G-NSA fields.

### Cellular Radio Metrics

Documented LTE fields include:

- cell identifier;
- PCI;
- EARFCN;
- frequency band;
- uplink bandwidth;
- downlink bandwidth;
- RSRP;
- RSRQ;
- RSSI;
- SINR;
- CQI;
- transmit power.

Documented NR5G-NSA fields include:

- PCI;
- RSRP;
- SINR;
- RSRQ;
- ARFCN;
- band;
- downlink bandwidth;
- subcarrier-spacing field.

### Python Modem Wrapper

`5G Modem/fg.py` opens a serial connection to the modem.

It:

- sends `AT`;
- consumes serial output;
- sends serving-cell queries;
- collects returned lines;
- parses LTE and NR5G-NSA responses with regular expressions.

The parsed results are converted into dictionaries.

### Periodic Telemetry Logging

The modem script runs continuously.

Each iteration creates a record with:

- Unix timestamp;
- parsed LTE fields when available;
- parsed 5G fields when available.

Records are appended to a JSON array and written to a timestamped file.

The polling interval is one second.

This provides a radio-metric time series that can be correlated with other experiment logs.

## Linux and Windows Measurement Support

The repository retains platform-specific acquisition scripts.

The Linux directory contains separate ping and directional measurement helpers.

The Windows directory contains:

- ping capture;
- iperf capture;
- count-based processing;
- IP-based processing;
- slicing scripts;
- switching-related tooling.

This indicates explicit adaptation of the experiment workflow to more than one host environment.

## Mobile Robot Experiment Setup

The root documentation connects the wireless tooling to a Husky mobile robot.

It preserves:

- local Ethernet addressing context;
- connectivity verification;
- SSH access;
- joystick-controller usage.

The robot context is directly documented as part of the experimental setup.

## RF Experimental Design

The improvement list records physical and configuration choices made to produce more useful radio behavior.

Examples include:

- moving equipment from concrete to a plastic shelf;
- reducing transmit power so roaming could occur;
- adding noise-floor measurement;
- distinguishing uplink and downlink;
- retaining retransmission information.

This is systems experimentation, because the measured outcome depends on physical placement and radio configuration as well as software.

## Broadcast Research Track

The repository also contains a `Broadcast Paper` subtree.

This is a separate networking-research thread inside the same workspace.

### Threaded UDP Broadcast Receiver

`receiverGUI.py` provides a Tkinter desktop application for receiving UDP broadcast traffic.

The GUI exposes:

- port configuration;
- thread count;
- DHCP/static-IP mode selection;
- static IP, subnet, and gateway fields;
- start/stop controls;
- activity logs;
- statistics display.

### Socket Configuration

Each receiver thread creates a UDP socket with:

- address reuse;
- broadcast capability;
- a larger receive buffer;
- timeout behavior.

The socket binds to the selected port and receives broadcast datagrams.

### Multi-Threaded Reception

The number of listener threads is configurable.

Python `threading.Thread` is used to start daemon receiver workers.

A shared stop event coordinates shutdown.

### Thread-Safe Statistics

The receiver uses:

- a shared `deque`;
- a lock;
- a queue for log messages.

This separates background receive activity from GUI updates.

### Burst Measurement

The receiver groups packets into bursts separated by idle timeout.

For a completed burst it calculates:

- packet count;
- total bytes;
- MiB;
- elapsed time;
- Mbps.

The statistics are then surfaced in the desktop UI.

### Packaged Executable

The hybrid-approach directory includes a packaged GUI executable.

That is evidence that the receiver tool was packaged for direct execution, while the Python source remains the basis for implementation analysis.

## ns-3 Broadcast Simulation

The broadcast simulation is implemented with ns-3 C++ APIs.

### Wi-Fi Topology

The inspected model creates:

- one AP node;
- a configurable number of station nodes;
- IEEE 802.11g Wi-Fi devices;
- a fixed-position grid;
- an IPv4 network.

### Custom UDP Broadcast Application

The source defines a custom ns-3 `Application` subclass.

It:

- creates a UDP socket;
- enables broadcast;
- connects to the broadcast destination;
- schedules transmissions;
- sends a configured message;
- repeats until a maximum packet count.

### Receiver Applications

UDP server applications are installed on the station nodes.

This creates one-to-many reception behavior for the AP broadcast stream.

### MAC-Layer TX Trace

A physical-layer transmit trace callback copies packets and inspects the Wi-Fi MAC header.

It counts transmitted bytes when the destination MAC is the broadcast address.

### PCAP Output

The simulation enables PCAP capture for the Wi-Fi devices.

This provides packet-level output beyond the final scalar statistic.

### Broadcast Throughput

At the end of the simulation, the code computes average transmitted broadcast throughput from:

- counted broadcast bytes;
- transmission duration.

This is direct simulation instrumentation.

## Major Engineering Work

### Experiment Data Synchronization

A central engineering problem is combining logs from systems with different formats and sampling behavior.

The repository addresses that with:

- timestamp parsing;
- slice extraction;
- alignment windows;
- trim/pad logic;
- debug tables.

### Browser-Based Research Analysis

Multiple analyzers move parsing and visualization into local HTML/JavaScript tools.

This lowers iteration friction during data exploration because experiment files can be dropped directly into a browser.

### Multi-Run Statistical Aggregation

The project goes beyond visualizing individual runs.

It contains pointwise repeated-run mean and standard-deviation calculations across radio and performance metrics.

### Cellular Telemetry Acquisition

The modem tool converts raw serial AT responses into structured, timestamped radio telemetry.

### Physical-System Experiment Iteration

The README documents adjustments to RF placement, transmit power, host topology, and log generation.

### Real and Simulated Broadcast Networking

The repository retains both a real threaded UDP receiver and an ns-3 broadcast model.

That creates a useful pairing between socket-level experimentation and network simulation.

## Verification and Experimental Reproducibility

### Debug Alignment Tables

The repeated-run analyzer exposes synchronization details instead of hiding them.

This makes file pairing, durations, and aligned sample counts reviewable.

### Persistent Logs

Measurement scripts and modem tooling produce durable timestamped logs.

### PCAP

The ns-3 model emits PCAP traces.

### Explicit Experiment Configuration

The root documentation records practical setup conditions and completed experiment changes.

### Multi-Run Statistics

Mean and standard deviation across repeated runs provide quantitative aggregation of experimental variability.

These mechanisms are direct reproducibility/verification evidence inside the repository.

## Engineering Practices

### Separation of Acquisition and Analysis

Platform-specific scripts acquire data.

Browser tools analyze and visualize it.

The modem wrapper separately acquires cellular radio metrics.

This reduces coupling between experiment capture and later interpretation.

### Timestamp as Integration Contract

Timestamp alignment is the common mechanism connecting otherwise heterogeneous data streams.

The latest repository task continues this theme by calling for stronger timestamp unification.

### Iterative Experiment Documentation

Completed and pending tasks are maintained alongside code.

The records show changes to both software and physical setup.

### Evidence-Preserving Diagnostics

The analyzers retain debug tables, live logs, exported images, JSON, and PCAP artifacts.

## Scale and Complexity

This is one of the broader networking-research workspaces encountered in the processed corpus so far.

Its complexity spans:

- physical wireless experiments;
- mobile robot connectivity;
- Wi-Fi roaming;
- access-point telemetry;
- ping;
- iperf3;
- radio metrics;
- browser analysis;
- repeated-run statistics;
- cellular modem control;
- serial parsing;
- Linux and Windows tooling;
- UDP broadcast sockets;
- desktop concurrency;
- ns-3 simulation.

The repository contains multiple evolutionary tools rather than a single centralized codebase.

## Skills Demonstrated

### Wireless Networking Research

- Wi-Fi experiment design
- multi-AP experimentation
- roaming analysis
- BSSID/presence interpretation
- SNR
- RSSI
- noise-floor measurement context
- retransmission-aware experiment planning
- uplink/downlink separation

### Network Performance Measurement

- latency
- throughput
- ping
- iperf3
- fixed experiment windows
- repeated-run aggregation
- timestamp alignment

### Statistical Analysis

- mean
- standard deviation
- outlier handling
- run alignment
- sample-length normalization
- multi-run comparison

### Frontend / Analysis Tooling

- HTML
- CSS
- JavaScript
- Chart.js
- drag-and-drop files
- local browser parsing
- multi-axis plotting
- canvas export
- clipboard image copy

### Cellular Networking

- Quectel modem integration
- QConnectManager
- QMI/WWAN workflow
- AT commands
- LTE serving-cell telemetry
- NR5G-NSA serving-cell telemetry
- RSRP
- RSRQ
- SINR
- ARFCN
- cellular band information
- PySerial-style serial interaction
- JSON telemetry logging

### Systems and Experiment Tooling

- Linux
- Windows
- shell scripting
- subprocess-oriented measurement workflows
- SSH-connected robot setup
- Husky mobile robot experiment context

### Network Programming

- UDP broadcast
- Python sockets
- multi-threaded receivers
- thread synchronization
- queue-based GUI logging
- burst throughput measurement

### Desktop Tooling

- Tkinter
- configurable receiver GUI
- statistics table
- packaged executable

### Network Simulation

- C++
- ns-3
- 802.11g
- custom ns-3 application
- UDP broadcast
- MAC-header inspection
- trace callbacks
- PCAP
- simulated throughput measurement

## Capability Developed

This repository shows a marked expansion from individual research scripts into an experiment ecosystem.

Repository 097 already established focused Wi-Fi log parsing and endpoint capture.

Repository 098 broadens that into:

- synchronized multi-source analysis;
- browser-driven exploratory tooling;
- repeated-run statistics;
- 5G modem integration;
- physical experiment iteration;
- robot connectivity;
- real UDP broadcast tooling;
- ns-3 broadcast simulation.

The development pattern is increasingly systems-oriented: measurement validity depends on how radio configuration, hosts, clocks, capture tools, and analysis code fit together.

## Portfolio Evolution Context

The processed corpus previously contained ns-3 networking work and SDR experimentation.

`Rogers-Experiment` adds a stronger physical wireless-measurement workflow around those capabilities.

It also introduces direct processed-corpus evidence of Quectel cellular-modem telemetry and NR5G-NSA serving-cell parsing.

Compared with repository 097, the Wi-Fi analysis grows from separate scripts into interactive synchronized browser analyzers and repeated-run statistical aggregation.

## Historical Significance

Within the processed corpus so far, this is the earliest observed repository with direct Quectel 5G modem experiment tooling that parses `AT+QENG="servingcell"` into structured LTE and NR5G-NSA telemetry.

It is also the earliest observed processed repository combining:

- physical multi-AP Wi-Fi experimentation;
- cellular modem telemetry;
- mobile-robot setup;
- browser-based timestamp-synchronized analysis;
- repeated-run mean/standard-deviation aggregation;
- real UDP broadcast reception;
- ns-3 broadcast simulation.

The significance comes from system integration across experimental layers rather than any one isolated algorithm.

## Overall Repository Narrative

`Rogers-Experiment` is a broad wireless-networking research workspace centered on measurement quality, synchronization, and experiment iteration.

It documents a Husky-based physical setup, multi-AP Wi-Fi tests, uplink/downlink and noise-floor concerns, and RF configuration changes made to provoke useful roaming behavior.

Its browser tools align Aruba logs with ping and iperf3 windows, visualize presence, throughput, latency, and SNR, and aggregate repeated runs with mean and standard deviation.

Its cellular path configures a Quectel modem and captures structured LTE/NR5G-NSA serving-cell telemetry through AT commands.

Its broadcast-research path contains both a threaded Tkinter UDP receiver and an ns-3 Wi-Fi broadcast model.

Taken together, the repository demonstrates increasingly integrated experimental systems engineering by constructing acquisition, synchronization, inspection, simulation, and analysis machinery around wireless research.

# Project Tags

`individual-project`, `research-experiment`, `networking-research`, `wireless-networking`, `experiment-automation`, `experimental-systems-engineering`, `wifi`, `multi-ap-experiment`, `roaming-analysis`, `aruba`, `aruba-log-analysis`, `bssid`, `station-presence`, `rssi`, `snr`, `noise-floor`, `uplink`, `downlink`, `retransmissions`, `timestamp-alignment`, `timestamp-unification`, `log-slicing`, `experiment-window-alignment`, `ping`, `iperf3`, `latency`, `throughput`, `jitter`, `html`, `css`, `javascript`, `chartjs`, `browser-based-log-analyzer`, `drag-and-drop-files`, `multi-axis-plotting`, `png-export`, `clipboard-image-copy`, `multi-run-analysis`, `statistical-analysis`, `mean`, `standard-deviation`, `outlier-handling`, `sample-alignment`, `quectel-modem`, `qconnectmanager`, `cellular-modem`, `at-commands`, `at-command-telemetry`, `lte`, `5g`, `nr5g-nsa`, `rsrp`, `rsrq`, `sinr`, `arfcn`, `pyserial`, `serial-communication`, `json-logging`, `linux`, `windows`, `shell-scripting`, `husky-robot`, `ssh`, `rf-experiment`, `udp`, `udp-broadcast`, `socket-programming`, `tkinter`, `desktop-analysis-tool`, `multithreading`, `thread-safe-queue`, `burst-throughput-measurement`, `packaged-executable`, `c-plus-plus`, `ns-3`, `802-11g`, `custom-ns3-application`, `wifi-broadcast-simulation`, `mac-header-inspection`, `pcap`, `simulation`, `experimental-reproducibility`, `earliest-observed-quectel-5g-modem-telemetry`, `earliest-observed-nr5g-nsa-serving-cell-parser`, `earliest-observed-integrated-wifi-cellular-robot-experiment-workspace`
