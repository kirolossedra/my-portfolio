# SedraFTPVariant

## Repository Identity

- Repository: 126 / 138
- Name: `SedraFTPVariant`
- Start date: 2025-11-19
- Latest meaningful update: 2026-02-05
- Latest meaningful commit: `6d517d5a6151f8ce870baf4b38c4e7f29d30afd4`
- Primary repository language metadata: Objective-C
- Technical field: network experiment automation, FTP transfer testing, UDP orchestration, iOS and desktop tooling
- Context: research test harness for repeatable network-transfer experiments
- Collaboration type: `individual-project-with-external-components`

## Collaboration and Authorship Context

This repository combines substantial repository-specific Python and Objective-C experiment orchestration with explicitly external networking components.

The authorship boundary is important.

`Client/WhiteRaccoon.h` retains the original statement that **Valentin Radu** created WhiteRaccoon in 2011.

`Client/SimplePing.h` retains Apple's copyright and identifies itself as an Apple sample wrapping low-level BSD-socket ping behavior.

The generic `SceneDelegate` files are also carried from the preceding iOS project lineage.

Those components provide network primitives and platform support, but they should not be counted as independently authored repository-owner implementations.

The repository-specific engineering is much clearer in:

- `Client/client.py`,
- `Client/main.m`,
- `Server/server.py`,
- `Server/main.py`,
- `Server/starter.py`,
- the integration and automation that connects transfer execution, test repetition, UDP control, timing, UI state, and logging.

## What This Project Is

`SedraFTPVariant` turns FTP transfer from a manual networking operation into a controlled experiment workload.

The repository contains both client-side and server-side tools.

The client side supports:

- manual FTP downloads,
- automated repeated downloads,
- configurable test counts,
- configurable separation between trials,
- transfer timing,
- progress reporting,
- status reporting,
- UDP remote-control commands.

The server side provides FTP service and synthetic/generated content that can be consumed repeatedly without depending on a finite static test file.

The repository also contains an iOS client implementation whose UI and automation logic mirror the experiment-oriented workflow.

The result is not merely an FTP client.

It is a repeatability harness for inducing network traffic under controlled timing and observing transfer behavior.

## Evolution From the Initial Design Specification

The root README records a concrete control concept.

It describes a network-scanning controller that:

- scans a local subnet,
- identifies responsive hosts,
- represents clients in a GUI,
- sends `START_DOWNLOAD` over UDP,
- listens for completion/failure messages,
- times the transaction,
- returns each client to a ready state after completion.

The implemented repository develops the same broader idea of a control plane around network workloads.

The checked-in Python client uses explicit UDP commands:

- `START_DOWNLOAD`,
- `STOP_DOWNLOAD`,
- `START_AUTOTESTS`,
- `STOP_AUTOTESTS`.

It also has a UDP listener and a separate FTP data path.

That is a meaningful separation:

```text
UDP commands and status
        ↓
experiment-control state
        ↓
FTP workload execution
        ↓
timing / progress / result logging
```

The control channel coordinates the experiment while FTP carries the actual bulk data.

## Python Desktop Client

`Client/client.py` is a substantial Python 3 GUI application.

Its module description identifies it as:

- a Tkinter FTP client,
- an automated-test runner,
- a UDP-controlled application.

### Configurable FTP Parameters

The client exposes configuration for:

- FTP host,
- FTP port,
- username,
- password,
- remote filename,
- local save directory.

The checked-in defaults point at a private-LAN research setup.

The code uses Python's standard `ftplib.FTP`.

### Download Lifecycle

`FTPDownloader.download()` implements the transfer lifecycle.

The sequence is:

1. connect to the FTP server,
2. log in,
3. attempt to determine the remote file size,
4. begin binary retrieval,
5. write incoming chunks to a temporary `.part` file,
6. update byte-level progress,
7. atomically replace the final path when successful,
8. remove a partial file on failure.

The final rename is performed through `os.replace`.

This is a stronger transfer workflow than writing directly to the destination because an incomplete test does not masquerade as a complete file.

### Transfer Cancellation

`FTPDownloader` owns a `threading.Event`.

The transfer callback checks the stop event while chunks are being received.

A requested stop raises out of the active transfer path and is handled by the same cleanup logic.

### Structured Result

The download engine returns a `DownloadResult` dataclass carrying:

- success state,
- error text,
- bytes received,
- elapsed seconds,
- local path.

That gives the GUI and automation layer a structured result rather than requiring them to infer completion from console text.

## Tkinter UI Engineering

The desktop client contains custom-drawn Tkinter widgets rather than relying exclusively on default platform widgets.

### Rounded Buttons

`RoundedButton` is canvas-based.

It implements:

- rounded geometry,
- hover state,
- pressed state,
- disabled state,
- custom fill colors,
- border state,
- cursor changes.

### Pill Entries

`PillEntry` wraps a text entry with:

- custom rounded framing,
- focus border changes,
- placeholders,
- optional password masking,
- enabled/disabled state.

### Segmented Controls

`SegmentedChips` provides custom selection chips for preset values such as:

- test counts,
- separation intervals.

### Progress Visualization

`ModernProgress` supports:

- determinate progress,
- indeterminate animation,
- custom canvas rendering.

The UI work matters because the tool is meant to be operated repeatedly during experiments rather than run once as a command-line script.

## Concurrency and UI Isolation

Network operations must not block Tkinter's main event loop.

The repository uses:

- `threading`,
- `queue.Queue`,
- daemon threads,
- periodic Tkinter polling.

The UDP listener runs independently and posts events into a queue.

The GUI processes those events on the UI side.

This establishes a basic thread-boundary pattern:

```text
network thread
    ↓
thread-safe queue
    ↓
Tkinter polling
    ↓
UI state update
```

That prevents the background UDP receive loop from directly mutating widgets.

## UDP Control Plane

`UDPListener`:

- creates an IPv4 datagram socket,
- enables `SO_REUSEADDR`,
- binds to `0.0.0.0`,
- uses a finite socket timeout,
- decodes incoming text messages,
- places received messages into the UI queue.

The timeout allows the thread to periodically re-check its stop event rather than blocking forever inside `recvfrom`.

The client supports both inbound command reception and outbound status signaling.

This control plane is well matched to laboratory automation because the orchestration messages are tiny and independent of the FTP workload being measured.

## Automated Repetition

The Python client stores explicit experiment state including:

- whether automation is running,
- tests requested,
- tests started,
- tests completed,
- tests succeeded,
- separation interval,
- current run log path.

Preset test counts include:

- 10,
- 20,
- 50,
- 80,
- 100.

Preset separation values include:

- 10,
- 20,
- 30,
- 60 seconds.

This is direct evidence of designing for repeated trials rather than single manual transfers.

## iOS Experiment Client

`Client/main.m` contains a repository-specific UIKit FTP experiment application.

It imports WhiteRaccoon as the FTP transport but builds experiment behavior around it.

### iOS Experiment UI

The source creates controls programmatically for:

- status indicator,
- test count,
- separation interval,
- FTP host,
- username,
- password,
- start/stop automated tests,
- manual download,
- progress.

The client therefore does not depend only on a storyboard for its experimental interface.

### Automated Trial State

The Objective-C client tracks:

- total tests,
- tests started,
- tests completed,
- successful tests,
- automation-running state,
- separation interval,
- current test number.

Preset choices include:

- 10,
- 20,
- 50,
- 100 trials,
- 30-second or 60-second separation.

### Milestone Logging

The iOS client creates a timestamped milestone log file for an automated run.

It:

- generates the output filename,
- writes a header,
- writes an immediate initialization record,
- uses a serial dispatch queue for file operations,
- records the path and current test state.

This is concrete evidence of trying to make repeated mobile transfer experiments traceable rather than relying only on transient UI state.

### iOS UDP Listener

The Objective-C source also declares:

- a UDP socket,
- a dispatch queue,
- a dispatch source.

This extends the same remote-control experiment architecture into the native iOS client.

## Synthetic FTP Server

`Server/server.py` uses `pyftpdlib`.

### Virtual Generated Files

The server defines `InfiniteFile`, a file-like object that generates data as it is read.

Generated chunks include a counter/timestamp and are padded to the requested size.

The file can therefore continue producing data without storing a correspondingly large object on disk.

### Virtual Filesystem

`VirtualFS` extends `AbstractedFS`.

It advertises virtual paths including:

- `/infinite.txt`,
- `/stream.dat`.

It overrides filesystem behavior such as:

- `open`,
- `stat`,
- `isfile`,
- `listdir`,
- `lexists`.

For virtual paths, the server returns generated data and synthetic metadata.

### Why This Matters Experimentally

A synthetic effectively unbounded source is useful for throughput work because the server can maintain transfer pressure without preparing or repeatedly replacing a huge static file.

The workload becomes:

```text
FTP client requests generated object
           ↓
VirtualFS intercepts path
           ↓
InfiniteFile emits chunks
           ↓
network remains loaded until client/test stops
```

### FTP Server Configuration

The service binds to:

- `0.0.0.0`,
- TCP port `2121`.

The source configures multiple test users with read/list permissions.

That multi-user setup aligns with a laboratory environment where several clients can be assigned distinct credentials.

## External Networking Components

### WhiteRaccoon

WhiteRaccoon provides the Objective-C FTP request/stream implementation.

It remains externally attributed to Valentin Radu.

Its capabilities include download, upload, delete, directory creation/listing, queues, stream callbacks, and FTP error mapping.

Those are library capabilities available to the project, not original design claims for this repository.

### Apple SimplePing

`SimplePing` is explicitly Apple's sample implementation.

It wraps BSD-socket ICMP behavior and supports IPv4/IPv6 ping operation.

Its presence represents integration with an Apple-provided network diagnostic primitive.

## Technical Stack

### Python

Python drives:

- desktop GUI,
- FTP client behavior,
- concurrency,
- UDP command handling,
- automated test sequencing,
- synthetic FTP serving.

### Tkinter

Tkinter provides the operator-facing desktop GUI.

The project goes beyond standard widgets by implementing custom canvas-based controls.

### `ftplib`

The standard-library FTP client performs actual download operations.

### `pyftpdlib`

`pyftpdlib` provides the server framework that is extended with the virtual filesystem.

### Objective-C and UIKit

The repository includes an iOS client with a programmatically constructed UIKit interface and experiment automation state.

### Grand Central Dispatch

The Objective-C implementation uses dispatch queues for:

- UDP handling,
- serialized log output.

### UDP Sockets

UDP provides the experiment control/status channel independent of FTP bulk transfer.

## Engineering Practices Evidenced

### Separation of Control and Data Paths

UDP is used for low-volume experiment commands/status.

FTP is used for the measured bulk transfer.

That makes the control channel conceptually distinct from the workload being exercised.

### Temporary-File Safety

Desktop downloads are written to `.part` files and renamed only after successful completion.

### Thread-Safe UI Communication

Background network threads communicate with Tkinter through a queue rather than direct widget updates.

### Structured Automation State

Both desktop and iOS clients explicitly track test counts and completion state.

### Repeatability-Oriented Parameters

Trial count and inter-test separation are explicit controls.

The harness is designed to reproduce the same workload multiple times under controlled spacing.

### Server Workload Generation

The server generates transfer data dynamically.

This avoids coupling the test to a finite source-file lifecycle.

## Experimental Scale

The client is explicitly designed for repeated test sets reaching at least 100 automated runs.

The server can expose a generated stream much larger than a normal stored file.

Multiple FTP user identities are configured.

The architecture spans:

- desktop client,
- iOS client,
- UDP orchestration,
- FTP server,
- generated workload,
- logging.

This makes the project a small distributed research test system rather than a single standalone script.

## Historical Portfolio Significance

`SedraFTPVariant` is a clear evolution from the earlier FTP repositories.

The important shift is from **having an FTP implementation** to **instrumenting FTP as a repeatable experiment**.

The repository introduces or consolidates:

- explicit automated trial counts,
- remote UDP commands,
- transfer timing,
- result state,
- cross-thread GUI coordination,
- synthetic server data,
- iOS-side trial logging.

This architecture later appears again in `Apple-Publication`, where the FTP harness is reused alongside an iperf3 automation DSL and publication-analysis tools.

That cross-repository continuity is positive evidence of iterative engineering.

## Skills Demonstrated

### Network Experiment Automation

- defining repeatable workloads,
- controlling trial count,
- controlling separation intervals,
- timing transfers,
- reporting completion/failure,
- coordinating multiple hosts.

### Python Desktop Engineering

- Tkinter GUI development,
- custom widgets,
- background threading,
- queue-based event delivery,
- standard-library FTP integration.

### Server Engineering

- pyftpdlib extension,
- virtual filesystem behavior,
- synthetic data generation,
- multi-user FTP configuration.

### Native iOS Experiment Integration

- UIKit programmatic controls,
- Objective-C application state,
- GCD queues,
- UDP socket integration,
- file logging,
- external FTP-library integration.

### Network Protocol Exposure

The repository concretely works with:

- FTP,
- UDP,
- ICMP through an external Apple sample,
- IP-based LAN addressing.

## Overall Project Narrative

`SedraFTPVariant` is a research-oriented network workload harness that connects a Python desktop client, a native iOS client, a UDP experiment-control plane, and a generated-data FTP server.

Its most important engineering contribution is orchestration.

The code is organized around making transfer experiments repeatable, remotely triggerable, measurable, and recoverable across many runs.

Externally authored WhiteRaccoon and Apple SimplePing code remain clearly separated from the repository-specific experiment logic.

That provenance boundary makes the repository especially useful for RAG questions about what was integrated versus what was actually engineered around those primitives.

# Project Tags

- `python`
- `objective-c`
- `ios`
- `uikit`
- `tkinter`
- `ftp`
- `ftp-client`
- `ftp-server`
- `ftplib`
- `pyftpdlib`
- `udp`
- `udp-control-plane`
- `socket-programming`
- `threading`
- `queue-based-ui-events`
- `automated-network-testing`
- `repeated-trials`
- `transfer-timing`
- `synthetic-workload`
- `virtual-filesystem`
- `generated-streaming-data`
- `partial-file-download`
- `atomic-file-replace`
- `grand-central-dispatch`
- `experiment-logging`
- `white-raccoon`
- `apple-simpleping`
- `external-library-integration`
- `research-test-harness`
