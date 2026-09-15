# Apple-Publication

## Repository Identity

- Repository: 129 / 138
- Name: `Apple-Publication`
- Start date: 2026-02-07
- Latest meaningful update: 2026-03-05
- Latest meaningful commit: `81764cf2b20c5d4bc41f97d69d0ca1744bb00888`
- Primary repository language metadata: Python
- Technical field: wireless-network experiment automation and publication analysis
- Context: research / publication tooling
- Collaboration type: `research-collaboration`

## Collaboration, Reuse, and Authorship Context

This repository contains both new repository-specific analysis work and direct reuse from earlier portfolio repositories.

That lineage should be preserved rather than hidden.

`Server/AutomationStarter.py` has the same Git blob identity as `Server/starter.py` in `SedraFTPVariant`.

It is therefore a reused experiment-automation artifact, not a separate independent implementation created for this repository.

`Processing/FinishTime.html` has the same Git blob identity as NetSeer's FTP-analysis page.

It is also a reused analysis artifact.

`Client/LaptopFTPClient.py` is an evolved copy of the same general Tkinter FTP automation architecture seen in `SedraFTPVariant`.

By contrast, the repository adds distinct capabilities such as:

- `LaptopIperf3Suite.py`,
- a Net++ mini command language,
- a PyQt6 build/run interface,
- `Throughput.html` iteration,
- `tcp_dump_gui` TCP ramp analysis.

This makes the repository strong evidence of **reuse plus extension**.

## What This Project Is

`Apple-Publication` is a collection of client, server, and processing tools assembled for controlled network-performance experiments and publication-oriented analysis.

The repository spans three broad responsibilities:

```text
Client/
    workload execution and automation

Server/
    experiment coordination / capture analysis

Processing/
    transfer statistics and visualization
```

The tooling covers two major workload families:

- FTP transfer experiments,
- iperf3 TCP throughput experiments.

It also contains post-processing for:

- transfer-time statistics,
- throughput plots,
- TCP ramp/slow-start behavior.

## FTP Automation Continuity

`LaptopFTPClient.py` continues the earlier Tkinter FTP automation design.

Its module description identifies:

- FTP client behavior,
- automated tests,
- UDP control.

The configurable dimensions include:

- FTP host,
- FTP port,
- user,
- password,
- remote file,
- save location,
- automated test count,
- separation time,
- UDP listener/sender addresses.

### Transfer Engine

The client uses Python's `ftplib`.

Its transfer architecture preserves the earlier safety pattern of:

- writing to a partial file,
- reporting progress,
- tracking bytes,
- timing the transfer,
- replacing the final file on completion,
- cleaning partial state after failure.

### Remote Experiment Commands

The client recognizes UDP control commands including:

- `START_DOWNLOAD`,
- `STOP_DOWNLOAD`,
- `START_AUTOTESTS`,
- `STOP_AUTOTESTS`.

This keeps experiment control separate from the bulk data transfer.

### Reuse Significance

The repeated architecture across `SedraFTPVariant` and `Apple-Publication` is itself useful evidence.

It shows a test harness being carried forward into a publication workflow rather than rewritten from scratch for each experiment.

## Net++ iperf3 Suite Runner

`Client/LaptopIperf3Suite.py` adds a distinctly different automation mechanism.

The file calls itself:

`Net++ Suite Runner (iperf3 client automation) — PyQt6`.

The application introduces a tiny domain-specific language for describing experiment sequences.

Example source form:

```text
automate(duration=30,cooldown=30,n=50);
sleep(10);
```

This shifts experiment automation from hard-coded GUI choices toward a declarative script.

## Net++ Command Model

The parser currently recognizes two command families:

- `automate`,
- `sleep`.

The language uses semicolons to delimit top-level commands.

Arguments can appear inside parentheses.

### `automate`

The command requires:

- `duration`,
- `cooldown`,
- `n`.

These parameters describe:

- duration of each iperf test,
- cooldown between tests,
- repetition count.

### `sleep`

The suite can explicitly insert idle time between experiment phases.

## Parser Engineering

`NetPPParser` is a real parser for the intentionally small command language.

### Top-Level Command Splitting

The parser scans source character by character.

It tracks:

- parenthesis depth,
- single-quoted strings,
- double-quoted strings,
- escape state.

A semicolon only terminates a command when the parser is outside nested parentheses and quoted strings.

This is more robust than blindly splitting the source on every semicolon.

### Comment Handling

The current parser removes `#` comments before command parsing.

The repository commit history explicitly records work to fix comment parsing.

That gives a direct example of language-tooling iteration based on a parser edge case.

### Argument Parsing

The parser supports:

- named arguments,
- positional values,
- signed integers,
- quoted strings.

Identifier names are validated.

### Build Diagnostics

The parser returns `BuildIssue` objects with:

- severity,
- message,
- source position.

The application can therefore perform a build/syntax-check phase before execution.

### Semantic Validation

For `automate`, validation includes:

- required arguments,
- integer type checks,
- positive duration,
- nonnegative cooldown,
- valid repetition count.

This is not just string parsing.

The application performs basic semantic validation of the experiment program.

## Build / Run / Stop Workflow

The PyQt6 application exposes distinct concepts of:

- Build,
- Run,
- Stop.

That resembles a miniature development environment for experiment scripts.

Each command can have a visible execution state.

The documented color convention is:

- yellow: running,
- green: passed,
- red: failed.

This makes a long experiment suite inspectable at command granularity.

## iperf3 Integration

The Net++ runner executes TCP iperf3 client tests.

The design allows binding to a selected local IPv4/interface.

This is important when the research machine has multiple network paths and the experiment must force traffic onto a specific adapter.

### Success Criteria

The source documents success as:

- process exit code zero,
- and, when JSON output is requested, successful JSON parsing without an iperf-reported error.

That is stronger than assuming process launch equals a valid experiment.

## PyQt6 Desktop Engineering

The suite imports a broad PyQt6 interface layer including:

- main window,
- plain-text editor,
- status areas,
- toolbar actions,
- forms,
- combo boxes,
- spin boxes,
- checkboxes,
- syntax highlighting.

The interface therefore treats the Net++ source as an editable experiment artifact.

## Network Interface Awareness

The runner uses `psutil`, `socket`, and platform/process APIs.

This supports identifying local network interfaces and binding the iperf workload to a selected address.

The capability aligns with the broader portfolio pattern of ensuring a measurement traverses the intended Wi-Fi/cellular path.

## Throughput Processing Page

`Processing/Throughput.html` is a browser-based network-log processor.

It uses:

- Chart.js,
- Moment.js,
- FileSaver.js.

The page includes a substantial interactive UI for:

- log input,
- processing,
- plotting,
- configurable display,
- chart export.

### Plot Controls

The page contains:

- upload/download views,
- moving-window controls,
- chart colors,
- editable chart titles,
- marker controls.

The marker UI indicates later extension beyond the earlier NetSeer throughput processor.

### Browser-Based Workflow

Keeping this processor as standalone HTML makes it easy to use on experiment outputs without starting an application server.

This pattern appears repeatedly across the research portfolio.

## Reused Transfer-Time Analyzer

`Processing/FinishTime.html` is byte-identical to the FTP analyzer used in NetSeer.

That tool parses FTP log records containing:

- completion state,
- elapsed seconds,
- transferred bytes.

It computes:

- unique entries,
- completed entries,
- average time,
- standard deviation of time,
- average speed,
- standard deviation of speed.

It also produces chronological plots.

In this repository the important fact is **reuse in the publication workflow**, not independent implementation.

## TCP Ramp / Slow-Start Analysis

The latest repository addition, `Server/tcp_dump_gui`, adds a distinct transport-layer analysis tool.

Its module description says it analyzes TCP ramp-up / doubling behavior from a tshark `io,stat` dump.

### Input Generation

The expected source is a command shaped like:

```text
tshark -r loopback.pcap -n -q -z io,stat,...
```

This converts packet-capture evidence into fine-grained per-time-bin byte totals.

### Parser

The GUI parses:

- interval start,
- interval end,
- bytes delivered in the bin.

These are represented as an `IOStatSeries` dataclass.

### Cumulative Delivered Bytes

The tool computes cumulative bytes:

```text
B(t)
```

by summing delivered bytes across time bins.

### Doubling Points

A reference cumulative byte count `B0` is selected.

The tool finds the first timestamp at which cumulative data crosses:

```text
B0 × 2^k
```

for successive values of `k`.

This converts raw packet-delivery output into explicit ramp/doubling timing evidence.

### Delivery Rate

The program also computes a per-bin rate:

```text
R(t) = bytes_in_bin / bin_width
```

### Visualization

The GUI can plot:

- cumulative delivered bytes,
- per-bin delivery rate,
- vertical markers for doubling points.

### Focus Window

The user can restrict the visualization to the first few milliseconds.

That is useful for studying the early connection phase where TCP ramp-up behavior is most visible.

### Export

The tool supports:

- PNG plot export,
- CSV export of nonzero bins,
- copyable doubling table.

This is a publication-friendly transformation from packet-capture data to structured transport-layer figures/tables.

## Research Pipeline Shape

A useful overall interpretation is:

```text
experiment program / operator controls
             ↓
FTP or iperf3 workload
             ↓
network interface / server path
             ↓
raw logs and packet captures
             ↓
browser/Python processing
             ↓
statistics, plots, TCP ramp evidence
             ↓
publication material
```

The repository therefore links execution and analysis rather than treating them as separate projects.

## Engineering Practices Evidenced

### Reuse Instead of Reinvention

Identical artifacts are carried from earlier repositories where their behavior already fit the new experiment.

This reduces duplicate implementation effort.

### Extension at the Correct Layer

New work is concentrated where the publication experiment needs more capability:

- iperf3 suite orchestration,
- a command language,
- parser diagnostics,
- transport-layer ramp analysis.

### Build Before Execute

The Net++ tool separates syntax/semantic checking from suite execution.

### Explicit Execution Status

Each suite command has a visible run result.

### Interface Binding

The workload can be directed through a selected local network interface.

### Structured Export

Several analysis tools export data or figures into forms suitable for further research use.

## Scale and Complexity

The project is not large in file count, but individual tools are substantial.

The repository contains:

- a ~51 KB FTP automation client,
- a ~40 KB iperf3 suite runner,
- a large reusable server automation script,
- browser processing pages,
- a PySide6 TCP ramp analyzer,
- a captured screenshot artifact.

Its complexity comes from combining experiment orchestration and post-processing in one publication workspace.

## Skills Demonstrated

### Experiment Automation

- repeated test execution,
- configurable duration,
- cooldown control,
- sequence scripting,
- stop/cancel behavior,
- status tracking.

### Language Tooling

- mini DSL design,
- command tokenization,
- quote/parenthesis-aware parsing,
- comment handling,
- argument validation,
- diagnostic reporting.

### Networking

- FTP,
- UDP control,
- iperf3,
- interface binding,
- TCP packet-delivery analysis,
- tshark `io,stat`.

### Desktop GUI Development

- Tkinter,
- PyQt6,
- PySide6,
- interactive editor/status views.

### Data Analysis

- transfer-time statistics,
- throughput plots,
- cumulative byte curves,
- doubling-point extraction,
- rate calculations.

### Research Reporting

- PNG export,
- CSV export,
- copyable tables,
- browser figures.

## Historical Portfolio Significance

`Apple-Publication` shows a notable progression in the networking-tool portfolio.

Earlier repositories establish:

- FTP clients,
- repeated-transfer automation,
- UDP control,
- browser log processing.

This repository carries those pieces forward and adds a higher-level experiment language plus transport-layer analysis.

The evolution is therefore:

```text
manual / GUI-controlled workload
          ↓
automated repeated workload
          ↓
declarative experiment suite
          ↓
publication-oriented transport analysis
```

That is stronger evidence of engineering progression than treating the repository as an isolated set of scripts.

## Overall Project Narrative

`Apple-Publication` is a research publication toolkit that composes earlier network-testing infrastructure with new automation and analysis layers.

Its distinctive additions are the Net++ iperf3 suite language and the TCP ramp/doubling visualizer.

Together they show a move toward experiments that are both declaratively reproducible and transport-layer interpretable.

The repository also provides unusually clear evidence of code reuse across the portfolio, which is preserved here so later RAG answers can distinguish extension from repeated attribution.

# Project Tags

- `research-collaboration`
- `research-publication-tooling`
- `python`
- `tkinter`
- `pyqt6`
- `pyside6`
- `ftp`
- `ftplib`
- `udp-control-plane`
- `iperf3`
- `network-test-automation`
- `repeated-trials`
- `experiment-scripting`
- `domain-specific-language`
- `parser`
- `syntax-validation`
- `semantic-validation`
- `comment-parsing`
- `interface-binding`
- `process-automation`
- `tshark`
- `tcp`
- `tcp-ramp-analysis`
- `tcp-slow-start-analysis`
- `cumulative-bytes`
- `doubling-point-analysis`
- `packet-capture-analysis`
- `throughput-analysis`
- `transfer-time-analysis`
- `chartjs`
- `browser-analysis-tools`
- `csv-export`
- `png-export`
- `cross-repository-code-reuse`
