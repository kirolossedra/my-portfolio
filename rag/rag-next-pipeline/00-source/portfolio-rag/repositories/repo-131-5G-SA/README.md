# Repository 131 — 5G-SA

## Repository Identity

- **Repository:** `kirolossedra/5G-SA`
- **Repository index:** 131
- **Start date:** 2026-03-20
- **Latest meaningful update:** 2026-03-27
- **Latest meaningful commit:** `d17ca9d0f261cb5f1feaa19c2878cca1a4b57371` — `Create ExtractBi.py`
- **Primary language:** Python
- **Collaboration classification:** `individual-research-project`
- **Primary scope:** private 5G Standalone testbed launch/runbook plus scenario-level performance/RF extraction

## What This Repository Is

`5G-SA` is a focused research-engineering repository for bringing up and analyzing a private 5G Standalone testbed.

The operational side documents the launch sequence for a stack built from:

- Open5GS core-network functions;
- MongoDB;
- srsRAN gNB;
- USRP B210 radio hardware;
- a Quectel RM502Q-AE modem as UE;
- n78 TDD radio configuration;
- QMI-based data-session setup.

The processing side contains a Python extractor that aligns three experiment data sources into scenario CSVs:

- iperf3 throughput;
- latency/ping measurements;
- modem JSON RF metrics.

This is not a general-purpose 5G implementation.

It is evidence of operating, validating, and instrumenting an existing open-source 5G SA stack in a controlled research testbed.

## Evidence Boundary

The repository integrates and operates external telecommunications software and hardware.

The project does not establish authorship of:

- Open5GS;
- MongoDB;
- srsRAN;
- UHD/USRP drivers;
- Quectel modem firmware;
- Quectel Connection Manager.

The owner-attributable work is the testbed procedure, configuration/diagnostic reasoning, experiment workflow, and Python data-extraction logic committed in this repository.

## Repository Shape

Observed tree:

```text
README.md
Processing/
├── README.md
├── ExtractingData.py
├── ExtractBi.py
└── NestedExtraction.py
```

`ExtractBi.py`, `NestedExtraction.py`, and `Processing/README.md` are effectively empty placeholders in the observed repository state.

The substantive processing implementation is `Processing/ExtractingData.py`.

That distinction matters: the corpus does not award implementation credit merely because a filename exists.

## Testbed Target

The runbook identifies the intended radio/core combination as:

- Quectel RM502Q-AE UE modem;
- USRP B210;
- srsRAN gNB;
- Open5GS core;
- 5G NR Standalone;
- n78;
- 20 MHz TDD.

The repository therefore sits at the intersection of:

- Linux systems work;
- cellular networking;
- SDR/radio testbeds;
- mobile-network core operation;
- performance measurement.

## Operational Bring-Up Sequence

The documented launch process is deliberately ordered.

A simplified sequence is:

```text
MongoDB
   |
   v
Open5GS network functions
   |
   v
srsRAN gNB + USRP B210
   |
   v
Quectel UE SA configuration
   |
   v
5G registration verification
   |
   v
QMI data-session establishment
   |
   v
experiment traffic + logs
```

The sequence encodes dependencies between persistence, core-network functions, radio access, UE registration, and user-plane activation.

## MongoDB Dependency

The runbook starts MongoDB before the Open5GS network functions.

MongoDB is an external dependency used by Open5GS for subscriber/core state.

The operational skill is recognizing that the core's control-plane services depend on their data store being available first.

## Open5GS Core Network

The runbook starts multiple Open5GS network functions individually.

Documented functions include:

- NRF;
- AMF;
- SMF;
- UPF;
- AUSF;
- UDM;
- UDR;
- PCF.

This shows familiarity with the modular 5G core rather than treating Open5GS as one opaque process.

## Core-Network Validation

The runbook calls for sanity-checking service state and logs after launch.

That is a practical testbed discipline:

1. start the dependency;
2. confirm the process is active;
3. inspect logs;
4. only then move to the next layer.

The repository therefore captures operational debugging sequencing, not just command memorization.

## gNB Configuration

The srsRAN gNB is launched from a specific radio configuration for the B210/n78/TDD setup.

The README records representative successful startup evidence including:

- B210 detection;
- USB 3 operation;
- configured sampling/clock information;
- physical cell ID;
- 20 MHz bandwidth;
- n78 downlink ARFCN/frequency;
- N2 connectivity toward the AMF.

This gives the runbook concrete checkpoints for distinguishing a successfully initialized radio/access network from a process that merely started.

## N2 / AMF Connectivity

The gNB output includes an N2 connection toward the AMF.

That is an important architectural checkpoint because it confirms the radio access node is connected to the 5G core control plane.

The repository therefore understands testbed launch as layered connectivity:

```text
RF hardware ready
+ gNB ready
+ N2 control-plane connectivity
+ UE registration
+ PDU session
```

rather than one binary “5G works” state.

## Quectel UE Configuration

The modem is configured through a serial AT-command session.

The runbook uses `minicom` against the modem's USB serial interface.

The documented configuration includes forcing/preparing 5G NR operation and then triggering operator selection/registration.

The repository records that the preferred mode may reset after reboot, meaning test repeatability requires reapplying the relevant modem configuration.

## Standalone Registration

The runbook verifies registration through a 5G registration AT query.

Expected successful states include registered-home or registered-roaming outcomes.

A sample run is documented as reaching AMF registration for a configured test subscriber.

The corpus intentionally does not preserve subscriber identifiers because they are not necessary to establish the skill.

## UE Context Release Interpretation

The README explicitly notes that UE-context release after successful registration can represent normal idle behavior rather than a failed registration.

This is useful troubleshooting evidence.

It shows distinction between:

- registration failure;
- successful registration followed by normal control-plane state transition.

## Data-Plane Activation

The runbook separates registration from data-session establishment.

After registration, it brings the modem's network interface up and invokes Quectel Connection Manager using QMI.

A configured DNN/APN must match the subscriber profile.

This shows understanding that successful 5G registration alone does not prove user-plane IP connectivity.

## PDU Session Verification

The runbook points to SMF logs and modem IP-address queries as data-plane validation evidence.

This gives two perspectives on the same system state:

- core-network session state;
- UE-side assigned-address state.

## Operational Failure Reasoning

The documented notes capture several high-value testbed lessons:

- the UE mode preference may revert after reboot;
- SA registration and QMI PDU-session establishment are separate concerns;
- manual attach commands are not necessarily the correct SA workflow;
- DNN mismatch can prevent a usable session even if registration succeeded;
- core, gNB, UE, and user-plane checks should be performed independently.

## Processing Pipeline

`Processing/ExtractingData.py` turns raw scenario artifacts into aligned CSV outputs.

It expects a scenario directory roughly shaped as:

```text
scenario/
├── <latency log>.txt
├── logs/
│   └── modem_status*.json
└── C_*logs/
    └── <iperf3 throughput log>
```

It creates:

```text
extracted/
├── <scenario>_throughput.csv
├── <scenario>_latency.csv
└── <scenario>_rf_metrics.csv
```

## Automatic File Discovery

The script searches for data by directory/file conventions rather than requiring every path as a CLI argument.

It identifies:

- a throughput directory matching `C_*logs` case-insensitively;
- a latency file in the scenario root, preferring names containing ping/latency/ICMP;
- modem JSON under `logs/`, preferring `modem_status*.json`.

This reduces manual per-scenario configuration.

## Throughput Parsing

The extractor parses timestamped iperf3 text output with regular expressions.

For each interval it extracts:

- wall-clock time;
- interval start;
- interval end;
- transferred data;
- transfer unit;
- bitrate;
- bitrate unit.

The output normalizes transfer values to MB and throughput to Mbps.

## Unit Normalization

The script handles multiple iperf unit scales.

Examples include conversion from:

- Gbits/sec to Mbps;
- Kbits/sec to Mbps;
- bits/sec to Mbps;
- GBytes/KBytes/Bytes to MB.

This is important when aggregating measurements because iperf may dynamically choose display units.

## Throughput Time Window

The parser derives an interval-start clock time from the reported interval-end wall clock and duration.

The first throughput interval becomes the scenario start boundary and the last interval becomes the scenario end boundary.

That time window is then reused to crop latency and RF data.

The throughput log therefore acts as the alignment anchor.

## Latency Parsing

Latency lines are parsed from timestamped ICMP output.

Extracted fields include:

- timestamp;
- ICMP sequence number;
- latency in milliseconds.

The script accounts for the logger's repeated-second timestamp artifact and reconstructs a conventional microsecond timestamp string.

## Latency Cropping

Latency rows are retained only when their wall-clock time falls within the throughput-derived start/end window.

This creates scenario-level temporal alignment across independently recorded tools.

## Modem RF JSON Parsing

The script reads modem JSON samples and extracts serving-cell information.

Observed RF fields include:

- RSRP;
- RSRQ;
- SINR;
- cell state;
- radio access technology;
- PCI;
- ARFCN;
- band;
- sample index;
- timestamp.

This is direct evidence of cellular radio-metric processing.

## RF Metric Cropping

RF samples are also cropped to the throughput-derived clock window.

The result is three output tables that cover the same scenario interval:

```text
throughput
latency
RF metrics
```

This supports later correlation or comparative analysis without repeatedly parsing the raw logs.

## CSV Output Design

The script emits explicit tabular schemas instead of writing loosely formatted text.

Throughput output includes normalized transfer/rate fields.

Latency output includes timestamp, sequence, and latency.

RF output includes timestamped signal-quality and cell metadata.

This creates a clean intermediate representation for downstream analysis.

## CLI Usability

The script supports:

- `--out` to override the output directory;
- `--name` to override the output prefix.

Otherwise it uses the current scenario directory name as the label.

## Defensive Behavior

The extractor aborts when the required throughput source cannot be found or parsed.

Latency and RF sources are treated more permissively: missing optional inputs generate warnings and empty corresponding outputs rather than invalidating the throughput extraction.

This is evidence of differentiated required/optional input handling.

## Research Workflow Skills

The repository demonstrates:

- controlled testbed bring-up;
- layered cellular-network validation;
- Linux service/process management;
- AT-command modem configuration;
- QMI data-session setup;
- iperf3 measurement processing;
- latency-log processing;
- RF telemetry extraction;
- temporal alignment across measurement sources;
- reproducible scenario organization.

## Telecommunications Skills

The strongest telecommunications concepts evidenced here are:

- 5G Standalone architecture;
- core-network functions;
- AMF registration;
- SMF/PDU-session reasoning;
- gNB operation;
- N2 connectivity;
- NR band n78;
- TDD radio configuration;
- RSRP;
- RSRQ;
- SINR;
- PCI;
- ARFCN;
- DNN/APN matching;
- UE modem control.

## Systems Skills

The runbook shows practical work across:

- Linux processes;
- serial modem interfaces;
- kernel/network interfaces;
- QMI tooling;
- SDR hardware;
- IP networking;
- service logs.

## Data-Engineering Skills

The Python extractor shows:

- regex-based text parsing;
- JSON parsing;
- CSV generation;
- path discovery;
- unit normalization;
- clock-window alignment;
- data-shape normalization.

## Maturity Assessment

This repository is a **focused, experimentally grounded private-5G SA runbook and extraction utility**.

The operational README contains concrete successful-state checkpoints rather than generic setup instructions.

The Python processing script is a real scenario-normalization tool with explicit input discovery, unit conversion, temporal cropping, and stable CSV outputs.

The repository is narrower than the larger thesis/research repositories and should be retrieved when the query specifically concerns 5G SA bring-up, UE registration/PDU sessions, or aligning SA experiment metrics.

## RAG Retrieval Guidance

Strong matches include:

- private 5G SA testbed;
- Open5GS operation;
- srsRAN gNB;
- USRP B210;
- Quectel RM502Q-AE;
- n78 20 MHz TDD;
- AMF registration;
- SMF PDU session;
- QMI;
- AT commands;
- cellular RF metrics;
- RSRP/RSRQ/SINR extraction;
- iperf throughput parsing;
- 5G experiment preprocessing;
- multi-log temporal alignment.

It should not be retrieved as evidence that the owner implemented Open5GS, srsRAN, or the modem firmware themselves.

# Project Tags

- `5g-standalone`
- `private-5g-testbed`
- `open5gs`
- `srsran`
- `usrp-b210`
- `quectel-rm502q-ae`
- `nr-band-n78`
- `tdd`
- `20mhz-channel`
- `5g-core-network`
- `amf-registration`
- `smf`
- `upf`
- `pdu-session`
- `n2-interface`
- `qmi`
- `at-commands`
- `linux-networking`
- `modem-configuration`
- `iperf3`
- `latency-measurement`
- `rf-metrics`
- `rsrp`
- `rsrq`
- `sinr`
- `pci`
- `arfcn`
- `python-log-processing`
- `json-processing`
- `csv-export`
- `measurement-alignment`
- `research-testbed`
- `wireless-experimentation`
