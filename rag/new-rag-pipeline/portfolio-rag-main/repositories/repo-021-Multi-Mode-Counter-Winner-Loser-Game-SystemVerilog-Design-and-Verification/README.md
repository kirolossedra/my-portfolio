# Multi-Mode-Counter-Winner-Loser-Game-SystemVerilog-Design-and-Verification

## Repository Identity

- Repository: 021 / 134
- Name: `Multi-Mode-Counter-Winner-Loser-Game-SystemVerilog-Design-and-Verification`
- Repository start date: 2023-03-23
- Latest meaningful update date: 2023-04-17
- Primary type: SystemVerilog design-and-verification exercise
- Technical field: Digital design and HDL verification
- Application domain: Multi-mode counter game with winner/loser scoring
- Project context: Personal educational hardware project
- Collaboration type: `individual-project`
- Primary implementation language: SystemVerilog

## Collaboration and Authorship Context

The visible repository commits are owner-attributed, including the final expansion of the testbench on April 17, 2023.

The design, README test plan, and self-checking simulation logic are therefore treated as personally attributable repository work.

## Evidence Basis

The repository contains two central files:

- `GameDesign.sv`;
- `README.md`.

`GameDesign.sv` contains both:

- the `MMC_Game` design-under-test;
- the `MMTB_Final` testbench.

The README documents concrete test scenarios, input values, control sequences, and expected winner/loser outcomes.

The final commit materially expands the testbench with additional result checks and pass/fail reporting.

## What This Project Is

This repository implements and verifies a small stateful game around a three-bit multi-mode counter.

The counter can:

- increment by 1;
- increment by 2;
- decrement by 1;
- decrement by 2;
- initialize from a supplied value;
- reset.

Landing on one boundary produces a `winner` event, while landing on the other produces a `loser` event.

Each event increments a corresponding score counter.

When either score reaches the configured winning score, the design asserts `gameover` and reports which side won.

The repository combines functional design and explicit simulation verification in one SystemVerilog source.

## Design Interface

`MMC_Game` exposes:

### Inputs

- `clk`;
- `rst`;
- two-bit `ctrl`;
- `init`;
- three-bit `init_val`.

### Outputs

- three-bit `count`;
- `winner`;
- `loser`;
- `gameover`;
- two-bit `who`.

The interface therefore exposes both the immediate counter state and higher-level game outcome state.

## Symbolic Control Definitions

The source defines macros for control and outcome values.

Examples include:

- `UP_1`;
- `UP_2`;
- `DW_1`;
- `DW_2`;
- `LOSER_WON`;
- `WINNER_WON`;
- `WIN_SCORE`.

Named definitions make the testbench and design easier to read than repeated raw bit patterns.

## Counter Modes

### Increment by 1

`UP_1` advances the counter one step and wraps from the maximum value back to the minimum.

### Increment by 2

`UP_2` advances two steps with special handling around the upper edge.

### Decrement by 1

`DW_1` decrements one step and wraps the minimum back to the maximum.

### Decrement by 2

`DW_2` decrements two steps with explicit edge cases near the lower boundary.

These modes deliberately create different visitation patterns over the counter states.

That visitation behavior is what drives winner/loser scoring.

## Initialization

When `init` is asserted, the current count is loaded from `init_val`.

This lets the verification scenarios start from controlled states rather than always beginning from zero.

## Reset Behavior

An asynchronous reset path initializes major state including:

- counter value;
- winner/loser outputs;
- game-over state;
- winner identity state;
- score counters.

The testbench contains a dedicated reset check that verifies the count returns to zero.

## Round Decision Logic

A separate sequential block determines whether the current count represents a round result.

The implemented decision points are:

- count `0` → loser event;
- count `7` → winner event.

Intermediate values clear both event outputs.

This separates counter movement from round-outcome detection.

## Score Tracking

The design maintains:

- `winner_count`;
- `loser_count`.

When a winner or loser event is observed, the corresponding score counter increments.

This creates state that persists across many individual counter transitions.

## Game-Over Detection

A separate sequential block checks whether either side reaches `WIN_SCORE`, defined as hexadecimal `F` / decimal 15.

When the threshold is reached:

- `gameover` is asserted;
- `who` is set to the winner code;
- both score counters are cleared;
- the main counter is reset.

The design therefore models both round-level and game-level state.

## Architecture and System Shape

```text
ctrl / init / reset
        ↓
  multi-mode counter
        ↓
  count = 0 or 7?
     ↙       ↘
 loser      winner
   ↓           ↓
loser_count winner_count
      \       /
       \     /
      score == 15?
           ↓
       gameover
           ↓
          who
```

This decomposition is visible directly in separate sequential blocks.

## SystemVerilog

The source uses SystemVerilog `logic` signals and array declarations for verification state.

The project continues the SystemVerilog work already visible in the pipelined MIPS repository but applies it to a more verification-focused exercise.

## Verification Architecture

`MMTB_Final` instantiates the design under test and a clock source.

It drives stimulus through one `initial` scenario and records test results in:

```text
int Testcases[15]
```

Individual checks write either:

- `Test_Success`;
- `Test_Failed`.

At the end, the testbench iterates through the test-case array and prints a status line for each slot.

This is self-checking simulation behavior rather than only manual waveform inspection.

## README Test Plan

The README documents a scenario table with:

- test-case number;
- behavioral intention;
- initialization value;
- control sequence.

The scenarios explicitly reason about which side should reach fifteen points first under different counter trajectories.

The README also marks some explored scenarios as useless/redundant, showing test-case pruning during design of the verification plan.

## Test Case 1: Increment by 2

The documented goal is to make the loser side win because incrementing by two avoids the winner boundary in the intended progression.

The testbench waits for the simulated game and checks:

```text
who == LOSER_WON
```

The result is stored into the first test-case slot.

## Test Case 2: Increment by 1

The design is allowed to run with one-step increments.

The scenario expects the loser score to reach the game threshold before the winner score.

The testbench again checks the encoded game result.

## Test Case 3: Alternating Around the Winner Boundary

The testbench initializes the counter near the upper boundary and repeatedly alternates decrement/increment operations so the count revisits the winning state.

After the sequence, it checks for `WINNER_WON`.

This exercises score accumulation from a deliberately constructed trajectory rather than a single direct transition.

## Test Case 4: Initialized Winner-Oriented Sequence

The testbench asserts initialization and then runs a control mode intended to drive repeated winner events.

It checks the resulting winner identity after the simulation interval.

## Test Case 5: Mixed Increment Sequence

The stimulus alternates one-step and two-step increment modes across a long sequence.

The testbench then checks that the expected winner side reaches the terminal score.

This exercises a more varied path through counter state.

## Test Case 6: Reset

The testbench asserts reset after previous game activity.

It directly checks:

```text
count == 0
```

This makes reset behavior an explicit verification target rather than relying only on initial conditions.

## Test Case 7: Decrement by 1

The control input switches to the one-step decrement mode and the testbench checks the expected loser result after the required simulation duration.

## Test Case 8: Decrement by 2

A second decrement scenario exercises the two-step path and checks the encoded loser result.

## Self-Checking Result Reporting

After applying the scenarios, the testbench loops through the `Testcases` array with `foreach`.

Each entry is printed as either:

- `Success`;
- `Failed`.

This is the earliest processed repository where HDL verification clearly stores multiple test outcomes programmatically and emits a consolidated pass/fail report.

## Verification Evolution Inside the Commit History

The final April 17 commit expands `GameDesign.sv` with additional test cases and result checks.

The diff adds checks for:

- Test Case 3;
- Test Case 4;
- Test Case 5;
- Test Case 6 reset behavior;
- Test Case 7 decrement-by-one;
- Test Case 8 decrement-by-two.

It also improves the final status display formatting.

The commit history therefore captures a visible evolution from design/test planning toward broader automated simulation checking.

## Engineering Practices

### Functional Block Separation

Counter movement, round decision, score accumulation, and terminal game detection are implemented in separate sequential blocks.

### Named Constants

Macros give semantic names to control values, outcome codes, boundaries, and test results.

### Scenario-Based Verification

The README begins from behavioral scenarios rather than only signal-level toggling.

### Self-Checking Testbench

Expected results are encoded as conditions and stored programmatically.

### Result Aggregation

A test-case array and final `foreach` report consolidate multiple checks into one simulation summary.

### Incremental Test Expansion

Commit history shows the testbench gaining additional cases and explicit pass/fail checks over time.

## Scale and Complexity

### Source Scale

The repository is compact: one README and one large SystemVerilog file.

### Behavioral Scale

The design maintains several layers of state:

- counter state;
- winner/loser event state;
- persistent winner score;
- persistent loser score;
- terminal game-over state;
- winning-side code.

### Verification Scale

The testbench drives long timed sequences rather than checking only one combinational result.

Multiple scenarios are evaluated and summarized in one run.

## Skills Demonstrated

### SystemVerilog and Digital Design

- **SystemVerilog — strong evidence.**
- **Sequential logic — strong evidence.**
- **Counter design — strong evidence.**
- **Wrap-around state handling — strong evidence.**
- **Reset logic — strong evidence.**
- **Multi-block state decomposition — strong evidence.**

### Verification

- **HDL testbench — strong evidence.**
- **Scenario-based verification — strong evidence.**
- **Self-checking conditions — strong evidence.**
- **Pass/fail result storage — strong evidence.**
- **Aggregated test reporting — strong evidence.**
- **Reset verification — strong evidence.**
- **Boundary-condition verification — strong evidence.**

### Test Design

- **Input-sequence design — strong evidence.**
- **Expected-outcome reasoning — strong evidence.**
- **Redundant-case pruning in documentation — moderate evidence.**

## Capability Developed

The repository's central portfolio contribution is the move from merely having an HDL testbench to building a **self-checking verification harness**.

Earlier hardware repositories used simulation harnesses and waveform inspection.

Here, the testbench itself decides whether each scenario succeeded and emits a consolidated status report.

That changes verification from:

```text
apply stimulus → inspect signals manually
```

into:

```text
apply scenario
      ↓
compute/check expected outcome
      ↓
store pass/fail
      ↓
aggregate results
```

This is a meaningful step toward verification-oriented engineering practice.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- a self-checking HDL testbench;
- programmatic HDL pass/fail recording;
- aggregated multi-test HDL reporting;
- explicit scenario table paired with executable checks;
- reset behavior checked as an automated test outcome.

It builds directly on the earlier SystemVerilog pipeline and Verilog simulation work but makes verification itself a first-class project concern.

## Historical Significance

`Multi-Mode-Counter-Winner-Loser-Game-SystemVerilog-Design-and-Verification` marks a verification-focused milestone in the early hardware portfolio.

Its significance is not the counter alone; it is the explicit effort to derive scenarios, encode expected outcomes, expand the suite through commits, and report success/failure programmatically.

That creates a useful baseline for later verification, automated testing, and CI-oriented work elsewhere in the portfolio.

## Overall Repository Narrative

This repository implements a SystemVerilog multi-mode counter game and an accompanying scenario-driven verification environment.

The design supports initialization, reset, four count directions/steps, round winner/loser detection, persistent scoring, and game-over reporting. The testbench then exercises several long-running trajectories, checks encoded outcomes, verifies reset behavior, stores results in a test array, and prints a consolidated Success/Failed report.

Its strongest corpus evidence is the transition from HDL simulation as observation to HDL simulation as automated correctness checking.

# Project Tags

## Project Type

- `educational-project`

## Collaboration and Authorship

- `individual-project`

## Languages

- `systemverilog`

## Embedded and Hardware

- `digital-design`
- `sequential-logic`
- `counter-design`
- `reset-logic`

## Testing and Verification

- `hdl-simulation`
- `hdl-testbench`
- `self-checking-testbench`
- `scenario-based-verification`
- `automated-pass-fail`
- `test-result-aggregation`
- `reset-verification`
- `boundary-condition-testing`
- `timed-stimulus`

## Software Engineering Practices

- `functional-decomposition`

## Portfolio Significance

- `earliest-observed-self-checking-hdl-testbench`
- `earliest-observed-automated-hdl-pass-fail`
- `earliest-observed-hdl-test-result-aggregation`
