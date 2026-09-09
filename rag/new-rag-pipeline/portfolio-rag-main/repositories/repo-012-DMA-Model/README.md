# DMA-Model

## Repository Identity

- Repository: 012 / 134
- Name: `DMA-Model`
- Repository start date: 2023-02-19
- Latest meaningful update date: 2023-02-19
- Primary type: Integrated HDL systems model
- Technical field: Digital design, computer architecture, bus arbitration, and DMA
- Application domain: CPU / memory / peripheral data transfer
- Project context: Personal educational hardware-modeling project
- Collaboration type: `individual-project`
- Primary implementation language: Verilog

## Collaboration and Authorship Context

The repository history is owner-authored. The implementation files and the explanatory README are therefore directly attributable at repository level.

Several components reuse concepts already visible in earlier personal Verilog repositories—clock generation, keypad logic, and a MIPS-style CPU—but this repository integrates them into a larger shared-bus system.

## Evidence Basis

The analysis is grounded in:

- `DMA.v`;
- `MIPS_DMA_INTERFACE.v`;
- `DMAtb.v`;
- `IO.v`;
- `memory.v`;
- `keypad.v`;
- `CLK_ON_WIRE.v`;
- the repository README;
- owner-attributed commit history.

The README explicitly describes a simulation scenario involving a MIPS CPU, DMA requests, two I/O devices, fixed priority, memory transfers, and signal-scope observation.

## What This Project Is

`DMA-Model` is a Verilog model of a small computer system in which a CPU and a DMA controller share address, data, and control buses while servicing peripheral transfer requests.

The repository combines several earlier hardware concepts into one system-level simulation:

- a MIPS-style CPU;
- register file;
- memory;
- DMA controller;
- disk-like I/O;
- keypad input;
- clock generation;
- shared buses;
- DMA request/acknowledge lines;
- bus ownership handoff;
- fixed-priority arbitration;
- integrated timed testbench stimulus.

This makes the project significantly more system-oriented than the earlier single-CPU and small-HDL-tool repositories.

## System Scenario

The repository README describes a concrete sequence.

The CPU begins by executing a store-byte-style memory operation followed by R-format instructions.

A DMA request can arrive while the CPU is using the shared bus.

The CPU completes its active memory operation before handing control of the bus to the DMA controller.

The DMA controller then services external I/O transfers while the CPU can continue operations that do not require the shared memory bus.

Two peripheral workflows are described:

1. a disk-like I/O device transfers four values from one memory region to another;
2. a keypad request is serviced afterward through the DMA-assigned transfer path.

When simultaneous requests exist, fixed priority determines the serviced request.

## Repository Structure

```text
DMA-Model/
├── DMA.v
├── DMAtb.v
├── MIPS_DMA_INTERFACE.v
├── IO.v
├── memory.v
├── keypad.v
├── CLK_ON_WIRE.v
└── README.md
```

Each HDL file represents a distinct system component.

## Architecture and System Shape

```text
                    ┌─────────────┐
                    │  MIPS CPU   │
                    │             │
                    │ HRQ / HLDA  │
                    └──────┬──────┘
                           │ bus ownership
                           ↓
         ┌──────────────────────────────────┐
         │ Shared Address/Data/Control Bus │
         └───────┬─────────────┬───────────┘
                 │             │
          ┌──────▼─────┐ ┌────▼────┐
          │   Memory   │ │   DMA   │
          └────────────┘ └────┬────┘
                              │
                     DREQ / DACK channels
                       ┌──────┴──────┐
                       │             │
                 ┌─────▼────┐  ┌────▼─────┐
                 │ Disk I/O │  │  Keypad  │
                 └──────────┘  └──────────┘
```

The central engineering idea is that multiple masters/devices coordinate access to shared buses.

## Technical Stack

### Verilog

Verilog models:

- synchronous state changes;
- inout buses;
- tri-state ownership;
- one-hot request/acknowledge signaling;
- fixed-priority arbitration;
- register/memory arrays;
- CPU instruction decoding;
- integrated testbench stimulus.

### HDL Simulation

`DMAtb.v` wires the system together and applies timed changes to peripheral enable signals.

The README also includes signal-scope imagery documenting the simulated behavior.

## DMA Controller

`DMA.v` exposes:

- `CLK`;
- `HLDA`;
- four `DREQ` inputs;
- shared data bus `DB`;
- shared address bus `AB`;
- shared control bus `CB`;
- `HRQ`;
- four `DACK` outputs.

### Bus ownership

Address and control buses are conditionally driven when `HLDA` is asserted.

Otherwise the outputs use high-impedance values.

This is direct evidence of tri-state shared-bus modeling.

### DMA request detection

Any asserted request can raise `HRQ`, asking the CPU to release control.

### Fixed-priority arbitration

The controller checks request channels in priority order.

`DREQ[0]` receives the highest priority, followed by later channels.

Each accepted channel maps to a one-hot `DACK` value.

### Transfer progression

The controller uses a transfer counter and control-register state to advance transfer behavior and release acknowledgements.

## CPU / DMA Interface

`MIPS_DMA_INTERFACE.v` contains a register file and MIPS-style CPU model.

The CPU shares `DB`, `AB`, and `CB`.

For the modeled memory-write operation, it drives:

- an address value;
- a data value;
- a control code.

For other cases, those bus outputs are high impedance.

### Bus handoff

The CPU accepts a hold/request input and produces `HLDA`.

The logic checks bus-use conditions before acknowledging DMA ownership.

This introduces explicit bus-master coordination into the processor model.

### CPU behavior

The file also retains:

- program counter;
- instruction memory;
- data memory;
- register file;
- opcode/function decoding;
- arithmetic and logical operations;
- load/store-like operations.

## Integrated Testbench

`DMAtb.v` is the top-level integration harness.

It instantiates:

- clock generator;
- disk-like `IO`;
- memory;
- DMA controller;
- keypad;
- MIPS CPU.

It wires the components onto common:

- data bus;
- address bus;
- control bus;
- DMA request lines;
- DMA acknowledge lines;
- hold request / hold acknowledge lines.

### Timed stimulus

The testbench:

- initializes peripheral enables;
- assigns a keypad value;
- enables disk I/O;
- later disables disk I/O;
- enables the keypad request.

This provides a concrete system-level simulation sequence rather than an isolated module test.

## Peripheral Integration

### Disk-Like I/O

The README describes DMA-mediated memory copying on behalf of an I/O device.

### Keypad

The keypad acts as another DMA-requesting peripheral and presents a key value through the shared data path.

### Memory

The memory module sits on the common address/data/control bus and participates in DMA-driven transfers.

## Verification

### Integrated HDL Testbench

`DMAtb.v` is a system-level testbench that brings CPU, DMA, memory, and two peripheral devices into one simulation.

### Timed Multi-Device Stimulus

Peripheral enable signals are changed at controlled simulation times to exercise arbitration and bus ownership.

### Signal-Scope Verification

The README contains a signal-scope screenshot and explains the expected transfer sequence.

This is direct evidence of waveform/state inspection during hardware-model verification.

## Engineering Practices

### Component Decomposition

CPU, DMA, memory, peripherals, clock generation, and the top-level testbench are stored as distinct HDL modules/files.

### Shared Interface Modeling

The system uses explicit address, data, and control buses rather than passing abstract high-level values between modules.

### Arbitration Logic

Request handling is encoded as a deterministic fixed-priority policy.

### Bus Ownership Control

High-impedance values and HLDA-based drive conditions model who may actively control the shared bus.

### Integration Before Observation

The top-level testbench validates interactions among multiple modules, making verification more system-oriented than the earlier single-module HDL exercises.

## Scale and Complexity

### Implementation Scale

The repository is still small in source volume but spans several interconnected hardware components.

### System Scale

The key scale increase is integration:

- one CPU;
- one DMA controller;
- shared memory;
- multiple I/O devices;
- several request/acknowledge channels;
- shared buses;
- system-level testbench.

### Conceptual Complexity

The project requires reasoning about:

- bus masters;
- arbitration;
- synchronization;
- request/acknowledge handshakes;
- tri-state buses;
- memory transfers;
- CPU execution;
- peripheral coordination.

## Skills Demonstrated

### Hardware Description

- **Verilog — strong evidence.**
- **Sequential logic — strong evidence.**
- **Tri-state bus modeling — strong evidence.**
- **Shared-bus interfaces — strong evidence.**
- **Multi-module integration — strong evidence.**

### Computer Architecture

- **MIPS-style CPU modeling — strong recurring evidence.**
- **Register file — strong evidence.**
- **Memory operations — strong evidence.**
- **CPU bus ownership — strong evidence.**

### DMA and Bus Systems

- **DMA controller modeling — strong evidence.**
- **Fixed-priority arbitration — strong evidence.**
- **DMA request/acknowledge — strong evidence.**
- **HRQ/HLDA handoff — strong evidence.**
- **Peripheral-to-memory transfer orchestration — strong evidence.**

### Verification

- **Integrated HDL testbench — strong evidence.**
- **Timed simulation stimulus — strong evidence.**
- **Manual signal-scope verification — strong evidence.**

## Capability Developed

Relative to the earlier Verilog repositories, the project moves from individual components toward **system integration**.

The important new capability is coordination.

Correct behavior now depends on several modules agreeing about:

- when a bus is owned;
- which requester wins;
- which component may drive shared signals;
- how transfer progress is represented;
- when control returns to the CPU.

That is a systems-engineering step beyond modeling isolated datapath operations.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- a DMA controller;
- fixed-priority bus arbitration;
- CPU/DMA hold-request and hold-acknowledge coordination;
- integrated CPU + DMA + memory + peripheral simulation;
- multi-channel DMA requests;
- system-level shared address/data/control bus modeling.

Verilog continues, but the abstraction level moves upward from components toward an interacting computer system.

## Historical Significance

`DMA-Model` is an early systems-integration milestone in the hardware portion of the portfolio.

It connects previous MIPS and peripheral work into a shared-bus environment with arbitration and ownership transfer.

That makes it useful later when tracking the transition from digital-design exercises toward increasingly integrated systems reasoning.

## Overall Repository Narrative

`DMA-Model` is a Verilog simulation of a CPU-centered system where direct memory access changes who controls shared buses.

A MIPS-style CPU, DMA controller, memory, disk-like I/O, and keypad communicate through explicit address, data, and control lines. DMA requests are prioritized, the CPU participates in a hold-request/acknowledge handshake, bus drivers enter high impedance when another component owns the interface, and a top-level testbench creates a timed disk-then-keypad scenario.

The repository's strongest portfolio evidence is therefore hardware systems integration: bus arbitration, shared-resource coordination, DMA handshakes, multi-module simulation, and waveform-based verification.

# Project Tags

## Project Type

- `integrated-hdl-system`
- `computer-architecture-exercise`
- `educational-project`

## Collaboration and Authorship

- `individual-project`

## Languages

- `verilog`

## Embedded and Hardware

- `digital-design`
- `sequential-logic`
- `tri-state-bus`
- `shared-bus`
- `dma-controller`
- `fixed-priority-arbitration`
- `dma-request-acknowledge`
- `hold-request-acknowledge`
- `bus-ownership`
- `mips-architecture`
- `register-file`
- `data-memory`
- `peripheral-interface`
- `keypad-interface`
- `memory-interface`
- `multi-module-hdl`

## Systems Engineering

- `hardware-system-integration`
- `shared-resource-arbitration`
- `cpu-dma-integration`
- `peripheral-memory-transfer`

## Testing and Verification

- `hdl-simulation`
- `hdl-testbench`
- `integration-testbench`
- `timed-stimulus`
- `manual-waveform-verification`

## Portfolio Significance

- `earliest-observed-dma-controller`
- `earliest-observed-bus-arbitration`
- `earliest-observed-cpu-dma-integration`
- `earliest-observed-integrated-hdl-system`
