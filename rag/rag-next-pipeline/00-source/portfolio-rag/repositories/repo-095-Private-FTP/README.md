# Repository 095 — Private-FTP

## Repository Identity

- **Repository:** `kirolossedra/Private-FTP`
- **Corpus index:** 095
- **Repository start date:** 2025-10-09
- **Last meaningful update date:** 2026-03-20
- **Latest meaningful commit:** `b4d9e87584dbe1901bcd28c35d682ae3b37868f7`
- **Primary repository language by current implementation volume:** Python
- **Project form:** multi-phase file-transfer, measurement, and spectrum-instrumentation workspace
- **Collaboration classification:** `individual-project-with-external-components`

## Evidence Basis

Private-FTP is public despite its repository name.

It has a much longer development history and broader current tree than Fast-FTP.

The retained repository includes several distinct subsystems rather than one single cohesive protocol implementation.

Current source includes:

- Python raw-TCP file-transfer client/server scripts;
- transfer-processing scripts;
- flow-completion-time plotting;
- JSON result data;
- a large Tkinter spectrum-analyzer/SCPI GUI;
- a web landing/login/download surface;
- Objective-C Apple application scaffolding;
- the externally authored WhiteRaccoon FTP library.

The corpus must therefore separate retained owner work from third-party source.

`WhiteRaccoon.h/.m` carries Tatsuya Tobioka copyright/attribution from 2012–2013.

It is not treated as owner-authored FTP library implementation.

The Objective-C application scaffolding likewise includes historical external lineage in retained headers.

By contrast, the Python transfer and instrumentation scripts are analyzed as the repository's substantive owner-managed experimentation layer.

The web page contains security-oriented product copy.

Marketing text such as “military-grade encryption” is not implementation evidence.

The current Python transfer scripts use ordinary TCP sockets without TLS or cryptographic framing.

That boundary is mandatory for retrieval accuracy.

## What the Project Is

Private-FTP is best understood as an evolving networking and measurement workspace that started around file-transfer experimentation and expanded into performance analysis and RF instrumentation tooling.

It contains at least four distinct technical concerns:

1. file-transfer application/protocol work;
2. custom TCP transfer experiments;
3. flow-completion-time/performance analysis;
4. spectrum-analyzer control and sweep visualization.

A web-facing “Sedra FTP” surface provides product framing around the file-transfer theme.

The repository is not accurately summarized as merely “an FTP app.”

Its current retained scope is substantially broader.

## Project Scope

### File Transfer

- custom Python TCP client;
- custom Python TCP server;
- filename/length framing;
- raw file-byte transfer;
- server-side file persistence;
- response/acknowledgment handling;
- transfer timing.

### Measurement / Analysis

- throughput calculations;
- flow-completion-time style data;
- structured result data;
- protocol/file-size comparison;
- Tkinter + Matplotlib plotting.

### RF Instrumentation

- serial instrument discovery/connection;
- SCPI terminal commands;
- spectrum sweep configuration;
- frequency/span/RBW controls;
- sweep-point/count controls;
- multi-sweep recording;
- realtime plotting;
- max-hold behavior;
- peak markers;
- CSV/DAT export;
- XML configuration persistence.

### Apple / Web Layer

- retained Objective-C/iOS scaffolding;
- external WhiteRaccoon FTP library;
- browser landing/login/download UX.

## Architecture / System Shape

Because the repo is multi-phase, one diagram would be misleading.

### Python Transfer Pair

```text
file.txt
   ↓
Python client
   ↓
custom framing over TCP :5001
   ↓
Python threaded server
   ↓
received_<filename>
```

### Measurement Pipeline

```text
transfer observations/results
        ↓
processing / derived throughput
        ↓
FCT Plotter
        ↓
embedded Matplotlib views
```

### Spectrum Analyzer Tool

```text
Tkinter GUI
   ↓
serial port / SCPI commands
   ↓
Mini-Circuits RSA-series analyzer
   ↓
sweep data
   ↓
realtime plot + max hold + export
```

### Retained Apple/Web Layer

```text
browser/iOS product surface
        ↓
FTP-oriented integration / download workflow
        ↓
third-party WhiteRaccoon source retained in tree
```

These are related by project history and experimental goals, but they should remain separately retrievable.

## Technical Stack

### Python / Networking

- Python
- `socket`
- TCP
- threaded server handling
- file I/O
- custom application framing

### Data / Visualization

- Tkinter
- Matplotlib
- NumPy
- JSON
- CSV
- DAT
- XML configuration

### Instrumentation

- pyserial-style serial communication
- SCPI commands
- spectrum analyzer control
- frequency-domain sweeps
- RBW configuration
- max-hold analysis

### Apple / Web

- Objective-C artifacts
- Xcode-era application structure
- HTML/CSS/JavaScript
- external WhiteRaccoon FTP library

## Custom TCP File Transfer

`FTP Scripts/main.py` is not an FTP protocol client despite the directory name.

It opens a normal TCP socket to `127.0.0.1:5001`.

The client reads `file.txt` and sends a small custom application framing format.

The framing contains:

1. filename terminated by newline;
2. file length represented in a fixed 16-byte padded field;
3. raw payload bytes;
4. server response after completion.

This demonstrates application-protocol design over TCP.

It should be tagged `custom-tcp-file-transfer`, not `ftp-protocol`, for this subsystem.

## Python Server

`server.py` listens on `0.0.0.0:5001`.

It enables `SO_REUSEADDR`.

The server accepts client connections and handles them concurrently using a thread-per-client model.

For each connection, it:

- reads a filename until newline;
- reads a 16-byte size field;
- receives the announced number of bytes in chunks;
- writes a `received_...` file;
- returns a completion response.

The chunk size is 4096 bytes in the retained code.

This is a useful compact client/server transport experiment.

It is not a standards-compliant FTP server.

## Protocol-Framing Reasoning

Raw TCP is a byte stream with no inherent message boundaries.

The client/server pair therefore has to invent boundaries for metadata and payload.

The newline-terminated filename and fixed-width size field provide that framing.

This is important systems reasoning.

It shows why an application protocol needs structure even when the underlying TCP connection is reliable and ordered.

## File-Transfer Security Boundary

The Python transfer pair uses ordinary TCP.

There is no retained TLS wrapper around the socket.

There is no authenticated key exchange.

There is no per-transfer encryption primitive.

There is no cryptographic integrity tag.

The server also accepts the filename sent by the client as part of its output path construction.

The code should therefore not be described as a secure transfer protocol merely because the website uses security-oriented branding.

This is one of the strongest evidence-cleaning requirements in the repository.

## Transfer Performance Work

`process.py` contains file-size/time observations and throughput-oriented calculations.

The script converts observed completion time into rate values.

This reflects an increasingly measurement-driven use of the transfer project.

The focus is not only “did the file arrive?” but also “how long did the transfer take, and what throughput did that imply?”

That aligns with the user's broader wireless/network performance research trajectory.

## Flow Completion Time Plotter

`FCT Plotter.py` provides a small desktop analysis UI.

It uses Tkinter and Matplotlib.

The tool parses measurement data separated into experiment blocks.

It builds a measurement representation around fields such as protocol, file size, and completion time.

It provides multiple views including:

- time versus file size;
- throughput-oriented plots;
- comparative plots;
- raw-data inspection.

This is a practical instrumentation-analysis tool rather than a general BI dashboard.

## Throughput Derivation

The plotter computes throughput from file size and elapsed time.

Conceptually:

```text
throughput = file_size / completion_time
```

with conversion to bit-rate units as appropriate.

That makes the distinction between latency-like completion time and rate-like throughput explicit.

For file transfers, both views are valuable because two protocols may have similar bulk rate but different setup/short-flow behavior.

## Result Data

The current tree includes `results.json`.

That provides retained experimental data in addition to plotting code.

The presence of structured result data strengthens the interpretation of this repo as an experiment workspace rather than only a UI prototype.

It should not be assumed that every value in the file came from a rigorously controlled benchmark unless the surrounding experiment metadata establishes that.

## Spectrum Analyzer GUI

`sweepGUI.py` is by far the largest current source file.

It is a substantial desktop instrumentation interface titled around spectrum-analyzer SCPI terminal and capture functionality.

The tool targets Mini-Circuits RSA-series spectrum-analyzer workflows.

Its inclusion shows that the repository's later life expanded beyond FTP transport into RF measurement tooling.

The corpus therefore treats this as a distinct subsystem.

## Serial Instrument Discovery

The GUI can work with serial ports.

It includes connection/disconnection behavior and terminal-oriented command exchange.

This bridges desktop application code with physical test equipment.

The tool is not merely plotting synthetic arrays.

Its design is centered around controlling and collecting from an external instrument.

## SCPI Command Workflow

SCPI is a command language commonly used by measurement instruments.

The GUI exposes custom command entry and structured sweep controls.

This gives the user both:

- low-level terminal access;
- higher-level form controls for common measurement tasks.

That is a useful instrumentation UX pattern because advanced users can escape the fixed UI when needed.

## Sweep Configuration

The GUI contains controls around parameters including:

- center frequency;
- frequency span;
- resolution bandwidth (RBW);
- dwell behavior;
- reference level;
- attenuation;
- units;
- sweep-point count;
- sweep count.

These are domain-specific RF measurement settings.

Their presence is stronger evidence of spectrum-analyzer understanding than a generic serial terminal would provide.

## Multi-Sweep Recording

The tool supports repeated sweeps rather than only one instantaneous trace.

Multiple sweeps allow temporal comparison and max-hold accumulation.

This is especially useful when intermittent emissions need to be captured across time.

The commit history explicitly includes iterative changes around sweep behavior, RBW handling, and GUI quality.

That history supports meaningful owner iteration on this subsystem.

## Max Hold

Max hold retains the maximum observed amplitude at each frequency bin across multiple sweeps.

The GUI implements max-hold-oriented behavior.

This is a domain-specific signal-analysis feature.

It should not be confused with simply finding the single maximum point of one trace.

The feature implies state accumulation across sweeps.

## Peak Marker

The spectrum view includes peak-oriented marker behavior.

This allows the user to identify a dominant frequency/amplitude location in the measured trace.

Combined with max hold, it makes the GUI useful for identifying transient or strongest emissions.

## Realtime Plotting

Matplotlib is embedded into the Tkinter application.

Incoming sweep data is rendered in the GUI rather than requiring a separate offline plotting step.

This creates a closed measurement loop:

```text
configure → acquire → visualize → adjust → reacquire
```

That loop is characteristic of practical lab tooling.

## Export

The instrumentation tool supports exporting measurement data.

Current retained formats include CSV and DAT-oriented output.

Machine-readable export allows external analysis and archival.

This is a useful separation between interactive lab use and later data processing.

## XML Configuration Persistence

The GUI includes XML-based configuration save/load behavior.

That lets a measurement setup be recreated instead of manually re-entering every parameter.

For experimental reproducibility, configuration persistence is more valuable than cosmetic GUI state.

It also demonstrates serialization of domain-specific settings.

## Threading / Responsiveness

Long instrument operations are handled with threaded behavior in the GUI.

This is important because blocking serial/sweep work on the Tkinter event loop would freeze the interface.

The repository therefore shows practical desktop concurrency applied to hardware I/O.

## Web Surface

The root `index.html` presents a branded `Sedra FTP` experience.

It contains login/download-oriented product language.

The page's existence demonstrates product framing around the transfer software.

Security claims in presentation copy are not treated as implementation facts unless the source beneath them demonstrates the mechanism.

In the current retained Python transfer path, those strong encryption claims are not supported.

## External WhiteRaccoon Component

`WhiteRaccoon.h` and `WhiteRaccoon.m` are retained in the repository.

Their headers attribute the library to Tatsuya Tobioka.

WhiteRaccoon is therefore third-party source evidence.

The owner can be credited with selecting/integrating/retaining it within the project context where supported.

The underlying FTP library implementation must not be claimed as personally authored.

This distinction is essential because the external source is substantial in line count.

## Objective-C / Apple Scaffolding Boundary

The tree retains Apple application files such as `SceneDelegate` and `main.m` alongside the FTP library.

Some headers/content have external historical lineage.

The corpus does not use those files to inflate owner-authored Objective-C implementation volume.

The strongest owner-attributed engineering evidence in the current tree is the later Python experiment/tooling work and iterative spectrum GUI commits.

## Major Engineering Work

### Custom Transport Experiment

The Python pair designs a small framing protocol over raw TCP and implements both client and threaded server.

### Measurement Pipeline

Transfer observations are converted into FCT/throughput analysis artifacts.

### Desktop Analysis Tool

Tkinter/Matplotlib turns raw measurements into interactive comparisons.

### RF Instrument Control

The repository expands into SCPI/serial control of a spectrum analyzer.

### Domain-Specific Measurement UX

Sweep configuration, max hold, peak markers, exports, and persisted settings create a practical lab workflow.

### Multi-Phase Iteration

The commit history shows the repository changing technical focus over months rather than remaining a one-shot upload.

## Testing & Verification

Verification is strongly experiment-driven.

For transfer scripts, successful file receipt and server acknowledgment validate the basic data path.

Timing/result files support performance analysis.

For the instrumentation GUI, serial communication, sweep capture, plotted traces, max-hold behavior, and export paths are the operational verification surfaces.

There is no basis to convert web marketing security copy into a verified cryptographic property.

The corpus explicitly treats this mismatch as a verification boundary.

## Engineering Discipline

Several discipline improvements are visible across the repository:

- moving from success/failure transfer behavior into measurement;
- retaining structured experimental results;
- separating plotting/processing utilities;
- exposing instrument configuration explicitly;
- persisting sweep configuration;
- exporting raw/derived data;
- using background work to preserve GUI responsiveness;
- iterating on RBW/max-hold/GUI behavior through commits.

The repository also has organization debt because historically unrelated phases coexist under one name.

For RAG, that is solved by describing subsystems explicitly rather than pretending the repository has one homogeneous architecture.

## Product Engineering

The project shows both internal-tool and external-product instincts.

The web surface frames file transfer for a user.

The FCT plotter frames performance data for an analyst.

The sweep GUI frames RF instrumentation for an experimenter.

These are three different user roles.

The current repository is therefore more accurately a development workspace containing several product/tool surfaces than one finished product.

## Scale / Complexity

This is one of the more internally heterogeneous repositories in the corpus so far.

Complexity comes from combining:

- network protocol experiments;
- concurrency;
- file I/O;
- performance metrics;
- desktop GUI development;
- scientific plotting;
- serial hardware I/O;
- SCPI command semantics;
- RF measurement configuration;
- persistence/export;
- web/iOS historical layers.

The 72 KB spectrum GUI dominates current authored code volume among the retained Python files.

Third-party Objective-C source is excluded from owner-complexity inference.

## Skills Demonstrated

### Networking

- Python sockets
- TCP client/server design
- application framing over TCP
- thread-per-client concurrency
- file-transfer timing
- flow-completion-time reasoning
- throughput calculation

### Desktop / Data Tooling

- Tkinter
- Matplotlib embedding
- interactive plots
- experiment-data parsing
- JSON result handling
- CSV/DAT export
- XML configuration persistence

### Instrumentation

- serial communication
- SCPI
- spectrum analyzer control
- frequency/span configuration
- resolution bandwidth
- sweep acquisition
- multi-sweep recording
- max hold
- peak marking
- realtime spectrum plotting

### Engineering Judgment

- separating third-party source attribution
- distinguishing custom TCP transfer from FTP
- distinguishing security marketing from implemented transport properties
- evolving a prototype into measurement tooling

## What Was Learned / Capability Developed

Private-FTP demonstrates that networking work becomes more useful when it is measurable.

A file-transfer path alone answers whether bytes move.

FCT and throughput analysis answer how the transfer behaves.

Instrument-control tooling then extends that measurement mindset into the physical RF domain.

The repository therefore records a broad transition from application networking toward experimental instrumentation.

It also reinforces provenance discipline: retaining an external FTP library does not make that library owner-authored.

## Portfolio Evolution Context

Fast-FTP immediately precedes this repository and focuses narrowly on a native FTP upload path.

Private-FTP expands the scope dramatically.

The trajectory is roughly:

```text
FTP protocol/client experiment
        ↓
custom TCP transfer experiment
        ↓
transfer performance measurement
        ↓
measurement visualization
        ↓
RF instrument control / spectrum analysis
```

This progression aligns strongly with the later wireless-research/tooling direction in the portfolio.

## Historical Significance

Within the processed corpus, this is the earliest observed repository combining file-transfer performance analysis with a substantial SCPI-driven spectrum-analyzer GUI.

It is also an important example of a repository whose historical name no longer captures its full current technical scope.

For RAG retrieval, subsystem-level description is essential here.

## Limitations & Missing Evidence

The current custom Python transfer path is not FTP protocol despite folder naming.

It does not implement transport encryption/authenticated cryptography, so “military-grade encryption” presentation copy is not supported as an implementation claim.

WhiteRaccoon is externally attributed third-party source and is excluded from owner-authorship claims.

The repository aggregates several historical phases without a clean module-level architecture tying them into one deployable product.

Those boundaries make the corpus more accurate rather than less useful.

## Overall Narrative

Private-FTP is an evolving networking/measurement workspace whose technical scope grew far beyond its name.

It retains an external FTP library and Apple-era artifacts, but its strongest owner-managed evidence is in Python: custom TCP file transfer, threaded server behavior, flow-completion-time and throughput analysis, a Tkinter plotting tool, and a large SCPI spectrum-analyzer GUI with realtime sweeps, max hold, peak markers, configuration persistence, and data export.

The repository is historically significant because it shows networking turning into instrumentation-driven engineering.

# Project Tags

`individual-project-with-external-components`, `python`, `networking`, `tcp`, `socket-programming`, `custom-application-protocol`, `custom-tcp-file-transfer`, `not-ftp-protocol-for-python-transfer`, `tcp-client`, `tcp-server`, `threaded-server`, `thread-per-client`, `file-transfer`, `file-framing`, `transfer-timing`, `throughput-analysis`, `flow-completion-time`, `fct`, `experiment-results`, `json`, `tkinter`, `matplotlib`, `desktop-analysis-tool`, `interactive-plotting`, `scpi`, `serial-communication`, `spectrum-analyzer`, `mini-circuits-rsa`, `rf-instrumentation`, `spectrum-sweep`, `resolution-bandwidth`, `rbw`, `multi-sweep`, `max-hold`, `peak-marker`, `realtime-plotting`, `csv-export`, `dat-export`, `xml-configuration`, `configuration-persistence`, `background-threading`, `lab-tooling`, `objective-c-artifacts`, `white-raccoon`, `external-whiteraccoon-library`, `third-party-source`, `web-product-surface`, `security-claim-boundary`, `no-verified-transfer-encryption`, `multi-phase-experimental-workspace`, `earliest-observed-scpi-spectrum-analyzer-gui`, `earliest-observed-file-transfer-fct-analysis`
