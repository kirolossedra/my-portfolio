# Vehicle-Control-System

## Repository Identity

- Repository: 016 / 134
- Name: `Vehicle-Control-System`
- Repository start date: 2023-02-28
- Latest meaningful update date: 2023-03-03
- Primary type: Console control-system exercise
- Technical field: C programming and state-driven control logic
- Application domain: Vehicle state, speed, and temperature control
- Project context: Personal educational project
- Collaboration type: `individual-project`
- Primary implementation language: C

## Collaboration and Authorship Context

The repository commits are owner-authored, and the C source header names Kirolos Sedra.

The implementation is therefore personally attributable at repository level.

## Evidence Basis

The analysis is grounded in:

- `Vehicle.c`;
- the repository README;
- the documented state diagram;
- owner-authored commit history through March 3, 2023.

## What This Project Is

`Vehicle-Control-System` is a small C console application that models a vehicle through explicit engine state and rule-based responses to:

- traffic-light color;
- cabin temperature;
- engine temperature.

The user moves between an engine-off menu and an engine-on control menu.

When the engine is active, sensor-like inputs change vehicle speed, air-conditioning state, and engine-temperature-control state.

The repository README also documents the system through a state diagram.

## State Model

The central application loop checks the engine state.

```text
Engine OFF
   ├─ turn engine ON
   └─ quit path

Engine ON
   ├─ turn engine OFF
   ├─ set traffic light
   ├─ set room temperature
   └─ set engine temperature
```

This gives the project a direct finite-state/control-system shape.

## Technical Stack

### C

C is used for:

- global state;
- functions;
- `struct`s;
- pointers;
- `switch` statements;
- conditional control logic;
- console input/output.

This is the earliest processed repository whose primary implementation language is C.

## Data Structures

The source defines structures for:

### Air Conditioner

```text
state
temperature
```

### Engine Temperature Controller

```text
state
temperature
```

### Engine

```text
state
temperature
```

Pointers are created for each control structure and used throughout the runtime logic.

## Engine State Control

`EngineState()` maps engine-state values into console-readable status output.

`EngineOff()` presents the off-state menu and updates engine state based on user input.

`EngineON()` presents the active control menu and dispatches traffic or sensor updates.

## Traffic-Light Speed Control

`TrafficLight(color)` changes vehicle speed according to the entered traffic signal:

- Green → 100;
- Orange → 30;
- Red → 0.

The function uses the runtime pointer `wPointer` to update `Vehicle_Speed`.

This maps an external symbolic input into a deterministic actuator-like system state.

## Cabin Temperature Control

`ACkontrol(temp)` evaluates room temperature.

Extreme temperatures trigger the air-conditioning control path and assign a target temperature of 20.

The AC struct carries both:

- state;
- resulting temperature.

## Engine Temperature Control

`ETCkontrol(temp)` works through pointers to the engine and engine-temperature-controller structures.

It evaluates engine temperature and can activate the controller around a target value of 125.

This gives the application a second sensor/actuator control path distinct from cabin temperature.

## Runtime Status Reporting

After each loop iteration, the program prints:

- AC ON/OFF state;
- vehicle speed;
- room temperature;
- engine temperature;
- engine-temperature-controller ON/OFF state.

The console therefore acts as a live observable state display.

## Architecture and System Shape

```text
User input
   ↓
Engine state
   ├─ OFF menu
   └─ ON control menu
          ├─ traffic light
          │     ↓
          │  vehicle speed
          ├─ cabin temperature
          │     ↓
          │  AC state / target
          └─ engine temperature
                ↓
             ETC state / target
   ↓
Status output
```

## State Diagram Documentation

The README includes a state diagram image for the control flow.

This is the earliest processed repository where a formal state-diagram artifact is directly documented alongside the implementation.

The diagram complements the code's engine-on / engine-off control structure.

## Engineering Practices

### State-Based Decomposition

Separate functions correspond to major control responsibilities:

- engine state;
- traffic light;
- AC;
- engine temperature controller;
- engine-on menu;
- engine-off menu.

### Struct-Based Domain State

Related values are grouped into C structures instead of represented entirely as unrelated primitive globals.

### Pointer-Based State Mutation

Pointers to the engine and controllers are used to update runtime state.

### Rule-Based Control

Traffic and temperature inputs are mapped into deterministic output states.

### Continuous Status Observation

The main loop prints the current state after handling input, making the control behavior directly observable.

## Verification

### Interactive Console Verification

The program can be exercised by entering:

- engine commands;
- traffic-light colors;
- room temperature;
- engine temperature.

The resulting control state is printed after each loop.

### State-Diagram Cross-Reference

The README's state diagram provides a second representation against which the implemented menu/state flow can be understood.

## Scale and Complexity

### Source Scale

The repository has one C implementation file plus documentation.

### Functional Scale

The program models several interacting state variables:

- engine state;
- vehicle speed;
- cabin temperature;
- AC state;
- engine temperature;
- engine-temperature-controller state.

### Conceptual Complexity

The project is small, but it introduces explicit state-machine reasoning and sensor-to-control relationships.

## Skills Demonstrated

### C Programming

- **C — strong evidence.**
- **Functions — strong evidence.**
- **Structs — strong evidence.**
- **Pointers — strong evidence.**
- **Switch/case control flow — strong evidence.**
- **Console I/O — strong evidence.**

### Control and State Modeling

- **Finite-state-style control — strong evidence.**
- **Rule-based actuator logic — strong evidence.**
- **Sensor-like input handling — strong evidence.**
- **Traffic-light speed mapping — strong evidence.**
- **Temperature-control logic — strong evidence.**

### Documentation

- **State diagram — strong repository evidence.**

## Capability Developed

This repository introduces C as an implementation language and makes state-machine/control reasoning explicit.

Unlike the protocol state in repository 015, this state model is tied to a physical-domain abstraction:

- engine;
- speed;
- temperature;
- control systems.

That creates a useful bridge between software logic and embedded/control-system thinking.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- C as the primary implementation language;
- a documented vehicle-control state system;
- a repository state diagram;
- C structs used for control-domain state;
- C pointer-based control-state mutation.

## Historical Significance

`Vehicle-Control-System` is an early embedded/control-oriented software exercise.

It adds C and state-diagram thinking to a period of the portfolio already rich in HDL and architecture work, reinforcing the emerging low-level/systems orientation of early 2023.

## Overall Repository Narrative

`Vehicle-Control-System` is a compact C console program that models vehicle behavior through explicit engine state and sensor-driven rules.

Traffic-light input controls speed, cabin temperature feeds AC logic, engine temperature feeds a temperature-controller path, and C structs/pointers hold and mutate controller state. The main loop continuously reports the resulting state, while the README preserves a state-diagram representation of the system.

Its main portfolio significance is the introduction of C and explicit control-state modeling into the chronological corpus.

# Project Tags

## Project Type

- `control-system-exercise`
- `console-application`
- `educational-project`

## Collaboration and Authorship

- `individual-project`

## Languages

- `c`

## Embedded and Hardware

- `vehicle-control`
- `sensor-control-logic`
- `temperature-control`
- `traffic-light-control`

## Systems Engineering

- `finite-state-machine`
- `state-driven-control`
- `rule-based-control`
- `c-structs`
- `c-pointers`
- `console-state-simulation`

## Software Engineering Practices

- `functional-decomposition`
- `state-diagram-documentation`

## Testing and Verification

- `manual-simulation`
- `interactive-console-verification`

## Portfolio Significance

- `earliest-observed-c`
- `earliest-observed-state-diagram`
- `earliest-observed-vehicle-control`
