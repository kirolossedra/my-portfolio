# Thesis-Scripts

## Repository Identity

- **Repository:** `kirolossedra/Thesis-Scripts`
- **Corpus index:** 097
- **Repository start date:** 2025-10-25
- **Last meaningful update date:** 2025-10-25
- **Latest meaningful commit:** `0be11a8cc27b53f1eaf8e9c8b7b5f9d76c5b9031`
- **Primary repository language:** Python
- **Project form:** wireless-experiment support toolkit and low-level network-service experiment
- **Collaboration classification:** `individual-project`

## Evidence Basis

The repository is organized into three substantive areas:

- `Aruba/Sniffer Mode/`
- `Client Side/`
- `Sockets/`

The root and subdirectory README files contain little descriptive material, so the strongest evidence comes directly from the Python source.

The latest commit is attributed to the repository owner and adds the DHCP implementation.

The Aruba scripts are concrete log-processing and visualization utilities.

The client-side scripts automate timestamped ping and iperf3 measurement collection.

The sockets directory contains a manually implemented DHCP server.

This makes the repository a compact collection of experiment-support utilities spanning wireless telemetry, network measurement, and infrastructure protocol handling.

## What This Project Is

`Thesis-Scripts` is a research-support repository for collecting and interpreting network measurements around wireless experiments.

The Aruba tools transform controller or station telemetry logs into focused views of one client device.

The client-side tools automate repeatable latency and throughput logging.

The DHCP component provides local address-allocation behavior through a directly implemented BOOTP/DHCP server.

The repository therefore connects three parts of experimental networking:

```text
wireless infrastructure telemetry
            +
endpoint performance measurements
            +
local network configuration service
```

The scripts are operational utilities rather than a single monolithic application.

## Project Scope

The retained code covers:

- Aruba station-log filtering;
- target-MAC extraction;
- BSSID history;
- BSSID transition detection;
- Wi-Fi channel history;
- channel transition detection;
- RSSI extraction;
- SNR extraction;
- simple signal statistics;
- timeline plotting;
- filtered text-report generation;
- timestamped continuous ping logging;
- long-running iperf3 acquisition;
- real-time iperf3 log tailing;
- Windows/Linux ping-command selection;
- DHCP request parsing;
- DHCP response construction;
- address-pool management;
- static MAC-to-IP reservations;
- lease tracking;
- DHCP RELEASE handling;
- broadcast UDP replies.

## System Shape

The repository can be understood as three independent but complementary tool paths.

```text
Aruba text/log files
        ↓
MAC-focused parsers
        ↓
BSSID / channel / RSSI / SNR views
        ↓
plots + summaries + filtered reports
```

```text
network endpoint
    ↓
ping / iperf3 subprocesses
    ↓
timestamped local logs
```

```text
DHCP client broadcast
        ↓ UDP :67
manual Python DHCP server
        ↓
BOOTP header + option parsing
        ↓
DISCOVER / REQUEST / RELEASE
        ↓
OFFER / ACK + lease state
```

## Technical Stack

### Python

All substantive source in the repository is Python.

The language is used for:

- regular-expression log parsing;
- file scanning;
- plotting;
- subprocess control;
- timestamping;
- socket programming;
- binary protocol parsing;
- stateful lease management.

### Regular Expressions

The Aruba utilities use regular expressions to recover timestamps and station fields from semi-structured controller output.

Patterns locate:

- `LocalBeginTime`;
- a target MAC address;
- BSSID values;
- 5 GHz channel identifiers;
- RSSI and SNR columns.

This is practical text-to-structured-data processing rather than fixed CSV ingestion.

### Matplotlib

`bssid.py`, `rssi.py`, and `switch.py` produce local visualizations.

Matplotlib is used for:

- BSSID step timelines;
- Wi-Fi channel step timelines;
- RSSI time series;
- SNR time series;
- markers;
- legends;
- time-axis formatting;
- PNG export.

## Aruba Station-Log Analysis

### Target-MAC Focus

The Aruba scripts center analysis on one configured client MAC.

This turns large access-point/controller output into a per-device history.

The same target identity is used across multiple analyses, allowing separate scripts to answer different questions about one station.

### Timestamp Parsing

The scripts detect Aruba log entries containing `LocalBeginTime`.

They parse timestamps in a form such as:

```text
2025-10-24T11:32:14.662-0400
```

The code removes the fractional component before converting the timestamp into a Python `datetime`.

This produces time-indexed station observations suitable for transition detection and plotting.

### BSSID Timeline

`bssid.py` extracts the BSSID associated with the target station.

It:

- scans `.txt` and `.log` files;
- identifies the first file containing target data;
- sorts observations by timestamp;
- maps unique BSSIDs to plot positions;
- renders a step plot;
- reports BSSID occurrence counts;
- reports percentage distribution;
- detects changes between consecutive BSSIDs.

The transition report preserves both the old and new BSSID with their corresponding timestamps.

This is directly relevant to access-point association and roaming analysis.

### Channel Timeline

`switch.py` applies the same general structure to Wi-Fi channels.

It recognizes the 5 GHz channel field and extracts values such as `36E`.

The script:

- sorts observations chronologically;
- assigns each observed channel a categorical plotting position;
- produces a step timeline;
- reports channel occurrence percentages;
- identifies channel transitions.

This separates RF-channel changes from BSSID changes while retaining a common time basis.

### RSSI and SNR Analysis

`rssi.py` parses RSSI and SNR values for the target station.

It produces a two-panel time-series visualization and computes:

- minimum;
- maximum;
- average;
- median.

It also groups RSSI observations into coded quality ranges defined by the script.

The key engineering evidence is the automated extraction, aggregation, and visualization of signal measurements from raw infrastructure logs.

### Filtered Station Report

`skim.py` creates a human-readable filtered report for the target MAC.

For matching station rows it retains fields including:

- timestamp;
- MAC;
- BSSID;
- band/channel;
- ESSID;
- station type;
- authentication field;
- SNR;
- RSSI;
- client delay;
- SNR/RSSI age;
- report age.

It writes both a compact table and a detailed entry-by-entry section.

The output also summarizes:

- unique BSSIDs;
- unique channels;
- unique ESSIDs;
- occurrence counts;
- RSSI averages;
- SNR averages.

This is a useful data-reduction stage before more specialized analysis.

## Endpoint Measurement Acquisition

### Timestamped Ping Logging

`Client Side/ping.py` wraps the platform `ping` command in Python.

The script:

- creates a log directory;
- generates a timestamped filename;
- starts ping as a subprocess;
- reads output continuously;
- prepends a wall-clock timestamp to each line;
- writes the same line to disk;
- terminates cleanly on `Ctrl+C`.

The command differs by platform:

- Windows uses continuous `ping -t` with a millisecond timeout;
- non-Windows execution uses the Linux-style `-W` timeout.

This gives the experiment a consistent timestamped latency record even though the underlying ping utilities differ.

### iperf3 Acquisition

`Client Side/iperf.py` launches an iperf3 client for a long-duration test.

The command uses:

- a configured target;
- a one-second reporting interval;
- iperf timestamps;
- server-output retrieval;
- iperf's logfile option.

The Python wrapper then tails the logfile while iperf3 is still running.

This simultaneously provides:

- durable experiment output;
- live terminal visibility;
- explicit process lifecycle control.

### Subprocess-Oriented Experiment Automation

Both acquisition tools use `subprocess.Popen`.

That allows external network measurement utilities to remain the measurement engines while Python handles:

- repeatable invocation;
- parameters;
- logging;
- timestamp organization;
- termination behavior.

This is a pragmatic research-tooling pattern.

## Manual DHCP Server

The `Sockets/dhcp.py` implementation extends the low-level DHCP work seen immediately before this repository in `SocketLib`.

It is manually implemented with Python sockets and byte parsing rather than a high-level DHCP server package.

### UDP Broadcast Service

The server:

- creates an IPv4 UDP socket;
- enables broadcast;
- enables address reuse;
- binds to UDP port 67;
- receives client datagrams;
- sends DHCP replies toward client port 68.

### BOOTP Header Parsing

The parser reads fixed BOOTP fields directly from bytes.

It extracts:

- operation code;
- hardware type;
- hardware length;
- hops;
- transaction ID;
- elapsed seconds;
- flags;
- client address;
- offered/client address;
- server address;
- gateway address;
- client hardware address;
- server-name field;
- boot-file field.

Numeric fields use network-byte-order unpacking.

### DHCP Option Parsing

After validating the DHCP magic cookie, the implementation walks the variable-length options section.

It recognizes at least:

- DHCP message type;
- requested IP address;
- host name.

The loop handles end and pad options and checks boundaries before reading option payloads.

### Response Packet Construction

Replies are assembled into a byte buffer.

The code explicitly writes:

- BOOTP reply fields;
- transaction ID;
- flags;
- offered IP;
- server IP;
- client hardware address;
- DHCP magic cookie.

It then appends DHCP options for:

- message type;
- server identifier;
- lease time;
- subnet mask;
- router;
- DNS server;
- end marker.

This is direct protocol serialization.

### Static Reservations

The server has a static MAC-to-IP mapping table.

During DISCOVER handling, a reserved client is offered its configured address before dynamic allocation logic runs.

During REQUEST handling, the static mapping is also enforced.

This adds deterministic per-device addressing to the earlier dynamic-pool concept.

### Dynamic Address Pool

Dynamic allocation is based on an address pool covering a configured host range.

The implementation:

- searches for existing unexpired leases for a MAC;
- otherwise chooses from currently available or expired addresses;
- records a granted address with a lease-expiry time.

### DISCOVER and REQUEST Flow

For DHCP DISCOVER:

```text
DISCOVER
   ↓
static mapping?
   ├─ yes → reserved IP
   └─ no  → existing lease or available dynamic IP
   ↓
OFFER
```

For DHCP REQUEST:

```text
REQUEST
   ↓
requested IP / current client IP
   ↓
static-mapping enforcement
   ↓
pool / reservation validation
   ↓
lease-conflict check
   ↓
ACK + lease record
```

### RELEASE Handling

The server also recognizes DHCP RELEASE.

When the released client address exists in the lease dictionary, its lease record is removed.

This is a concrete extension beyond only initial DORA allocation behavior.

### Protocol Logging

The DHCP service prints detailed request information including:

- source socket address;
- operation type;
- transaction ID;
- client MAC;
- DHCP message type;
- client/server/gateway fields;
- flags;
- requested IP;
- hostname when present.

This makes packet-level behavior inspectable while testing the service.

## Major Engineering Work

### Semi-Structured Wireless Log Parsing

The Aruba utilities transform controller-specific text into timestamped station observations.

The engineering work includes field extraction, matching, chronological ordering, aggregation, and rendering.

### Transition Detection

BSSID and channel changes are derived from successive observations rather than merely plotting raw points.

This makes the tools useful for identifying association transitions in mobile or roaming experiments.

### Measurement Process Automation

The ping and iperf3 wrappers standardize experiment launch and logging around external network tools.

### Binary Network Protocol Implementation

The DHCP component works directly at byte offsets and option records.

It combines packet parsing, packet construction, UDP broadcast behavior, and lease state.

### Stateful Network Configuration

Static reservations, dynamic leases, expiration timestamps, conflict checks, and release handling make the DHCP logic stateful.

## Verification and Experiment Observability

The tooling emits concrete run-time diagnostics.

The Aruba scripts print:

- files discovered;
- files checked;
- matching entries;
- data-point counts;
- transition summaries;
- output-file locations.

The DHCP server logs parsed request fields and assignment decisions.

The ping and iperf3 wrappers expose external-tool output while writing durable logs.

These mechanisms make experiment behavior observable during use.

## Engineering Practices

### Separation by Experimental Concern

The repository separates:

- wireless infrastructure analysis;
- endpoint measurement acquisition;
- network-service behavior.

Within the Aruba directory, individual scripts isolate BSSID, signal, filtering, and channel-switch analysis.

### Timestamp-Centered Data Handling

Time is treated as a first-class experiment dimension.

Wireless station observations and endpoint measurements are both preserved with timestamps, enabling later synchronization and correlation.

### Reusable Local Reports

Plots and filtered text outputs convert raw logs into artifacts that can be inspected outside the parser itself.

### Explicit State in DHCP

Address state is represented in explicit dictionaries and expiration timestamps.

Static reservations and dynamic leases are distinct concepts in the code.

## Scale and Complexity

The repository is modest in file count but crosses several engineering layers:

- Wi-Fi telemetry interpretation;
- regex-based parsing;
- data summarization;
- visualization;
- subprocess automation;
- cross-platform command handling;
- performance measurement;
- UDP socket programming;
- binary packet formats;
- stateful protocol behavior.

The complexity comes from breadth across experiment tooling and network layers rather than from a large application framework.

## Skills Demonstrated

### Research and Data Tooling

- experiment-support scripting
- wireless log processing
- semi-structured text parsing
- timestamp extraction
- per-device filtering
- experiment reporting
- data reduction

### Wireless Networking

- BSSID analysis
- access-point association tracking
- roaming-oriented transition analysis
- Wi-Fi channel analysis
- RSSI
- SNR
- station telemetry interpretation

### Data Visualization

- Matplotlib
- time-series plots
- categorical step plots
- PNG export
- summary statistics

### Network Measurement

- ping
- iperf3
- latency logging
- throughput logging
- subprocess orchestration
- live logfile tailing

### Network Protocol Engineering

- UDP sockets
- DHCP
- BOOTP
- binary packet parsing
- binary packet construction
- network byte order
- DHCP options
- address pools
- leases
- static reservations
- broadcast replies
- DHCP RELEASE handling

## Capability Developed

This repository strengthens the transition from isolated networking programs toward an experiment toolchain.

Earlier repositories demonstrated individual networking mechanisms and measurement utilities.

Here, the portfolio shows multiple supporting utilities organized around the practical needs of wireless experimentation:

- acquiring endpoint measurements;
- extracting radio-side observations;
- detecting association changes;
- producing plots and summaries;
- controlling local address-allocation behavior.

The repository also deepens the immediately preceding DHCP work with explicit reservations and RELEASE processing.

## Portfolio Evolution Context

Repository 096 established the processed corpus's earliest manually implemented DHCP/BOOTP server.

Repository 097 continues that low-level protocol work while adding a distinct research-tooling layer for Aruba Wi-Fi telemetry and repeatable ping/iperf3 capture.

The strongest evolution is the integration of protocol-level networking with wireless measurement support, building on the DHCP capability already established in repository 096.

It also provides the first processed-repository evidence in this immediate sequence of dedicated BSSID-transition and channel-transition analysis sourced from Aruba station logs.

## Historical Significance

Within the processed corpus so far, this repository is the earliest observed dedicated Aruba station-log analysis toolkit centered on:

- BSSID transition history;
- channel transition history;
- target-station RSSI/SNR;
- filtered station reports.

It is also the first processed repository after the initial DHCP server to extend that implementation pattern with explicit static reservations and DHCP RELEASE handling.

## Overall Repository Narrative

`Thesis-Scripts` is a compact but broad networking-research support repository.

Its Aruba tools parse semi-structured wireless infrastructure logs into per-client BSSID, channel, RSSI, SNR, and transition views.

Its endpoint scripts automate timestamped ping and iperf3 acquisition.

Its socket code manually implements core DHCP/BOOTP behavior with binary packet construction, address pools, static reservations, expiring leases, and RELEASE processing.

Together these utilities show practical movement from individual network-programming exercises toward the support machinery required to run, inspect, and organize wireless experiments.

# Project Tags

`individual-project`, `python`, `research-tooling`, `experiment-automation`, `wireless-networking`, `wifi`, `wlan-analysis`, `aruba-log-analysis`, `semi-structured-log-parsing`, `regex-parsing`, `target-mac-filtering`, `bssid`, `bssid-transition-analysis`, `roaming-analysis`, `wifi-channel-analysis`, `channel-transition-analysis`, `rssi`, `snr`, `matplotlib`, `data-visualization`, `time-series-analysis`, `step-plot`, `png-export`, `summary-statistics`, `timestamped-logging`, `network-measurement`, `ping`, `iperf3`, `subprocess`, `cross-platform-command-handling`, `live-log-tailing`, `udp-server`, `dhcp`, `bootp`, `dhcp-server`, `binary-protocol`, `binary-packet-parsing`, `struct-pack`, `struct-unpack`, `dhcp-options`, `dhcp-magic-cookie`, `discover-offer`, `request-ack`, `address-pool`, `lease-management`, `lease-expiration`, `static-dhcp-reservation`, `dhcp-release-handling`, `broadcast`, `network-infrastructure`, `protocol-implementation`, `earliest-observed-aruba-station-log-analysis`, `earliest-observed-bssid-channel-transition-tooling`
