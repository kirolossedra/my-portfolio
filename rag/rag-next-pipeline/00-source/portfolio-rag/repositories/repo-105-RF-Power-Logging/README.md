# RF-Power-Logging

## Repository Identity

- Repository: 105 / 134
- Name: `RF-Power-Logging`
- Repository start date: 2026-03-25
- Last meaningful update date: 2026-04-20
- Latest meaningful commit: `950232d5a7429e2d4e8a777afd25deda980bd009`
- Primary type: RF laboratory measurement and spectrum-sweep automation toolkit
- Technical field: RF instrumentation, serial protocols, measurement automation, scientific data processing
- Application domain: tinySA spectrum analyzer acquisition and power logging
- Collaboration type: `individual-project`
- Primary language: Python
- Main outputs: sweep CSVs, PNG plots, PDF reports, waterfall matrices/plots

## Collaboration and Authorship Context

The repository's implementation commits are owner-attributed and show iterative development from a basic measurement program toward automated multi-sweep acquisition, snapshot/report output, and post-processing.

The tinySA device protocol is an external instrument interface. The attributable engineering is the software that discovers the device, commands scans, validates/decode responses, schedules measurement runs, records metadata, and transforms sweep outputs.

## Evidence Basis

The analysis is grounded in:

- `RTPLotter.py`;
- `Remote/plot.py`;
- `Remote/process.py`;
- commit history from the first source version through the April 20 processing/plotting additions;
- the current repository tree.

The root README contains little descriptive detail, so capability claims are anchored to implementation.

## What This Project Is

`RF-Power-Logging` is a Python RF measurement toolkit for repeatedly sweeping a tinySA spectrum analyzer and converting raw scan output into structured experiment artifacts.

The repository supports two related workflows.

### Acquisition

The sweep tools:

- locate the tinySA USB serial device;
- configure resolution bandwidth;
- request raw scans;
- decode the instrument payload;
- convert raw values to dBm;
- schedule repeated sweeps;
- record timing metadata;
- export plots and tables.

### Post-Processing

The processing tool:

- discovers per-sweep CSV files;
- validates consistent frequency axes;
- stacks sweeps into a two-dimensional power matrix;
- exports the matrix;
- renders waterfall plots by sweep index and by physical frequency.

## Project Scope

### Instrument Discovery

The code scans serial ports for a fixed USB vendor/product identity:

- VID `0x0483`;
- PID `0x5740`.

### Spectrum Configuration

Default measurement configuration includes:

- start frequency: 2.3 GHz;
- end frequency: 2.5 GHz;
- 401 points;
- automatically derived RBW unless explicitly provided.

### Automatic Acquisition

Automatic mode supports:

- configurable sweep count;
- fixed scheduled start period;
- high-resolution timing;
- stop signaling;
- per-sweep start/end/duration metadata;
- start-offset measurement;
- output directories based on timestamps.

### Live Acquisition

A live mode repeatedly performs scans until stop is requested.

### Artifact Generation

The repository generates:

- one CSV per sweep;
- one PNG per sweep;
- summary CSV;
- PDF run report;
- waterfall matrix CSV;
- waterfall-by-index PNG;
- waterfall-by-frequency PNG.

## Architecture and System Shape

```text
tinySA USB serial device
        |
        | serial commands
        v
 TinySA Python wrapper
        |
        +-- RBW configuration
        +-- scanraw command
        +-- prompt framing
        +-- payload validation
        +-- binary decode
        +-- dBm conversion
        |
        v
 acquisition scheduler
        |
        +-- automatic fixed-period sweeps
        +-- live scanning
        +-- stop signal handling
        |
        v
 experiment records
        |
        +-- CSV
        +-- PNG
        +-- summary CSV
        +-- PDF report
        |
        v
 Remote/process.py
        |
        +-- frequency-axis validation
        +-- matrix stacking
        +-- waterfall visualization
```

## Technical Stack

### Python

Python implements acquisition, timing, serial communication, data processing, argument parsing, and report generation.

### PySerial

Serial communication and USB-port discovery are implemented with PySerial.

### NumPy

NumPy is used for binary scan data conversion, numerical arrays, frequency vectors, and stacked sweep matrices.

### Pandas

The waterfall post-processing utility loads sweep CSVs and exports combined matrix data using pandas.

### Matplotlib

Matplotlib generates:

- line plots;
- waterfall heatmaps;
- multipage PDF reports.

### CSV / PDF

The standard CSV module and `PdfPages` generate durable experiment artifacts.

## Major Engineering Work

### Automatic tinySA Discovery

The program searches connected serial devices for the expected VID/PID pair and returns the matching port.

This eliminates hardcoded OS-specific COM/TTY naming from the default flow.

### Raw Serial Protocol Handling

The `TinySA` wrapper:

- opens the serial link at 115200 baud;
- flushes stale buffers;
- sends RBW commands;
- waits for device prompts;
- sends `scanraw`;
- reads a framed binary payload;
- validates payload length;
- decodes three-byte point records;
- converts raw magnitude values into dBm.

### Measurement Timeout Estimation

The scan timeout is derived from:

- frequency span;
- effective RBW;
- number of requested points.

The result is then bounded to provide a practical serial timeout.

### Measurement-Argument Validation

Command-line arguments are checked for:

- valid frequency ordering;
- minimum point count;
- nonnegative RBW;
- positive sweep count;
- positive scheduling period.

### Fixed-Period Sweep Scheduling

The remote-oriented acquisition code schedules sweeps against target start times rather than simply sleeping a fixed duration after each completed sweep.

The recorded metadata distinguishes:

- scheduled start;
- actual start;
- end time;
- duration;
- start offset;
- automatically available buffer time.

This directly supports experiment timing analysis.

### In-Memory Acquisition Before Export

The later acquisition variant stores automatic-mode sweep data in memory first and performs export after acquisition ends.

That design separates time-sensitive measurement from potentially slower plot/file generation.

### Signal-Based Stop Control

A shared stop event coordinates termination behavior.

### Per-Sweep CSV Export

Each CSV includes:

- frequency;
- power in dBm;
- export timestamp;
- scan count;
- sweep index.

### Per-Sweep PNG Export

Every sweep can be rendered as a frequency-versus-power plot.

### Summary CSV

Run-level summary tables record sweep timing and artifact names.

### PDF Reporting

A PDF report contains:

- run metadata;
- frequency range;
- sweep count;
- timing summary;
- a page for each captured sweep.

### Waterfall Matrix Construction

`Remote/process.py` loads all per-sweep CSVs and stacks power vectors into an `N sweeps × M frequency points` matrix.

### Frequency-Axis Consistency Validation

Before stacking, the processor verifies that every sweep:

- has the same point count;
- uses the same frequency values.

This prevents combining incompatible measurements into one heatmap.

### Waterfall Visualization

The matrix is rendered in two views:

- x-axis as bin index;
- x-axis as actual frequency.

Color encodes power in dBm.

## Verification

### Serial Framing Validation

The acquisition code checks that the tinySA prompt and raw scan framing markers are present.

### Payload-Length Validation

Expected scan payload size is compared against the received byte count.

### Binary Decode Error Handling

`struct.error` is translated into a descriptive runtime error.

### Argument Validation

Invalid frequency/rate/point inputs are rejected before acquisition.

### Dataset Compatibility Checks

The waterfall processor rejects sweep files with missing required columns, inconsistent lengths, or mismatched frequency axes.

## Engineering Practices

### Separation of Acquisition and Analysis

RF measurement and waterfall post-processing live in distinct tools.

### Experiment Metadata

Timing, index, output filenames, and measurement settings are stored with results.

### Deterministic Output Organization

Timestamped run directories and numbered sweep filenames make batches traceable.

### Headless Plotting

The acquisition tool selects the non-interactive Matplotlib `Agg` backend for automation-friendly output.

### Graceful Stop Behavior

Signals feed a shared event rather than abruptly terminating arbitrary sections of the workflow.

### Instrument Resource Cleanup

The serial connection is closed through an explicit method guarded by a lock.

### Reusable Command-Line Configuration

Frequency range, points, RBW, mode, sweep count, period, port, and output directory are exposed as CLI arguments.

## Product Engineering

The repository is laboratory software: the product surface is the repeatable measurement workflow.

A user can define RF sweep parameters, connect a tinySA, run repeated acquisitions, and receive a structured experiment folder containing both raw/structured data and visual reports.

The post-processing step then turns repeated sweeps into a waterfall representation suitable for temporal RF-power analysis.

## Scale and Complexity

### Acquisition Complexity

The software must coordinate a hardware serial protocol, timing, raw binary decode, and disk/report outputs.

### Data Complexity

Each run can contain hundreds of sweeps, each containing hundreds of frequency bins.

### Timing Complexity

The later implementation tracks scheduling offset and separates acquisition from export to reduce measurement-cycle distortion.

### Artifact Complexity

One measurement run may generate many CSV/PNG files plus run-level summary and PDF outputs.

## Skills Demonstrated

### RF / Instrumentation

- **Spectrum-analyzer automation — strong evidence.**
- **tinySA control — strong evidence.**
- **Resolution-bandwidth configuration — strong evidence.**
- **RF power measurement — strong evidence.**
- **Repeated spectrum sweeping — strong evidence.**

### Systems / I/O

- **Serial communication — strong evidence.**
- **USB device discovery — strong evidence.**
- **Binary protocol parsing — strong evidence.**
- **Signal handling — strong evidence.**

### Data Engineering

- **CSV generation — strong evidence.**
- **NumPy numerical processing — strong evidence.**
- **Pandas data loading/export — strong evidence.**
- **Matrix construction — strong evidence.**
- **Dataset consistency validation — strong evidence.**

### Visualization

- **Matplotlib — strong evidence.**
- **Waterfall/heatmap visualization — strong evidence.**
- **Automated PNG generation — strong evidence.**
- **Multipage PDF reporting — strong evidence.**

### Experimental Engineering

- **Fixed-period scheduling — strong evidence.**
- **Timing-offset measurement — strong evidence.**
- **Timestamped experiment artifacts — strong evidence.**
- **Acquisition/analysis separation — strong evidence.**

## Capability Developed

The project represents a mature form of measurement automation: hardware is treated as a programmable data source, while acquisition timing, reproducibility, artifact naming, validation, and post-processing are all engineered into the workflow.

The significant capability is not merely reading a spectrum analyzer. It is building a repeatable RF experiment pipeline around it.

## Portfolio Evolution Context

Relative to earlier RF/SCPI tooling, this repository is more focused on:

- tinySA serial control;
- high-volume repeated sweeps;
- synchronized acquisition timing;
- structured run reports;
- waterfall post-processing.

It provides especially strong evidence of turning laboratory measurements into reproducible datasets and visual artifacts.

## Historical Significance

`RF-Power-Logging` is a clear research-engineering artifact from 2026.

It demonstrates the convergence of Python, RF instrumentation, serial protocol handling, experiment timing, data validation, and scientific visualization.

## Overall Repository Narrative

`RF-Power-Logging` is a Python toolkit for automating spectrum measurements from a tinySA.

The software discovers the instrument, configures and requests raw sweeps, validates/decodes binary results, converts them into dBm, schedules repeated acquisitions, and exports timestamped CSV/PNG/PDF artifacts. A separate processor validates the generated sweep sets, stacks them into power matrices, and renders waterfall plots.

The strongest engineering evidence is the end-to-end treatment of measurement reproducibility: hardware control, timing, validation, structured storage, and downstream visualization are all part of one coherent workflow.

# Project Tags

## Project Type

- `rf-measurement-tool`
- `laboratory-tooling`
- `measurement-automation`
- `scientific-data-pipeline`
- `individual-project`

## Languages

- `python`

## RF and Instrumentation

- `tinysa`
- `spectrum-analyzer`
- `rf-power`
- `spectrum-sweep`
- `resolution-bandwidth`
- `instrument-automation`

## Systems

- `serial-communication`
- `pyserial`
- `usb-device-discovery`
- `binary-protocol`
- `struct-unpack`
- `signal-handling`

## Data

- `numpy`
- `pandas`
- `csv`
- `measurement-matrix`
- `data-validation`
- `frequency-axis-validation`

## Visualization

- `matplotlib`
- `waterfall-plot`
- `heatmap`
- `png-export`
- `pdf-reporting`

## Experimental Engineering

- `fixed-period-scheduling`
- `timing-offset-measurement`
- `timestamped-experiment-output`
- `repeated-sweeps`
- `headless-plotting`

## Portfolio Significance

- `earliest-observed-tinysa-automation`
- `earliest-observed-fixed-period-rf-sweep-scheduling`
- `earliest-observed-rf-waterfall-pipeline`
