# Repository 079 — SDR

## Repository Identity

- **Repository:** `kirolossedra/SDR`
- **Repository start date:** 2025-03-15
- **Last meaningful update date:** 2025-08-26
- **Latest meaningful commit:** `7e46e945cef816751b49ee0776f451edac7be827`
- **Primary technical field:** wireless/network experimentation
- **Application domain:** software-defined-radio-adjacent and hybrid Wi-Fi transport research
- **Primary technologies:** Python, MATLAB, UDP sockets, multithreading, Tkinter
- **Project context:** individual research/experimental repository
- **Collaboration classification:** `individual-project`

## Evidence Basis

The repository contains several generations of research artifacts rather than one clean application tree.

Current evidence includes:

- root research/revision notes,
- MATLAB data-processing code,
- Python UDP sender scripts,
- Python UDP receiver scripts,
- multithreaded receiver variants,
- throughput-oriented receiver variants,
- a substantial Tkinter receiver GUI,
- experimental logs,
- screenshots,
- archived experiment bundles,
- a packaged GUI executable.

The directory structure includes a `Hybrid Approach` branch of experiments.

The current source therefore documents an iterative experimental program.

Generated binaries and archived ZIPs are treated as execution/distribution evidence, not authored source volume.

## What the Project Is

This repository develops tooling around a wireless networking experiment in which application-level UDP traffic is generated and received over real network interfaces.

The checked-in Python tools:

- send broadcast UDP traffic,
- receive traffic across one or more threads,
- measure bytes/packets,
- estimate throughput,
- expose network configuration,
- collect burst statistics,
- present results through a desktop GUI.

The repository also preserves hardware/environment notes and experiment logs.

The root README later evolves into a conference-paper revision checklist.

That shows the code and experiments were being organized toward research communication rather than only as a utility.

## Longitudinal Evolution

The repository starts on March 15, 2025.

The earliest visible implementation artifact is a MATLAB file.

Later activity expands substantially during May, July, and August.

The commit history shows:

- early MATLAB work,
- creation of hybrid-approach folders,
- sender/receiver experimentation,
- throughput-specific receiver iteration,
- GUI development,
- repeated receiver debugging,
- extensive run/log updates,
- paper-oriented experiment artifacts,
- final research-documentation edits.

This is a multi-month experiment repository.

## Repository Shape

The current tree includes a structure broadly like:

```text
SDR/
├── README.md
├── dataHESU.m
└── Hybrid Approach/
    ├── April28 Method/
    │   └── MacDesktopInstance/
    │       └── Multithreaded/
    │           ├── sender.py
    │           ├── recv.py
    │           ├── recvkbps.py
    │           └── screenshot
    └── Paper/
        ├── README.md
        ├── receiverGUI.py
        ├── recv.py
        ├── recvNewAttempt
        ├── newattemptwithmbps.py
        ├── logs.md
        ├── logstoday.txt
        ├── sender experiment text
        ├── experiment archives
        └── packaged GUI executable
```

Several intermediate READMEs are empty placeholders.

The active evidence lives in source and experiment files.

## UDP Sender

The multithreaded experiment includes a Python UDP sender.

It:

1. opens a datagram socket,
2. enables socket broadcast,
3. increases the socket send buffer,
4. sends fixed-size payloads to a subnet broadcast address,
5. runs for a fixed duration,
6. throttles each iteration with a small send delay,
7. catches socket send failures,
8. computes total MiB and approximate Mbps.

This is direct real-network traffic generation.

It is separate from the earlier ns-3 simulation repository.

## Send-Rate Control

The sender includes an explicit sub-millisecond delay between sends.

The code comment explains this as protection against buffer overflow.

On send failure, it also pauses briefly before retrying.

This demonstrates awareness of practical sender-side resource constraints.

Rather than assuming infinite socket throughput, the script deliberately controls pacing.

## Receiver Architecture

The receiver tooling evolves through multiple files.

The GUI version contains a reusable receiver function that:

- opens a UDP socket,
- enables address reuse,
- enables broadcast reception,
- enlarges the receive buffer,
- binds to a configurable port,
- applies an idle timeout,
- counts packets,
- counts bytes,
- groups traffic into bursts,
- computes MiB received,
- computes Mbps.

Each receiver thread records burst statistics.

The receiver therefore performs both traffic ingestion and measurement.

## Burst-Based Measurement

The receiver treats a period of incoming traffic as a burst.

When the socket times out after receiving data, it closes the burst and calculates metrics from:

- first packet time,
- last packet time,
- packet count,
- total bytes.

That produces:

- elapsed duration,
- MiB,
- Mbps.

This is a concrete measurement model encoded in the application.

## Multithreading

The GUI can launch a configurable number of receiver threads.

Each thread runs the same receive function.

Shared statistics are protected by a lock.

A `threading.Event` coordinates shutdown.

Thread-safe GUI logging uses a queue.

That architecture separates:

- network worker threads,
- shared measurement state,
- GUI update flow.

## Thread-Safe Logging

Worker threads do not write directly into the Tkinter text widget.

Instead they enqueue formatted log messages.

The main GUI periodically drains the queue using Tkinter's scheduled callback mechanism.

This is a correct and important desktop-concurrency pattern because Tkinter UI updates should remain on the UI thread.

## Desktop Experiment GUI

`receiverGUI.py` builds a substantial Tkinter control interface.

The UI includes:

- network settings,
- DHCP/static-IP mode selection,
- IP/subnet/gateway entries,
- UDP port selection,
- thread-count selection,
- start/stop controls,
- status display,
- scrolling activity log,
- per-thread statistics selector,
- a statistics table.

The statistics table exposes:

- thread,
- start time,
- end time,
- packet count,
- MiB,
- Mbps.

This makes the experimental receiver operationally inspectable.

## Network Configuration Controls

The GUI contains platform-aware network-setting logic.

It can toggle between:

- DHCP,
- static IP configuration.

It also contains Windows-oriented interface discovery/configuration behavior through system commands.

This is evidence of system-level integration around the experiment.

The corpus does not retain machine-specific identifiers from repository environment notes.

## Oversized Packet Handling

The receiver explicitly handles an operating-system socket error corresponding to a packet larger than the configured receive size.

For that case it:

- records the event,
- counts a maximum-sized packet contribution,
- continues the burst accounting.

This is a defensive behavior for real network measurement.

## Experiment Statistics

The GUI retains statistics in memory and can display:

- all threads,
- a selected thread,
- burst-level metrics.

This is more structured than printing one throughput number at program exit.

The design supports repeated observation during experiment runs.

## Research Logging

The repository contains multiple log artifacts.

The commit history shows repeated updates to run logs and sender text in August 2025.

This indicates an iterative troubleshooting/measurement workflow.

The logs are evidence that the experiment was actively exercised.

They should not be interpreted as a standardized benchmark suite.

## Packaged Executable

The `Hybrid Approach/Paper` directory contains a large packaged GUI executable.

This provides evidence that a desktop tool was bundled for execution outside the raw Python interpreter.

Because the binary itself is a build artifact, it is not counted as source-code complexity.

The current repository does not make the exact packaging invocation the center of the research workflow.

## MATLAB Artifact

The root includes `dataHESU.m`.

This establishes MATLAB use within the repository.

It also links this work to the broader data-analysis/research tooling already present elsewhere in the portfolio.

The SDR repository is therefore not exclusively Python.

## Research-Paper Context

The final root README is a conference-paper revision checklist.

It records work still needed around:

- abstract/problem statement,
- methodology,
- throughput discrepancy,
- theoretical comparison,
- statistical analysis,
- error bars,
- literature review,
- conclusion,
- reproducibility.

Some writing-quality items are marked complete.

The checklist is evidence of active self-review and paper preparation.

It is not evidence that every unchecked research task was completed.

## Experimental Maturity Boundary

The paper checklist is especially useful because it prevents overstatement.

It explicitly indicates that, at the final repository snapshot, several research-quality tasks remained open.

The repository therefore demonstrates a substantial experimental prototype and measurement workflow.

It should not be represented as a completed peer-reviewed experimental study solely from the code.

## Relationship to NS3

The immediately preceding `NS3` repository focuses on simulation.

`SDR` shifts toward real-system traffic generation and reception.

That creates a meaningful methodological progression:

```text
ns-3 simulated WLAN
→ application-level traffic generation on real interfaces
→ receiver instrumentation
→ multithreaded measurements
→ GUI-assisted experiments
→ paper-oriented documentation
```

The root checklist even references detailed ns-3 simulation parameters as part of the paper methodology context.

This indicates the research was considering both simulation and physical/host-based experimental evidence.

## Hybrid-Approach Interpretation

The repository labels a major branch `Hybrid Approach`.

The code supports the interpretation that the project combines:

- simulation-oriented context,
- real network traffic tools,
- measured throughput,
- experimental hardware/environment characterization.

The exact scientific claim of the hybrid method should be derived from the paper itself if available.

The code alone supports the experimental architecture, not every research conclusion.

## Testing and Verification

Verification is experiment-driven.

Evidence includes:

- sender-side packet and throughput counts,
- receiver-side burst statistics,
- thread-specific measurement capture,
- repeated logs,
- screenshots,
- packaged executable use,
- iterative commits fixing receiver behavior.

The repository does not need to be described as having conventional unit tests.

Its principal verifier is real experiment execution and collected measurements.

## Failure and Robustness Handling

The source includes multiple defensive behaviors:

- socket send exception handling,
- socket timeout handling,
- oversized-datagram handling,
- controlled thread shutdown,
- validation of port/thread input,
- GUI error messages,
- network-configuration fallbacks.

These are meaningful engineering details in an experiment tool because a failed network run must be diagnosable.

## Concurrency Engineering

The code demonstrates:

- thread creation,
- daemon worker threads,
- locks,
- stop events,
- queues,
- thread joins with timeouts,
- UI-thread scheduling.

This is direct concurrency implementation.

The concurrency is tied to a practical network receiver rather than an isolated threading exercise.

## Measurement Engineering

The repository develops its own measurement path rather than delegating everything to a third-party benchmark.

That includes:

- byte counters,
- packet counters,
- timestamps,
- burst segmentation,
- MiB conversion,
- Mbps conversion,
- per-thread rows.

This gives the experiment explicit measurement semantics.

## Product Engineering

Although research-oriented, the GUI adds product-like operational features.

A user can:

- select network mode,
- configure endpoints,
- choose thread count,
- start and stop listening,
- inspect logs,
- inspect statistics.

This reduces the need to modify source for each experiment.

The bundled executable further suggests an intention to make the tool convenient to run on an experiment machine.

## Scale and Complexity

The current source tree is not huge, but the project has multiple layers:

- MATLAB data work,
- socket networking,
- concurrency,
- GUI,
- system configuration,
- experiment logging,
- packaged distribution,
- research documentation.

The commit history spans more than five months.

The complexity is therefore longitudinal and experimental rather than service-oriented.

## Skills Demonstrated

Directly supported skills include:

- Python,
- MATLAB,
- UDP sockets,
- broadcast networking,
- socket buffer tuning,
- send-rate throttling,
- multithreading,
- thread synchronization,
- thread-safe queues,
- Tkinter,
- desktop GUI engineering,
- network-interface configuration,
- throughput calculation,
- experiment instrumentation,
- logging,
- packaged desktop tooling,
- research iteration,
- experimental troubleshooting.

## Capability Developed

The project demonstrates the ability to turn a networking research question into an operational measurement tool.

That capability includes:

- generating controlled traffic,
- observing it at the receiver,
- dealing with socket-level failure modes,
- collecting quantitative metrics,
- parallelizing receivers,
- exposing controls to an experiment operator,
- packaging tooling,
- preserving logs,
- reviewing the research methodology.

This is systems experimentation rather than only scripting.

## Portfolio Evolution Context

This repository sits at an important transition in the portfolio.

Earlier projects establish:

- networking protocols,
- network simulation,
- Python data tooling.

`SDR` combines them into a research-oriented real-network measurement workflow.

It also anticipates later wireless research work where reliable experiment infrastructure becomes a major engineering concern.

## Historical Significance

Within the processed corpus, `SDR` is the first repository to strongly combine:

- real UDP traffic generation,
- multithreaded receiver measurement,
- desktop experiment controls,
- burst throughput instrumentation,
- packaged research tooling,
- explicit conference-paper revision tracking.

It is a major step toward research systems engineering.

## Sensitive-Evidence Boundary

The repository includes machine environment output containing device-specific identifiers.

Those identifiers are not reproduced in this corpus.

Only the technically relevant environment facts are used to understand the experiment context.

## Evidence Boundaries

The root paper checklist contains unresolved items.

Those are not converted into implemented features.

Archived experiment ZIPs and the GUI executable prove artifacts existed, but they are not counted as authored source logic.

The term `SDR` in the repository name should not be used to infer a specific RF front-end implementation beyond what the checked-in files show.

The direct source evidence is strongest for host-level wireless/UDP experiment tooling and measurement.

## Overall Narrative

`SDR` is a multi-month wireless experiment repository that evolves from data and network scripts into a multithreaded, GUI-operated measurement toolkit.

It demonstrates a progression from simulation-oriented networking toward real-system experimental engineering.

The strongest technical signal is the integration of:

```text
traffic generation
+ socket-level measurement
+ concurrency
+ GUI control
+ experiment logging
+ research-methodology review
```

That combination makes it one of the more systems-oriented research repositories in the processed corpus.

# Project Tags

- `individual-project`
- `research-project`
- `wireless-experimentation`
- `network-experimentation`
- `sdr-context`
- `hybrid-experiment`
- `python`
- `matlab`
- `udp`
- `udp-broadcast`
- `socket-programming`
- `socket-buffer-tuning`
- `traffic-generation`
- `send-rate-control`
- `throughput-measurement`
- `burst-measurement`
- `multithreading`
- `thread-synchronization`
- `threading-event`
- `thread-safe-queue`
- `tkinter`
- `desktop-gui`
- `network-configuration`
- `experiment-logging`
- `research-tooling`
- `packaged-executable`
- `research-methodology`
- `conference-paper-preparation`
- `experimental-troubleshooting`
