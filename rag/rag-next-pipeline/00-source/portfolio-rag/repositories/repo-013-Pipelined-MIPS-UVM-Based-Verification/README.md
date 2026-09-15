# Pipelined-MIPS-UVM-Based-Verification

## Repository Identity

- Repository: 013 / 134
- Name: `Pipelined-MIPS-UVM-Based-Verification`
- Repository start date: 2023-02-25
- Latest meaningful update date: 2023-02-27
- Primary type: Pipelined processor HDL model
- Technical field: Computer architecture and SystemVerilog
- Application domain: Five-stage MIPS-style processor pipeline
- Project context: Personal educational hardware-modeling project
- Collaboration type: `individual-project`
- Primary implementation language: SystemVerilog

## Collaboration and Authorship Context

The visible repository commits are owner-authored, supporting personal attribution of the SystemVerilog pipeline implementation.

The analysis follows the implementation itself as the evidence source. The repository name reflects a broader verification direction, while the current committed implementation provides concrete evidence of the pipeline design and its simulation harness.

## Evidence Basis

The repository contains only:

- `PipelinedMIPS.sv`;
- `README.md`.

`PipelinedMIPS.sv` contains the processor design, stage state, pipeline-register structures, memories, clock generator, and testbench.

The README records a development checklist and marks the design as having reached an error-free compilation/design state.

## What This Project Is

This repository implements a MIPS-style processor as a five-stage SystemVerilog pipeline.

The design represents the classic stages:

1. Instruction Fetch;
2. Instruction Decode;
3. Execute;
4. Memory;
5. Write Back.

Instead of modeling each instruction as one monolithic procedural operation, information is carried between stages through explicit pipeline-register structures.

This is a significant architectural progression from the earlier simplified MIPS Verilog model.

## Architecture and System Shape

```text
Program Memory
      ↓
┌──────────────┐
│ IF           │
└──────┬───────┘
       ↓ IF/ID register
┌──────────────┐
│ ID           │
│ decode + RF  │
└──────┬───────┘
       ↓ ID/EX register
┌──────────────┐
│ EX           │
│ ALU / branch │
└──────┬───────┘
       ↓ EX/MEM register
┌──────────────┐
│ MEM          │
│ data memory  │
└──────┬───────┘
       ↓ MEM/WB register
┌──────────────┐
│ WB           │
│ register RF  │
└──────────────┘
```

## Technical Stack

### SystemVerilog

The source uses SystemVerilog-specific constructs including:

- `logic`;
- `always_ff`;
- `typedef enum`;
- `typedef struct`;
- typed pipeline-stage state;
- structured pipeline registers.

This is the earliest processed repository where SystemVerilog is the primary implementation language.

### `$readmemh`

Program memory, data memory, and register-file arrays are initialized from external memory files through `$readmemh`.

The source also assigns a small set of hard-coded initial instructions and register values for simulation.

## Pipeline Stage Representation

The design defines a `PIPELINE_STAGE` enum:

- `IF_STAGE`;
- `ID_STAGE`;
- `EX_STAGE`;
- `MEM_STAGE`;
- `WB_STAGE`.

A stage variable advances through the five stages.

This makes pipeline phase state explicit and typed.

## Pipeline Registers

Dedicated structs represent inter-stage state.

### IF/ID

Carries:

- program counter;
- instruction.

### ID/EX

Carries fields including:

- ALU operation selector;
- opcode;
- `rs`;
- `rt`;
- `rd`;
- destination register;
- shift amount;
- function code;
- immediate;
- program counter;
- source register data;
- write-data selection;
- ALU result field.

### EX/MEM

Carries:

- ALU operands/results;
- shift;
- program counter;
- `rt` data;
- memory data;
- destination register;
- write-data selection.

### MEM/WB

Carries:

- memory data;
- ALU result;
- program counter;
- destination register;
- write-data selection.

These explicit inter-stage structures are the core architectural feature of the repository.

## Instruction Fetch

The design:

- increments the program counter;
- reads an instruction from program memory;
- stores instruction and PC state into the IF/ID pipeline register.

## Instruction Decode

The decode stage extracts:

- opcode;
- source registers;
- destination register;
- shift amount;
- function field;
- immediate.

It reads values from the register-file array and sets internal control selectors.

R-format, jump-style, and other opcode families are separated through decode logic.

## Execute Stage

The execute stage selects ALU operands from:

- register data;
- immediate values;
- shift values.

Immediate values are sign-extended in the implemented path.

Visible operations include:

- addition;
- subtraction;
- bitwise AND;
- bitwise OR;
- set-less-than;
- multiply-like behavior in one opcode/function branch.

The stage also calculates next-PC values for branch-like behavior.

## Memory Stage

The memory stage reads or writes `data_memory` using the ALU-derived address and carries results forward into MEM/WB state.

## Write-Back Stage

The write-back stage selects an ALU or memory-derived value and stores it into the register-file array.

This closes the explicit five-stage flow.

## Processor State

The implementation contains:

- 1024-word program memory;
- 1024-word data memory;
- 32-entry register file;
- program counter;
- ALU signals;
- typed pipeline registers.

## Clock and Simulation Harness

The file includes a `clock_Gen` module that toggles the clock every five simulation units.

`CPU_tb` instantiates:

- the clock;
- the `Pipeline` module.

This gives the design an executable HDL simulation entry point.

## Verification

### HDL Testbench

The `CPU_tb` module provides direct simulation instantiation.

### Memory Initialization

`$readmemh` and hard-coded starting values provide deterministic initial program/register state for simulation work.

### Compilation / Design Stabilization

The repository checklist marks the design as having reached an error-free state, providing repository-level evidence of syntax/elaboration-oriented stabilization during development.

## Engineering Practices

### Typed Architectural State

Enums and structs make stage and pipeline-register state explicit rather than representing all control/data as unrelated primitive signals.

### Pipeline Decomposition

Instruction processing is separated into fetch, decode, execute, memory, and write-back responsibilities.

### Inter-Stage State Modeling

Each boundary carries only the state needed by downstream stages through dedicated structures.

### External Memory Initialization

Memory-file loading provides a reproducible way to seed program/data/register state for simulation.

### Modular Simulation Entry Point

Clock generation and testbench instantiation are separated into dedicated modules.

## Scale and Complexity

### Source Scale

The repository is only two files, with almost all implementation in one SystemVerilog source.

### Architectural Scale

The model spans:

- instruction fetch;
- decode;
- register access;
- ALU execution;
- program-counter logic;
- data memory;
- write back;
- multiple inter-stage structures.

### Conceptual Complexity

The key complexity increase is temporal overlap and state transfer between pipeline stages.

The programmer must reason about what information belongs at each stage boundary rather than only the semantics of one instruction operation.

## Skills Demonstrated

### SystemVerilog

- **SystemVerilog — strong evidence.**
- **`logic`-based signal modeling — strong evidence.**
- **`always_ff` sequential logic — strong evidence.**
- **Enums — strong evidence.**
- **Structs — strong evidence.**

### Computer Architecture

- **Five-stage MIPS pipeline — strong evidence.**
- **Pipeline registers — strong evidence.**
- **Instruction decoding — strong evidence.**
- **Register-file modeling — strong evidence.**
- **ALU operation selection — strong evidence.**
- **Memory stage — strong evidence.**
- **Write-back stage — strong evidence.**
- **Program-counter logic — strong evidence.**

### Verification

- **HDL simulation harness — moderate-to-strong evidence.**
- **Clock generator — strong evidence.**
- **Deterministic memory initialization — strong evidence.**

## Capability Developed

This repository transforms the earlier MIPS work from a compact instruction-execution model into an explicitly staged architecture.

The major capability developed is reasoning about **state across time and stage boundaries**.

Enums define the pipeline phase, structs bundle stage-specific data, and explicit IF/ID, ID/EX, EX/MEM, and MEM/WB structures preserve the values required as instructions progress.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- SystemVerilog;
- a five-stage processor pipeline;
- explicit pipeline-register structs;
- SystemVerilog enums for architectural state;
- SystemVerilog `always_ff`;
- `$readmemh`-based processor memory initialization.

The hardware thread progresses from:

```text
simple CPU model
    ↓
reusable HDL utilities
    ↓
CPU/DMA system integration
    ↓
five-stage pipelined processor
```

## Historical Significance

This repository marks the point where the portfolio's computer-architecture work becomes explicitly pipelined and adopts SystemVerilog language features designed for clearer hardware modeling.

It provides a useful baseline for later questions about HDL sophistication and verification-oriented design structure.

## Overall Repository Narrative

`Pipelined-MIPS-UVM-Based-Verification` contains a personally authored SystemVerilog five-stage MIPS-style pipeline.

The design represents stage identity with an enum, carries state across IF/ID, ID/EX, EX/MEM, and MEM/WB structs, initializes program/data/register memories, performs instruction decode and ALU work, accesses data memory, and writes results back to the register file. A clock module and testbench make the model executable in simulation.

Its strongest corpus value is the transition from basic Verilog processor modeling to structured SystemVerilog architecture with explicit pipeline boundaries.

# Project Tags

## Project Type

- `pipelined-processor-model`
- `computer-architecture-exercise`
- `educational-project`

## Collaboration and Authorship

- `individual-project`

## Languages

- `systemverilog`

## Embedded and Hardware

- `digital-design`
- `sequential-logic`
- `mips-architecture`
- `five-stage-pipeline`
- `pipeline-registers`
- `instruction-decoding`
- `register-file`
- `program-counter`
- `instruction-memory`
- `data-memory`
- `alu-operations`
- `memory-stage`
- `writeback-stage`
- `systemverilog-structs`
- `systemverilog-enums`
- `always-ff`
- `readmemh`

## Testing and Verification

- `hdl-simulation`
- `hdl-testbench`
- `clock-generator`
- `deterministic-memory-initialization`

## Portfolio Significance

- `earliest-observed-systemverilog`
- `earliest-observed-five-stage-pipeline`
- `earliest-observed-pipeline-registers`
