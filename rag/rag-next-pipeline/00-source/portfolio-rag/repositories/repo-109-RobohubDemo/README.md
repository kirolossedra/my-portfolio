# RobohubDemo

## Repository Identity

- Repository: 109 / 134
- Name: `RobohubDemo`
- Repository start date: 2026-06-10
- Last meaningful update date: 2026-06-11
- Latest meaningful commit: `e6ab848d95b8a5eebb30a1c2f234e00a87a9fd47`
- Primary type: Network-performance measurement agent and synchronized telemetry dashboard
- Technical field: Network measurement, experiment tooling, desktop applications, browser visualization
- Application domain: RoboHub wireless/network performance demonstrations and experiments
- Collaboration type: `individual-project`
- Primary languages: Python, HTML, CSS, JavaScript

## Collaboration and Authorship Context

The repository is owner-driven and contains the measurement agent and browser dashboard used for a RoboHub experiment/demo context. The corpus treats the software implementation as personally attributable while treating the surrounding RoboHub infrastructure and research environment as external experimental context.

The implementation therefore evidences ownership of the measurement and visualization tooling, not ownership of the network infrastructure on which the measurements are run.

## Evidence Basis

The analysis is grounded in:

- `perfer.py`;
- `index.html`;
- the repository README;
- repository history through June 11, 2026.

The short root README understates the implementation. The substantive evidence is in the Python agent and the browser application.

## What This Project Is

`RobohubDemo` is an experiment-support system for running iperf3 throughput tests, publishing interval-level measurement telemetry to Firebase, and displaying multiple synchronized measurement streams in a browser dashboard.

Its most important architectural decision is that the interface carrying the actual iperf3 probe traffic is modeled separately from the interface used to send telemetry to Firebase.

That separation matters in multi-interface hosts. A machine can measure a specific Wi-Fi, 5G, Ethernet, or USB-network path while using another internet-capable interface to report results without accidentally changing which interface the throughput test exercises.

The Python application manages the measurement run and produces timestamp-rich records. The browser application consumes those records, groups them by explicit stream identity, and plots them on synchronized timelines.

## Project Scope

### Desktop Measurement Agent

`perfer.py` implements a Tkinter-based iperf3 client agent.

The UI exposes configuration for:

- Firebase POST endpoint;
- stream code;
- TCP or UDP;
- UDP bandwidth;
- telemetry-sending interface;
- probing interface;
- target iperf3 server address;
- target port;
- reporting interval;
- parallel streams;
- finite or infinite duration.

The application also displays:

- generated iperf3 command;
- latest throughput;
- average throughput;
- minimum/maximum throughput;
- standard deviation;
- parsed sample count;
- successful POST count;
- failed POST count;
- active routing/interface descriptions;
- raw iperf3 and telemetry logs.

### Interface Discovery

The Python agent discovers active non-loopback IPv4 interfaces through `psutil`.

Each discovered interface is represented by:

- name;
- IPv4 address;
- netmask.

The operator selects two potentially different interfaces for the two different responsibilities.

### Probing Interface

The probing interface is passed to iperf3 through `-B`.

This binds the throughput test to the selected local source address.

The agent therefore makes the measured network path explicit rather than leaving interface choice entirely to default routing behavior.

### Telemetry-Sending Interface

Firebase HTTP requests use a custom `requests` adapter that sets an explicit `source_address`.

A bound `requests.Session` is constructed from the sending interface's IP address.

This creates a second explicit route selection for telemetry delivery.

### Downlink Measurement

The agent uses iperf3 reverse mode (`-R`).

The server sends traffic toward the client, making the resulting measurement a downlink-oriented test from the configured server to the selected probing interface.

### TCP and UDP Modes

The command builder supports both:

- TCP;
- UDP with configurable bandwidth.

For UDP, the command adds `-u` and `-b`.

### Finite and Infinite Duration

A normal run uses a configured `-t` duration.

Infinite mode uses `-t 0` and continues until the user explicitly presses Stop.

This supports both bounded demonstrations and long-running measurement sessions.

### Parallel Streams

The operator can configure iperf3 parallel streams with `-P`.

The parser handles iperf3 output differently depending on stream count:

- one-stream mode consumes the individual interval line;
- multi-stream mode consumes the `[SUM]` interval row.

This prevents double-counting per-stream rows when the desired measurement is aggregate throughput.

### Interval Parsing

A regular-expression parser extracts interval-level values from iperf3 output.

Each `IperfSample` stores:

- elapsed interval start;
- elapsed interval end;
- throughput Mbps;
- transferred megabytes;
- raw output line;
- sample index;
- parser timestamp;
- reconstructed interval start/end timestamps.

### Timestamp Reconstruction

Measurement timestamps are derived from the iperf interval relative to the run start.

The telemetry model distinguishes several moments:

- interval start;
- interval end;
- parse time;
- HTTP POST time;
- Firebase server receive time.

The dashboard is instructed to plot from the actual measurement timestamp rather than the later network-post timestamp.

### Firebase Telemetry

Each parsed interval is queued for posting to Firebase Realtime Database.

The payload contains measurement values plus extensive traceability metadata including:

- stream code;
- probing interface name/IP;
- sending interface name/IP;
- target address/port;
- protocol;
- direction;
- reverse-mode flag;
- duration mode;
- interval timing;
- throughput;
- transfer amount;
- running statistics;
- client platform information;
- raw iperf3 line.

### Request-Level Trace Headers

The POST request also carries custom headers describing:

- direction;
- reverse mode;
- traffic path;
- probing interface;
- sending interface;
- stream code;
- timestamp;
- target;
- throughput;
- sample index.

This preserves diagnostic context in both the request metadata and body.

### Asynchronous Posting

Parsed measurements are placed onto a queue.

A dedicated worker thread performs Firebase POST operations while the iperf reader and GUI continue independently.

The application tracks successful posts, failed responses, and exceptions separately.

### CSV Logging

The agent creates local CSV logs for measurement runs in addition to Firebase telemetry.

This provides a local artifact independent of the remote visualization path.

## Browser Dashboard

### Multi-Stream Visualization

`index.html` is a substantial browser dashboard built around Chart.js and Firebase data.

The page normalizes incoming records into a common sample shape and groups them into measurement streams.

### Explicit Stream Identity

A critical rule in the dashboard is that grouping is based on an explicit `streamCode` / `interfaceCode` value.

It deliberately does not group only by interface name or sending interface.

If a record is missing a stream code, the dashboard isolates that record using its Firebase key rather than silently merging it into another series.

This is defensive data modeling against ambiguous stream identity.

### Timestamp Normalization

The dashboard accepts both Unix-second and JavaScript/Firebase millisecond timestamps.

Its timestamp extraction has an explicit priority order beginning with measurement-oriented fields such as:

- `sampleTimestampMs`;
- `sentAt`;
- `intervalEndAtMs`;
- other compatibility timestamps.

The plot can use iperf elapsed time as its primary x-axis basis while keeping wall-clock timestamps available for diagnostics.

### Compatibility Normalization

The browser accepts multiple historical/compatibility aliases for fields such as:

- stream identity;
- interface identity;
- throughput;
- timestamps.

This makes the visualization tolerant of telemetry schema evolution without forcing every existing record to have identical field names.

### Stable Stream Presentation

Each stream retains a stable plot identity and settings.

The interface supports user-facing stream presentation controls such as display naming and plotting choices without changing the underlying telemetry identity.

### Stream Statistics

The dashboard computes per-stream statistics from the retained samples, including:

- current throughput;
- average throughput;
- sample count.

The Python agent additionally computes min/max and population standard deviation during acquisition.

### Diagnostics UI

The dashboard includes explicit diagnostics for:

- number of grouped streams;
- unique received stream codes;
- records missing stream codes;
- identity source;
- sample count;
- latest keys;
- timestamp-source counts;
- timestamp priority;
- latest measurement samples.

This makes synchronization and grouping behavior inspectable rather than opaque.

### Plot Control

Plotting has explicit states such as:

- running;
- paused;
- resumed;
- stopped/restarted.

Receiving data and rendering the chart can therefore be controlled independently.

## Architecture and System Shape

```text
Selected probing interface
        ↓ iperf3 -B
iperf3 reverse-mode test
        ↓ stdout intervals
Python parser
        ↓
Timestamped IperfSample
        ├──────────────→ local CSV log
        ↓
POST queue
        ↓
source-bound Requests session
        ↓
Selected sending interface
        ↓
Firebase Realtime Database
        ↓
Browser normalization
        ↓
streamCode-based grouping
        ↓
Chart.js synchronized plots + diagnostics
```

The design explicitly keeps the measurement data path and telemetry-reporting data path separate.

## Technical Stack

### Python

Python implements interface discovery, iperf3 orchestration, parsing, statistics, timestamp reconstruction, Firebase posting, CSV logging, and the desktop GUI.

### Tkinter

Tkinter provides configuration, controls, metrics, generated-command visibility, and runtime logs.

### iperf3

iperf3 is the network-performance engine.

The application configures interface binding, reverse/downlink mode, interval output, parallel streams, TCP/UDP behavior, and finite/infinite duration.

### psutil

`psutil` discovers active network interfaces and IPv4 addresses.

### Requests

`requests` posts telemetry to Firebase.

A custom `HTTPAdapter` binds the HTTP connection to a specific local source address.

### Firebase Realtime Database

Firebase stores interval-level measurement telemetry used by the web dashboard.

### Chart.js

Chart.js renders multi-stream throughput plots in the browser.

### HTML / CSS / JavaScript

The browser application implements normalization, grouping, statistics, diagnostics, controls, and visualization around incoming measurement records.

## Major Engineering Work

### Dual-Interface Routing Control

The core systems concern is making two paths explicit:

- which interface is being measured;
- which interface sends measurement telemetry.

The code controls both independently.

### Source-Bound HTTP

The custom HTTP adapter pushes source-interface selection below application-level URL logic into socket creation through urllib3/Requests configuration.

### Measurement-Time Semantics

The project distinguishes when a measurement occurred from when it was parsed, posted, or received remotely.

That is essential for synchronized plots because HTTP latency should not shift the measurement point on the graph.

### Queue-Based Concurrency

The reader, poster, and GUI communicate through queues and background threads.

Remote telemetry latency therefore does not need to block measurement-output parsing.

### Schema Compatibility

The dashboard accepts multiple historical aliases while still maintaining one canonical internal sample representation.

### Defensive Stream Grouping

Explicit stream identity prevents two logically distinct tests on the same interface from being merged accidentally.

Missing identities are isolated rather than guessed.

## Testing and Verification

### Firebase Route Test

The GUI provides a dedicated POST test through the selected sending interface before a measurement run.

The test creates a distinct stream code and reports HTTP success/failure.

### Configuration Validation

Before starting, the application validates items such as:

- Firebase URL form;
- stream code presence;
- selected interfaces;
- target IPv4 address;
- port range;
- protocol;
- timing and stream configuration.

### iperf3 Availability Check

The application checks whether `iperf3` is available before launching a run.

### Runtime Diagnostics

Parsed counts, successful posts, failures, routes, raw lines, stream-code grouping, and timestamp sources are surfaced during operation.

## Engineering Practices

### Separation of Measurement and Reporting Paths

The architecture makes routing assumptions explicit instead of leaving them implicit in the operating system.

### Separation of Reader and Poster Work

A queued worker model prevents telemetry POSTs from being performed synchronously inside the iperf output-reading loop.

### Traceability

Raw iperf lines and multiple timestamp layers remain attached to the telemetry record.

### Defensive Compatibility

The browser normalizes multiple field aliases but avoids unsafe guesses for missing stream identity.

### Bounded Network Operations

Firebase requests and connection tests use explicit timeouts.

### Local and Remote Persistence

Runs are retained locally in CSV while also being published remotely for visualization.

## Scale and Complexity

### Network Complexity

A single host can simultaneously involve multiple network interfaces with different measurement and internet-access responsibilities.

### Temporal Complexity

Synchronized visualization requires separation of measurement time from parse/post/receive time.

### Stream Complexity

The dashboard can retain and plot multiple independently identified streams without collapsing them solely by interface name.

### Runtime Complexity

The agent coordinates subprocess output, threads, queues, HTTP requests, live statistics, Tkinter updates, and local logging.

## Skills Demonstrated

### Network Measurement

- **iperf3 automation — strong evidence.**
- **Downlink/reverse-mode throughput testing — strong evidence.**
- **TCP/UDP measurement — strong evidence.**
- **Parallel-stream handling — strong evidence.**
- **Explicit interface binding — strong evidence.**

### Network Programming

- **Source-address-bound HTTP — strong evidence.**
- **Multi-interface route control — strong evidence.**
- **IPv4 interface discovery — strong evidence.**

### Concurrency

- **Threaded subprocess/POST workflow — strong evidence.**
- **Queue-based producer/consumer design — strong evidence.**

### Data Engineering

- **Interval parsing — strong evidence.**
- **Timestamp reconstruction — strong evidence.**
- **Telemetry normalization — strong evidence.**
- **Schema compatibility handling — strong evidence.**
- **CSV logging — strong evidence.**

### Frontend and Visualization

- **Chart.js — strong evidence.**
- **Multi-stream plotting — strong evidence.**
- **Browser diagnostics — strong evidence.**
- **Stable stream identity — strong evidence.**

### Experimental Engineering

- **Synchronized measurement timelines — strong evidence.**
- **Measurement/reporting path separation — strong evidence.**
- **Finite and continuous experiment modes — strong evidence.**

## Capability Developed

`RobohubDemo` demonstrates a systems-level view of network measurement.

The project does not treat throughput as only a number returned by iperf3. It treats route selection, interface identity, measurement timestamps, telemetry delivery, stream identity, synchronization, and visualization as parts of the measurement system.

## Portfolio Evolution Context

Earlier networking repositories already contain iperf3 acquisition and synchronized wireless analysis.

`RobohubDemo` makes the live measurement pipeline more explicit by publishing interval-level results into a realtime datastore and separating the probe interface from the reporting interface.

It also makes synchronization assumptions visible through a dedicated diagnostics layer in the browser.

## Historical Significance

Within the processed corpus so far, this is the earliest observed repository with an explicit dual-interface network-measurement architecture in which:

- iperf3 is bound to one selected interface;
- Firebase HTTP telemetry is source-bound to another selected interface;
- interval measurements are timestamped and streamed to a realtime dashboard;
- explicit stream codes prevent ambiguous curve merging.

## Overall Repository Narrative

`RobohubDemo` is a network experiment system that couples an iperf3 desktop agent with a realtime browser visualization layer.

The Python application discovers interfaces, lets the operator choose separate measurement and telemetry routes, constructs finite or infinite TCP/UDP reverse-mode iperf3 tests, parses interval throughput, reconstructs measurement timestamps, computes running statistics, stores CSV output, and asynchronously posts detailed telemetry to Firebase.

The browser application normalizes incoming records, groups them strictly by explicit stream identity, aligns their measurement timestamps, renders Chart.js plots, and exposes diagnostics for grouping and timestamp interpretation.

The strongest engineering evidence is the explicit modeling of measurement correctness. The code recognizes that the network path being tested, the path used to report the result, the time the measurement occurred, and the logical identity of the stream are separate concerns that must all remain controlled and inspectable.

# Project Tags

## Project Type

- `network-measurement-tool`
- `experiment-dashboard`
- `individual-project`

## Languages

- `python`
- `html`
- `css`
- `javascript`

## Networking

- `iperf3`
- `throughput`
- `tcp`
- `udp`
- `reverse-mode-iperf`
- `parallel-streams`
- `interface-binding`
- `dual-interface-measurement`
- `source-bound-http`
- `ipv4-interface-discovery`

## Data and Telemetry

- `firebase-realtime-database`
- `firebase-stream-telemetry`
- `csv`
- `timestamp-alignment`
- `measurement-timestamp-reconstruction`
- `telemetry-normalization`
- `schema-compatibility`

## Concurrency

- `multithreading`
- `thread-safe-queue`
- `producer-consumer`

## Frontend and Visualization

- `chartjs`
- `multi-stream-plotting`
- `stable-stream-identity`
- `browser-diagnostics`

## Experimental Engineering

- `finite-infinite-test-duration`
- `measurement-reporting-path-separation`
- `synchronized-plots`
- `local-and-remote-measurement-logging`

## Portfolio Significance

- `earliest-observed-dual-interface-iperf-firebase-measurement-agent`
- `earliest-observed-stream-code-isolated-realtime-throughput-dashboard`
