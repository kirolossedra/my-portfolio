# Repository 085 — BroadcastInAndroid

## Repository Identity

- **Repository:** `kirolossedra/BroadcastInAndroid`
- **Corpus index:** 085
- **Repository start date:** 2025-05-31
- **Last meaningful update date:** 2025-06-20
- **Latest meaningful commit:** `dd86e38cca89ae1820b296e1fff1076516d21b0e`
- **Primary repository language:** Kotlin
- **Project form:** Android UDP networking experiment
- **Collaboration classification:** `individual-project`
- **Repository variants:** root prototype, `Unicast`, and `Broadcast`

## Evidence Basis

The repository history and recursive tree show an initial root implementation followed by explicit unicast and broadcast variants.

Substantive files include:

- root `MainActivity.kt`;
- root `Manifest.xml`;
- `Unicast/MainActivity.kt`;
- `Unicast/AndroidManifest.xml`;
- `Broadcast/MainActivity.kt`;
- `Broadcast/AndroidManifest.xml`.

The subdirectory READMEs are effectively empty.

The implementation therefore provides the primary evidence.

The newest `Broadcast/MainActivity.kt` is the largest variant and contains a mode selector that can switch between unicast and broadcast behavior.

## What the Project Is

BroadcastInAndroid is an Android-native UDP receiver experiment.

It explores receiving local-network datagrams directly from a phone/tablet application.

The repository evolves across versions.

A simpler unicast receiver binds to all local interfaces.

A later variant introduces a UI mode selector and a broadcast-specific bind path.

The application also measures burst throughput.

It displays network-interface addresses and received messages in a scrolling log.

This is not an Android `BroadcastReceiver` system-event project.

The word “broadcast” refers to UDP/IP broadcast traffic.

That distinction is important for retrieval.

## Project Scope

The implemented scope is local UDP reception on Android, with explicit unicast/broadcast modes, runtime network diagnostics, and lightweight throughput observation.

The repository does not implement a messaging backend, Android framework broadcast-intent system, reliable transport, or a production network-monitoring suite.

## Evolution Across Repository Variants

### Root Prototype

The repository began with a root-level Kotlin activity and manifest.

This establishes the initial Android networking experiment.

### Unicast Variant

`Unicast/MainActivity.kt` implements a dedicated UDP unicast receiver.

It binds a `DatagramSocket` to:

```text
0.0.0.0:<port>
```

The socket is configured with broadcast disabled.

The receiver:

- validates the port;
- starts work on `Dispatchers.IO`;
- blocks on datagram receives;
- decodes packet bytes to text;
- displays sender address/port;
- updates UI on the main thread.

### Broadcast / Unified Variant

`Broadcast/MainActivity.kt` adds an explicit `ListenMode`.

Modes are:

- `UNICAST`
- `BROADCAST`

The UI presents buttons for selecting the mode.

The broadcast path uses a configured broadcast address.

The socket `broadcast` flag is toggled according to mode.

The same application now exposes both behaviors from one activity.

## Android Architecture

The repository uses a single `Activity`.

The UI is constructed programmatically in Kotlin.

There is no XML layout file in the inspected tree.

The activity creates:

- title;
- mode selector;
- port input;
- start button;
- stop button;
- clear button;
- status bar;
- scrollable message log.

This makes the code self-contained but concentrates UI and networking concerns in one class.

## Concurrency Model

Network receiving is not performed on the Android main thread.

The code launches a coroutine scope on `Dispatchers.IO`.

A `Job` reference is retained.

The activity uses a main-thread `Handler` to update views safely.

The receive loop checks coroutine activity and a `listening` flag.

Stopping the receiver:

- clears the flag;
- cancels the job;
- updates visible state.

`onDestroy` also stops the receiver.

This is meaningful Android concurrency and lifecycle awareness.

## UDP Socket Behavior

The implementation uses:

- `DatagramSocket`;
- `DatagramPacket`;
- `InetAddress`;
- `NetworkInterface`.

The unicast mode binds to all local IPv4 interfaces.

The broadcast mode binds using the configured broadcast address.

The source sets the socket broadcast property for the broadcast mode.

The receive buffer is finite and packet-oriented.

Each datagram is processed independently.

There is no TCP connection establishment.

There is no reliable transport layer implemented.

## Network Interface Discovery

On startup, the application enumerates host network interfaces.

It iterates IPv4 addresses.

Loopback addresses are excluded.

IPv6 addresses are skipped by filtering addresses containing a colon.

The UI displays addresses and interface names.

This is useful for local-network testing because the operator can see which device IP is active.

## Port Validation

The input is parsed as an integer.

The application enforces the valid UDP/TCP port range:

```text
1..65535
```

Invalid input triggers:

- status feedback;
- a shake animation.

The port control is disabled while actively listening.

## Throughput Measurement

The larger broadcast-capable variant adds throughput state.

It tracks:

- received bytes;
- packet count;
- burst start time;
- pending throughput state.

The UI includes formatted throughput output in Mbps.

The throughput message also exposes:

- packet count;
- approximate kilobytes;
- burst duration.

This turns the app from only a text receiver into a lightweight traffic-observation tool.

The code measures application-observed receive volume.

It should not be treated as a full wireless PHY benchmark.

## UI Engineering

The application is more styled than a bare Android networking proof.

It implements:

- status-color transitions;
- button-state transitions;
- mode-specific color treatment;
- scroll-to-latest behavior;
- message-entry animation;
- shake feedback;
- readable monospaced log text.

The unified variant uses `GradientDrawable` to build button visuals programmatically.

The screen state communicates whether the receiver is:

- ready;
- listening;
- stopped;
- failed to bind.

## Architecture / System Shape

```text
Android Activity
   |
   +-- Programmatic UI
   |
   +-- Mode / port validation
   |
   +-- Coroutine on Dispatchers.IO
   |      |
   |      +-- DatagramSocket
   |      +-- DatagramPacket receive loop
   |
   +-- throughput counters
   |
   +-- Handler(Looper.getMainLooper())
          |
          +-- status
          +-- message log
          +-- throughput display
```

There is no backend.

There is no persisted database.

There is no remote API integration.

The phone itself acts as the UDP receiving endpoint.

## Technical Stack

- Kotlin
- Android SDK
- Android `Activity`
- Kotlin coroutines
- Java networking APIs
- UDP
- DatagramSocket
- DatagramPacket
- NetworkInterface
- Handler / Looper
- programmatic Android UI

## Android Manifest Concerns

The repository includes manifest files for the variants.

The presence of separate manifests supports standalone Android experiments.

The inspected application behavior requires network access.

The corpus should treat manifest configuration as application integration evidence.

It should not infer Play Store packaging or signed-release distribution.

## Major Engineering Work

### 1. Native UDP Receiver

The source implements direct socket receiving on Android rather than relying on a web view or external library.

### 2. Off-Main-Thread Networking

Blocking receive behavior is moved to an IO coroutine.

This avoids performing network work directly on the UI thread.

### 3. Thread-Safe UI Updates

Main-thread UI updates are routed through a `Handler`.

This addresses Android's UI-thread constraints.

### 4. Mode Evolution

The project evolves from a single unicast mode into a selectable unicast/broadcast receiver.

That is architectural iteration based on network semantics.

### 5. Local Network Diagnostics

Interface and IPv4 address enumeration provides immediate environment information.

### 6. Throughput Instrumentation

The later version collects burst-level receive metrics.

This connects application-level network traffic with a simple performance observation.

### 7. Lifecycle Cleanup

The receiver is stopped on activity destruction.

The job is explicitly canceled.

This reduces the risk of a receive task living beyond the activity.

## Testing & Verification Evidence

No Android instrumented tests are checked in.

No JVM unit tests are visible.

No CI workflow is visible.

No Gradle project structure is present in the inspected tree.

No automated network test harness is present.

Verification appears manual and device/network oriented.

Runtime diagnostic evidence includes:

- visible device IPs;
- bind success/failure reporting;
- source address display;
- receive-loop logging;
- throughput output.

These help the operator validate behavior.

They are not formal regression tests.

## Engineering Discipline

Positive evidence:

- port validation;
- explicit listening state;
- lifecycle cleanup;
- coroutine cancellation;
- UI-thread boundary handling;
- error reporting;
- network-interface introspection;
- separation of unicast and broadcast experiments;
- later consolidation with a mode abstraction.

Constraints:

- single large activity;
- hard-coded broadcast address in the inspected version;
- no configuration abstraction;
- no dependency/build files in repository tree;
- no automated tests;
- no packet-sequence validation;
- no loss/reordering metrics;
- no persisted experiment output;
- no IPv6 support in visible interface display;
- no runtime subnet-derived broadcast calculation.

## Product Engineering

The project has user-facing controls, but its primary character is experimental tooling.

It provides an operator with:

- mode selection;
- port selection;
- start/stop;
- clear;
- network-address visibility;
- real-time received-message display;
- throughput feedback.

That makes it usable as a small network diagnostic application.

It is not evidence of a consumer messaging product.

## Scale and Complexity

File count is small.

The `Broadcast/MainActivity.kt` file is substantial.

Complexity comes from combining:

- Android lifecycle;
- coroutines;
- blocking network I/O;
- UDP semantics;
- multiple listening modes;
- throughput tracking;
- dynamic UI state.

This is integration complexity rather than distributed-system scale.

## Skills Demonstrated

Evidence supports:

- Kotlin;
- Android development;
- Android lifecycle;
- programmatic UI construction;
- Kotlin coroutines;
- threading boundaries;
- UDP socket programming;
- unicast;
- IP broadcast;
- network-interface enumeration;
- IPv4 handling;
- port validation;
- throughput measurement;
- runtime diagnostics;
- UI animation/state feedback.

## What Was Learned / Capability Developed

The repository demonstrates moving low-level socket experimentation onto Android.

It forces coordination between two very different execution models:

- blocking network I/O;
- single-threaded UI interaction.

The later mode selector also demonstrates that “unicast vs broadcast” is not only a conceptual networking distinction.

It changes address binding and socket behavior.

## Portfolio Evolution Context

Earlier corpus networking work included protocol simulation, ns-3 experimentation, desktop sockets, and LAN file transfer.

This repository brings network experimentation to a mobile platform.

It is particularly relevant as a bridge between:

- networking fundamentals;
- Android application development;
- performance observation.

## Historical Significance

Within the processed corpus this is the earliest observed project clearly centered on:

- Kotlin;
- native Android socket programming;
- UDP receive behavior on Android;
- Android coroutine-based network reception.

It broadens the platform dimension of the networking portfolio.

## Limitations and Missing Evidence

No evidence supports:

- packet encryption;
- authentication;
- reliable transport;
- multicast;
- TCP;
- IPv6 reception;
- packet-loss measurement;
- jitter measurement;
- latency measurement;
- production deployment;
- Play Store release;
- formal throughput methodology.

The project calls a directory `Broadcast`, and the source explicitly manipulates UDP broadcast behavior.

That is sufficient for the broadcast tag.

It should not be confused with Android framework broadcast intents.

## Overall Narrative

BroadcastInAndroid is a focused native mobile networking experiment.

The engineering challenge is not only receiving UDP.

It is receiving UDP correctly within Android lifecycle and threading constraints while keeping the UI responsive and observable.

The repository's progression from a simple receiver to a mode-aware, throughput-reporting tool demonstrates iterative experimentation rather than a single code dump.

# Project Tags

- `individual-project`
- `kotlin`
- `android`
- `android-sdk`
- `mobile-application`
- `udp`
- `udp-unicast`
- `udp-broadcast`
- `datagram-socket`
- `socket-programming`
- `network-interface-discovery`
- `ipv4`
- `kotlin-coroutines`
- `dispatchers-io`
- `android-handler`
- `android-lifecycle`
- `programmatic-android-ui`
- `port-validation`
- `throughput-measurement`
- `network-diagnostics`
- `runtime-logging`
- `earliest-observed-kotlin`
- `earliest-observed-android-udp-receiver`
