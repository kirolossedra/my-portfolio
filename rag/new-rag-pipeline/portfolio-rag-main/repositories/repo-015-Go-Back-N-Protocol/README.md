# Go-Back-N-Protocol

## Repository Identity

- Repository: 015 / 134
- Name: `Go-Back-N-Protocol`
- Repository start date: 2023-02-27
- Latest meaningful update date: 2023-02-27
- Primary type: Networking protocol simulation / educational implementation
- Technical field: Computer networking and reliable data transfer
- Application domain: Go-Back-N automatic repeat request
- Project context: Personal repository containing instructional protocol work
- Collaboration type: `individual-project`
- Primary implementation language: C++

## Collaboration and Authorship Context

The repository was uploaded in a single owner-attributed commit.

The source has two distinct evidence layers.

`GoBackN.cpp` contains a custom interactive console simulation with user-entered frame values, simulated random errors, acknowledgement output, and window retransmission behavior.

`Protocol5.cpp` contains a textbook-style event-driven Go-Back-N protocol skeleton with generic network/physical-layer and timer hooks. That file is strong evidence of hands-on exposure to the canonical protocol mechanics, while the generic scaffold is treated as instructional infrastructure rather than wholly original protocol design.

## Evidence Basis

The analysis is grounded in:

- `GoBackN.cpp`;
- `GoBackN.h`;
- `Protocol5.cpp`;
- `Protocol5.h`;
- the owner-attributed repository commit.

## What This Project Is

`Go-Back-N-Protocol` explores reliable frame transmission using a sliding-window protocol.

The repository contains:

1. an event-oriented Go-Back-N protocol implementation based around sequence numbers, sender/receiver window state, acknowledgements, and timeout retransmission;
2. a standalone console simulation that lets the user enter frames and then models successful transmissions, acknowledgement progression, a 10% error event, and retransmission of the affected window.

The project introduces the networking domain into the processed portfolio.

## Networking Model

The header defines:

- sequence numbers;
- packet structure;
- frame kinds;
- frame sequence number;
- acknowledgement number;
- payload;
- protocol event types.

Visible event types include:

- `frame_arrival`;
- `cksum_err`;
- `timeout`;
- `network_layer_ready`.

The code therefore models networking as an event-driven state process rather than a simple data-copy loop.

## Static Protocol Configuration

`GoBackN.h` defines values including:

- sender window size: 4;
- maximum sequence number: 7;
- packet size: 1024 bytes;
- buffer size: 5;
- simulated error denominator: 10;
- output delay.

These constants make the simulated protocol behavior explicit.

## Go-Back-N Window Logic

### Sender state

`Protocol5.cpp` maintains:

- `next_frame_to_send`;
- `ack_expected`;
- outbound packet buffer;
- `nbuffered`.

### Receiver state

The receiver tracks:

- `frame_expected`;
- incoming frame `r`.

### Circular sequence-number reasoning

The `between(a, b, c)` helper checks whether an acknowledgement lies inside a circular sequence-number interval.

This is important because sequence numbers wrap around at `MAX_SEQ`.

### Sending

`send_data()` constructs a frame with:

- sequence number;
- payload;
- piggybacked acknowledgement.

It then invokes the physical-layer hook and starts a timer.

## Event-Driven Protocol Loop

`protocol5()` switches on protocol events.

### Network layer ready

A packet is accepted into the sender buffer, sent, and the sender's upper window edge advances.

### Frame arrival

An in-order frame is delivered upward and the expected receive sequence advances.

Piggybacked acknowledgement state then contracts the sender window.

### Checksum error event

The event is represented explicitly in the protocol event system.

### Timeout

The sender resets `next_frame_to_send` to the oldest unacknowledged sequence and retransmits all currently buffered outstanding frames.

That is the defining Go-Back-N retransmission behavior.

## Flow Control

The network layer is enabled when sender buffering has room and disabled when the sender window is full.

This represents backpressure between the protocol and the layer above it.

## Console Simulation

`GoBackN.cpp` provides a more directly observable simulation.

### User-provided frames

The user enters:

- number of frames;
- a value for each frame.

### Simulated loss/error

For each transmission, a random number is used to produce an approximately 10% error event.

### Acknowledgement progression

Acknowledgements are printed according to window progress.

### Window retransmission

When an error occurs:

1. the error location is stored;
2. frames continue through the current window;
3. successful earlier frames receive acknowledgement output;
4. the frame index is reset to the failed frame;
5. the program prints `Retransmitting Window`;
6. transmission resumes from that point.

### Delayed output

`usleep` is wrapped as `delay_ms`, making the console simulation unfold visibly over time.

## Architecture and System Shape

```text
Network-layer packet
      ↓
Sender window / sequence state
      ↓
Frame construction
      ↓
Physical-layer abstraction
      ↓
Receiver sequence state
      ↓
Acknowledgement processing
      ↓
Sender-window contraction

timeout
   ↓
oldest unacknowledged frame
   ↓
retransmit outstanding window
```

The console version turns these ideas into a visible sequential demonstration.

## Technical Stack

### C++

C++ is used for:

- protocol structs;
- enums;
- vectors;
- console input/output;
- state variables;
- circular sequence arithmetic;
- randomized error simulation.

### POSIX `usleep`

`unistd.h` provides delayed console output for the transmission simulation.

## Verification

### Interactive Simulation

The console program makes protocol state visible through:

- frame-send messages;
- frame data;
- acknowledgement output;
- loss indication;
- retransmission output.

This provides a direct manual way to observe window behavior.

### Deterministic Protocol Structure

The event-driven `Protocol5.cpp` preserves canonical Go-Back-N invariants such as:

- bounded sender buffering;
- circular sequence numbers;
- cumulative acknowledgement handling;
- timeout-based retransmission from the oldest unacknowledged frame.

## Engineering Practices

### Explicit Protocol State

Sender and receiver state are represented through named variables tied directly to protocol concepts.

### Circular Sequence Arithmetic

The code contains a dedicated helper for wrap-around ordering rather than using ordinary linear comparisons.

### Error Simulation

The custom console path injects failures probabilistically to make retransmission behavior observable.

### Layered Abstraction Vocabulary

The instructional protocol scaffold separates:

- network layer;
- data-link framing;
- physical layer;
- timers;
- protocol events.

This provides hands-on exposure to layered networking architecture.

## Scale and Complexity

### Source Scale

The repository contains four C++/header files.

### Protocol Complexity

The central complexity comes from maintaining multiple pieces of state consistently:

- sender window;
- receiver expectation;
- sequence wrap-around;
- acknowledgements;
- buffered packets;
- timeout recovery.

### Simulation Complexity

The custom console simulation adds randomized failure and visible retransmission behavior on top of the protocol concepts.

## Skills Demonstrated

### C++

- **C++ — strong repository evidence.**
- **Structs/enums — strong evidence.**
- **Vectors — strong evidence.**
- **Console simulation — strong evidence.**

### Networking

- **Go-Back-N ARQ — strong repository evidence.**
- **Sliding-window protocols — strong evidence.**
- **Sequence numbers — strong evidence.**
- **Cumulative acknowledgements — strong evidence.**
- **Piggyback acknowledgements — strong repository evidence.**
- **Timeout retransmission — strong evidence.**
- **Sender/receiver state — strong evidence.**
- **Network-layer flow control — moderate evidence.**
- **Simulated transmission error — strong evidence.**

## Capability Developed

This repository introduces reliable networking-protocol reasoning into the processed corpus.

The key conceptual shift is from manipulating local program state to coordinating state across an unreliable communication channel.

Correctness depends on:

- ordering;
- window boundaries;
- acknowledgement meaning;
- sequence-number wrap-around;
- timeout recovery.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- a computer-networking protocol repository;
- Go-Back-N ARQ;
- sliding-window flow/reliability control;
- timeout-driven window retransmission;
- cumulative/piggyback acknowledgement logic;
- simulated transmission loss.

## Historical Significance

`Go-Back-N-Protocol` broadens the portfolio from software architecture and digital hardware into computer networking.

It provides an early point of comparison for later networking and wireless projects because fundamental reliability concepts—windows, acknowledgements, retransmission, and sequence state—appear here in explicit code.

## Overall Repository Narrative

`Go-Back-N-Protocol` is a C++ educational networking repository centered on reliable frame delivery.

One source path mirrors the canonical event-driven Go-Back-N protocol: sender and receiver state advance through sequence numbers, acknowledgements contract the sender window, and timeout events retransmit all outstanding frames from the oldest missing acknowledgement. A second console path turns the same ideas into an interactive simulation with user-entered frames, probabilistic loss, delayed transmission messages, acknowledgement output, and visible window retransmission.

Its strongest portfolio evidence is the first explicit implementation-level exposure to data-link reliability and sliding-window protocol state.

# Project Tags

## Project Type

- `networking-protocol-simulation`
- `educational-project`

## Collaboration and Authorship

- `individual-project`
- `instructional-scaffold`

## Languages

- `cpp`

## Networking

- `computer-networking`
- `go-back-n`
- `automatic-repeat-request`
- `sliding-window-protocol`
- `sequence-numbers`
- `cumulative-acknowledgements`
- `piggyback-acknowledgements`
- `timeout-retransmission`
- `network-flow-control`
- `frame-protocol`
- `simulated-packet-loss`

## Systems Engineering

- `event-driven-state-machine`
- `circular-sequence-arithmetic`
- `console-simulation`

## Testing and Verification

- `manual-simulation`
- `fault-injection-simulation`

## Portfolio Significance

- `earliest-observed-computer-networking`
- `earliest-observed-go-back-n`
- `earliest-observed-sliding-window-protocol`
- `earliest-observed-retransmission-protocol`
