# Repository 034 — STOP-WATCH-AVR

## Repository Identity

- **Repository:** `kirolossedra/STOP-WATCH-AVR`
- **Repository start date:** 2024-05-31
- **Last meaningful update date:** 2024-05-31
- **Primary implementation language:** C
- **Project context:** AVR embedded-system exercise
- **Collaboration classification:** individual repository project
- **Primary runtime target:** AVR microcontroller
- **Simulation artifact:** Proteus project

## What This Project Is

`STOP-WATCH-AVR` implements a digital stopwatch directly against AVR peripheral registers.

The application maintains hours, minutes, and seconds, advances the clock from a Timer1 compare-match interrupt, multiplexes six seven-segment digits, and uses three external interrupts for reset, pause, and resume behavior.

The repository also contains a Proteus project, so the project is not only source code: it preserves a hardware-simulation representation of the microcontroller circuit.

## Functional Scope

The implemented stopwatch supports seconds counting, minute rollover, hour rollover, six displayed decimal digits, reset to `00:00:00`, pause, resume, and continuously multiplexed seven-segment output.

The source keeps three explicit state variables: `seconds`, `minutes`, and `hours`. That makes the temporal model small and directly inspectable.

## Embedded Architecture

The project separates two timing responsibilities.

### Long-period timekeeping

Timer1 compare-match interrupts drive the logical stopwatch state.

### Short-period display refresh

The foreground loop repeatedly multiplexes the physical display.

This separation matters because stopwatch time does not depend on how quickly the display-refresh loop runs.

## Foreground Display Loop

`main()` repeatedly calls `s7seg()`.

`s7seg()` activates one display position at a time through `PORTA`, writes the decimal digit through `PORTC`, waits approximately 3 ms, and advances to the next position.

The six positions correspond to seconds units, seconds tens, minutes units, minutes tens, hours units, and hours tens.

This is explicit display multiplexing rather than dedicating a separate complete output bus to every digit.

## Timer1 Timebase

`Timer1_CTC_Init()` configures Timer1 in compare mode.

The implementation resets `TCNT1`, loads `OCR1A = 15625`, enables the output-compare-A interrupt, enables CTC behavior with `WGM12`, and selects a timer prescaler through `CS11` and `CS10`.

The compare ISR becomes the application's timekeeping heartbeat.

## Time Rollover Logic

`TIMER1_COMPA_vect` updates time hierarchically.

When seconds reach 59, seconds return to zero and minutes increment.

When minutes also reach 59, minutes return to zero and hours increment.

The rollover rules are encoded explicitly rather than delegated to a time library.

## External Interrupt Controls

### INT0 — Reset

`INT0_vect` sets seconds, minutes, and hours to zero.

### INT1 — Pause

`INT1_vect` disables the Timer1 compare interrupt by clearing the corresponding `TIMSK` bit.

The timer configuration can stay intact while stopwatch state stops advancing.

### INT2 — Resume

`INT2_vect` re-enables the Timer1 compare interrupt.

Pause and resume therefore manipulate delivery of the timing event rather than reconstructing the timer configuration.

## Seven-Segment Multiplexing

`PORTA` serves as the digit-selection side and `PORTC` carries the decimal value for the selected digit.

For each position the code selects one display, calculates the relevant decimal digit, writes it, delays briefly, and moves to the next display.

Decimal extraction uses modulo and division directly on the stopwatch counters, for example `seconds % 10` for units and tens reconstruction from the remaining value.

## Hardware-Level Programming

The project works directly with AVR registers including `PORTA`, `PORTC`, `DDRA`, `DDRC`, `GICR`, `MCUCR`, `MCUCSR`, `TIMSK`, `TCNT1`, `OCR1A`, `TCCR1A`, `TCCR1B`, and `SREG`.

This provides concrete exposure to pin direction configuration, global interrupt control, external interrupt setup, timer configuration, compare events, and output-register manipulation.

## Simulation Evidence

The repository contains `proteus/mytest.pdsprj`.

That is concrete evidence that the stopwatch was paired with a Proteus circuit/simulation project rather than existing only as isolated C source.

The source is naturally observable through timer-driven count progression, interrupt-driven control, and six visible seven-segment outputs.

## Engineering Skills Demonstrated

### Embedded C

The implementation operates close to AVR hardware and manipulates peripheral registers explicitly.

### Interrupt-Driven Design

Timekeeping and user controls are handled through interrupt service routines rather than foreground polling alone.

### Timer Configuration

Timer1 compare-match behavior is used as a deterministic software timebase.

### Digital Display Driving

Six display digits are multiplexed through shared output resources.

### Hardware/Software Co-Design

Firmware is paired with a Proteus simulation artifact.

### State Management

Time state is compact and deterministic, with explicit rollover rules.

## Capability Developed

The core capability is coordinating asynchronous interrupt events, persistent state, timer peripherals, display refresh, and hardware register configuration.

That is a reusable embedded-systems foundation beyond the stopwatch arithmetic itself.

## Portfolio Evolution

Chronologically, this repository appears immediately after `Port-AUTOSAR-ARM`.

It shifts from configurable driver-layer work to a compact end application where timers, interrupts, GPIO, and display behavior are assembled into one visible device.

It is the earliest processed repository where an AVR application combines interrupt-driven timekeeping with explicit six-digit seven-segment multiplexing.

## Overall Project Narrative

`STOP-WATCH-AVR` is a small but complete hardware-facing application.

A Timer1 compare interrupt advances the stopwatch independently of the foreground display loop. Three external interrupts provide reset, pause, and resume controls. The foreground continuously multiplexes six seven-segment positions through shared ports. A Proteus project preserves the circuit-level simulation context.

The repository captures a classic embedded pattern: hardware timers create deterministic events, ISRs modify shared state, and a foreground loop renders that state to a physical interface.

# Project Tags

## Project Type
- `embedded-application`
- `educational-project`
- `stopwatch-application`
- `individual-project`

## Languages
- `c`

## Embedded and Hardware
- `avr`
- `timer-ctc`
- `timer-interrupt`
- `external-interrupts`
- `seven-segment-display`
- `display-multiplexing`
- `gpio`
- `interrupt-driven-embedded-system`
- `direct-register-programming`

## Simulation and Verification
- `proteus`
- `embedded-simulation`
- `manual-simulation`

## Software Engineering and Algorithms
- `event-driven-state-machine`
- `state-driven-control`
- `modulo-arithmetic`

## Portfolio Significance
- `earliest-observed-avr`
- `earliest-observed-seven-segment-display`
- `earliest-observed-display-multiplexing`
- `earliest-observed-proteus`
