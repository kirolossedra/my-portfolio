# Repository 082 — FlashWare

## Repository Identity

- **Repository:** `kirolossedra/FlashWare`
- **Repository start date:** 2025-05-09
- **Last meaningful update date:** 2025-05-13
- **Latest meaningful commit:** `5b91aff6900a61d135a243fb911b3b4b944a92e5`
- **Primary technical field:** desktop networking and local file transfer
- **Application domain:** peer discovery and LAN file sharing
- **Primary technologies:** Python, Tkinter, sockets, threading, PyInstaller
- **Project context:** personal desktop application
- **Collaboration classification:** `individual-project`

## Evidence Basis

The current repository contains:

- `main.py` — approximately 20 KB of Python application source,
- `FlashNet.exe` — an approximately 11 MB packaged executable,
- `README.md` — environment/setup notes for packaging with Python/Tkinter/PyInstaller.

The executable is treated as build/distribution evidence.

The Python source is the implementation evidence.

The application window identifies itself as `CyberSend v2.0` even though the repository is named `FlashWare` and the executable is named `FlashNet.exe`.

The corpus retains these naming differences rather than forcing them into one product name.

## What the Project Is

FlashWare implements a desktop peer-to-peer-style LAN file-transfer utility.

The application can:

- enumerate local IPv4 interfaces,
- calculate local networks from IP/netmask,
- scan subnet addresses,
- identify responding hosts,
- let a user select a target,
- negotiate a transfer request,
- ask the receiver to accept or decline,
- transfer the selected file over TCP,
- show scan progress,
- show transfer progress,
- support drag-and-drop file selection.

It runs both client and server behaviors inside the same desktop application.

## Major Components

The source has two clear primary classes:

- `NetworkScanner`,
- `FileTransferServer`.

A third major component, `ModernGUI`, coordinates:

- user interface,
- scanner,
- server,
- outgoing transfers,
- incoming transfer prompts,
- progress state.

This is a more structured architecture than a flat script.

## Network Interface Discovery

`NetworkScanner.get_interfaces()` uses `netifaces`.

It enumerates network interfaces and extracts IPv4 entries containing:

- address,
- netmask.

Those interfaces populate the GUI selector.

This allows the user to choose which local network to scan.

## Network Calculation

The scanner converts IPv4 addresses and masks between packed binary and integer forms.

It computes:

```text
network = ip AND netmask
```

It derives host-bit count from the mask and generates host addresses for the subnet.

This is direct subnet arithmetic rather than relying entirely on an external scanning library.

## Subnet Host Generation

The scanner calculates the number of usable host addresses from the mask.

It then yields candidate IPs across the host range.

This allows the same scanner to adapt to the selected interface's subnet size.

The design assumes a conventional host range and is most naturally suited to ordinary LAN subnets.

## Concurrent Host Scanning

The scanner uses a queue plus a fixed worker pool.

The configured worker count is:

```text
100
```

Each worker:

1. receives an IP from the queue,
2. invokes the platform ping command,
3. records a responding host,
4. increments shared progress.

A lock protects shared counters and active-device state.

This is a practical concurrency design for reducing sequential scan latency.

## Cross-Platform Ping Handling

The worker distinguishes Windows from other platforms.

It selects different command-line flags for:

- packet count,
- timeout.

That is evidence of cross-platform intent at the host-discovery layer.

The packaged `.exe` provides direct Windows distribution evidence.

The README also contains macOS-oriented Miniforge/Tkinter packaging preparation.

## Scan Progress

The `NetworkScanner` accepts a progress callback.

After each processed IP, it reports:

- processed count,
- total count.

The GUI converts that state into:

- a determinate progress bar,
- a textual percentage,
- a loader animation.

A commit specifically records adding download/transfer progress and GUI improvements.

That is product-level feedback rather than background-only scanning.

## File-Transfer Server

`FileTransferServer` starts a notification listener in a daemon thread.

It listens on a dedicated TCP notification port.

For each incoming connection it launches a request-handler thread.

The request protocol begins with a `TRANSFER_REQUEST` message containing file metadata.

The receiver can respond:

- `ACCEPT`,
- decline behavior.

Accepted requests trigger the data-receive phase.

## Two-Port Protocol

The application uses two fixed TCP ports:

- one for notification/negotiation,
- one for file data.

This separates control-plane-like transfer negotiation from the actual data stream.

Conceptually:

```text
notification connection
→ user approval
→ data connection
→ file bytes
```

This is a simple custom application protocol.

## Incoming Transfer Flow

On an accepted incoming transfer:

1. the receiver marks a transfer as active,
2. opens a listening TCP socket for data,
3. accepts the sender connection,
4. writes received byte chunks to a file,
5. updates transfer progress on the GUI thread,
6. checks received size against expected size,
7. displays success or incomplete-transfer feedback.

The implementation therefore includes explicit completeness checking based on byte count.

## Outgoing Transfer Flow

The sender path:

1. connects to the target notification port,
2. sends filename and size metadata,
3. waits for receiver response,
4. if accepted, starts transfer UI state,
5. connects to the data port,
6. streams the file,
7. updates progress.

This is a complete request/accept/send workflow.

## User-Controlled Acceptance

Incoming files are not written automatically merely because a peer connects.

The server calls back into the GUI to display a transfer prompt.

This is a meaningful product/safety control for a LAN utility.

The user participates in the decision to receive a file.

## Drag-and-Drop

The GUI inherits from `TkinterDnD.Tk`.

It registers a file-drop target and binds a drop event.

A dropped file can be sent to the currently selected device.

This is a product feature beyond a basic file-picker dialog.

## File Picker

The application also supports conventional file selection through Tkinter's file dialog.

This gives two input paths:

- file chooser,
- drag and drop.

## Desktop UI

The source creates a custom dark Tkinter interface.

It includes:

- interface selector,
- scan controls,
- stop control,
- animated loader,
- scan progress bar,
- discovered-device table,
- send button,
- transfer progress bar,
- transfer status label.

A splash screen introduces the application before the main window opens.

This is a fully interactive desktop workflow.

## Threading Architecture

Threading is used in several independent paths:

- scan worker pool,
- network scan orchestration,
- notification listener,
- per-request server handlers,
- receive data handling,
- outgoing transfers.

Daemon threads keep background networking from blocking the GUI.

Tkinter `after()` calls marshal UI updates back to the event loop in several transfer paths.

This is meaningful concurrent desktop application engineering.

## Queues and Synchronization

The network scanner uses `Queue` for work distribution.

Shared scan state uses a lock.

This is a classic producer/worker arrangement.

The architecture prevents 100 worker threads from independently generating overlapping address work.

## Error Handling

The source contains explicit error handling around:

- failed ping commands,
- socket connection failures,
- scan errors,
- invalid interface selection,
- incomplete receives,
- receive failures,
- transfer errors.

Errors are surfaced through GUI dialogs.

This is important for a network utility, where connectivity failures are expected operating conditions.

## Packaging

The repository includes `FlashNet.exe`.

The README documents preparing a Python 3.11/Tkinter environment and installing PyInstaller.

This establishes executable packaging intent.

The exact command used to build the checked-in executable is not documented in the current README, so the corpus does not invent one.

## Security Claim Boundary

The splash text says:

```text
Fast and secure file transfers
```

The checked-in source demonstrates direct TCP socket transfer.

It does not show:

- TLS,
- application-layer encryption,
- peer authentication,
- cryptographic integrity verification.

Therefore the corpus does not tag encrypted transfer or secure transport as implemented.

The UI phrase is product copy, not sufficient technical evidence.

## Protocol Robustness

The transfer protocol is intentionally simple.

The notification payload encodes:

- filename,
- filesize.

The receive side checks total bytes against expected size.

This gives basic framing/completeness semantics.

It is not a general-purpose resumable or authenticated transfer protocol.

## Testing and Verification

The repository includes a packaged executable, which is evidence that the source reached a runnable distribution artifact.

Commit history records iterative GUI/progress improvements.

The program itself has observable end-to-end workflows:

- scan,
- discover,
- select,
- request,
- accept,
- transfer,
- progress,
- completion feedback.

The corpus treats these as implementation and manual-operational verification evidence.

## Product Engineering

FlashWare has clear attention to usability.

Examples include:

- automatic interface discovery,
- progress percentage,
- stop-scan control,
- peer table,
- incoming-transfer prompt,
- file picker,
- drag and drop,
- transfer progress,
- splash screen,
- explicit errors.

These features reduce the amount of networking knowledge required from the end user.

## Systems Engineering

The application combines several system boundaries:

- OS network interfaces,
- subnet arithmetic,
- system ping,
- TCP sockets,
- filesystem I/O,
- worker threads,
- GUI event loop,
- packaged distribution.

This makes the project more systems-oriented than a typical Tkinter CRUD application.

## Scale and Complexity

The source is contained in a single Python module, but it contains multiple architectural responsibilities.

Complexity comes from coordinating:

- 100 scan workers,
- local server behavior,
- outgoing client behavior,
- UI responsiveness,
- transfer progress,
- filesystem writes.

The single-file structure is a prototype architecture.

The application behavior itself is substantive.

## Skills Demonstrated

Directly supported skills include:

- Python,
- socket programming,
- TCP,
- local-network discovery,
- IPv4 subnet arithmetic,
- network-interface enumeration,
- concurrent scanning,
- worker queues,
- thread synchronization,
- client/server design,
- custom application protocol,
- file streaming,
- filesystem I/O,
- transfer progress,
- Tkinter,
- drag-and-drop desktop UI,
- cross-platform command handling,
- executable packaging,
- PyInstaller environment setup.

## Capability Developed

The repository demonstrates the ability to turn low-level networking primitives into an end-user desktop product.

That requires solving both sides of the system:

```text
discover peers
→ choose peer
→ negotiate intent
→ transfer bytes
→ receive bytes
→ validate size
→ update UI safely
```

It also requires preventing background network work from freezing the desktop interface.

That is the core engineering achievement of the project.

## Portfolio Evolution Context

Earlier corpus repositories show:

- socket/network concepts,
- desktop GUIs,
- concurrency,
- experiment networking.

FlashWare recombines those skills into a general user-facing LAN utility.

Unlike `SDR`, whose networking is research-oriented, FlashWare is product-oriented.

This is a useful divergence:

- research networking toolkit,
- end-user file-transfer application.

## Historical Significance

Within the processed corpus, FlashWare is the earliest clear implementation of:

- LAN peer discovery,
- subnet scanning,
- a desktop file-transfer client/server,
- a transfer request/accept protocol,
- drag-and-drop network file sending,
- a packaged Python networking application.

It is also a strong example of combining OS-level operations with GUI product design.

## Evidence Boundaries

The repository's security-themed product text is not used as evidence of encryption.

The checked-in executable is treated as distribution evidence, not as additional source complexity.

The program has a simple custom LAN protocol and should not be represented as an Internet-scale file-sharing service.

## Overall Narrative

FlashWare is a desktop LAN file-transfer product built directly on Python networking primitives.

It discovers local peers, negotiates incoming transfers, streams files over TCP, tracks progress, and exposes the workflow through a responsive Tkinter interface with drag-and-drop support.

Its strongest portfolio signal is the integration of:

```text
network discovery
+ concurrency
+ client/server sockets
+ file I/O
+ GUI state
+ executable packaging
```

into one usable desktop workflow.

# Project Tags

- `individual-project`
- `desktop-application`
- `lan-file-transfer`
- `python`
- `tkinter`
- `tkinterdnd2`
- `socket-programming`
- `tcp`
- `client-server`
- `network-interface-discovery`
- `ipv4`
- `subnet-calculation`
- `subnet-scanning`
- `ping-scan`
- `multithreading`
- `worker-queue`
- `thread-synchronization`
- `custom-application-protocol`
- `transfer-negotiation`
- `file-streaming`
- `filesystem-io`
- `transfer-progress`
- `drag-and-drop`
- `desktop-gui`
- `cross-platform-command-handling`
- `pyinstaller`
- `packaged-executable`
