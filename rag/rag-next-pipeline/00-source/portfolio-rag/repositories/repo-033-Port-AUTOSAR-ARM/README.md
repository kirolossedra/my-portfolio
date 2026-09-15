# Port-AUTOSAR-ARM

## Repository Identity

- Repository: 033 / 134
- Name: `Port-AUTOSAR-ARM`
- Repository Start Date: 2024-05-31
- Latest Meaningful Update Date: 2024-05-31
- Primary Language: C
- Primary Type: AUTOSAR-style embedded driver integration
- Target Platform: TM4C123GH6PM microcontroller
- Technical Field: Embedded systems, MCAL-style GPIO/Port configuration
- Collaboration Type: Individual integration project with mixed source provenance

## Collaboration and Authorship Context

The repository contains explicit per-file authorship evidence.

The Port module is marked:

```text
Author: kirol
```

in `Port.h`, `Port.c`, `Port_Regs.h` and `Port_PBcfg.c`.

Those files contain the repository’s most distinctive Port-driver implementation.

Other modules carry different source attribution.

For example:

- `Dio.c` explicitly identifies Mohamed Tarek as author.
- `Gpt.c` explicitly identifies Mohamed Tarek as author.

The repository should therefore be interpreted as an owner-curated embedded integration project containing both personally attributable Port work and externally authored/supporting driver components.

The corpus attributes Port-specific engineering directly to the repository owner while treating the integrated DIO/GPT implementation as repository-level capability with explicit source provenance.

## What This Project Is

`Port-AUTOSAR-ARM` is a low-level embedded C codebase built around AUTOSAR-style driver organization for a TM4C123GH6PM microcontroller.

Its largest and most distinctive module is a configurable Port driver.

The repository also integrates:

- DIO,
- GPT / SysTick,
- DET,
- OS/scheduler support,
- LED abstraction,
- Button abstraction,
- application code,
- startup code,
- standard/platform types,
- hardware register definitions.

The project therefore represents a layered embedded software stack rather than a single GPIO function.

## Repository Structure

Important files include:

```text
App.c / App.h
Button.c / Button.h
Common_Macros.h
Compiler.h
Det.c / Det.h
Dio.c / Dio.h
Dio_Cfg.h
Dio_PBcfg.c
Dio_Regs.h
Gpt.c / Gpt.h
Led.c / Led.h
Os.c / Os.h
Platform_Types.h
Port.c / Port.h
Port_Cfg.h
Port_PBcfg.c
Port_Regs.h
Std_Types.h
cstartup_M.c
main.c
tm4c123gh6pm_registers.h
```

The file layout follows the familiar embedded-driver separation between:

- API headers,
- implementation,
- compile-time configuration,
- post-build configuration,
- register access,
- upper-layer abstractions.

## AUTOSAR Versioning

`Port.h` explicitly declares:

- software version `1.0.1`,
- AUTOSAR release `4.0.3`.

The code also performs compile-time compatibility checks between modules.

For example, the Port header validates the AUTOSAR version of `Std_Types.h`.

It similarly checks the Port configuration header against the Port module version.

These checks use preprocessor `#error` directives.

This is concrete compile-time interface/version validation.

## Module Identity and Service IDs

The Port module defines:

- vendor ID,
- module ID,
- instance ID,
- service IDs for exported operations.

Service IDs are provided for operations including:

- initialization,
- setting pin direction,
- refreshing direction,
- retrieving version information,
- setting pin mode.

This mirrors AUTOSAR-style module/API metadata conventions.

## Development Error Tracing

The Port API defines DET error codes for cases such as:

- invalid pin ID,
- unchangeable direction,
- invalid configuration,
- invalid mode,
- unchangeable mode,
- uninitialized module use,
- null pointer input.

`Port.c` conditionally integrates `Det_ReportError` when development-error detection is enabled.

That is concrete defensive embedded-driver design.

## Configuration Model

The Port module uses typed configuration structures.

Pin configuration carries fields including:

- direction,
- mode,
- resistor setting,
- runtime changeability.

The module also exposes a `Port_ConfigType`.

`Port_PBcfg.c` defines a concrete post-build configuration object.

Most channels use a default configuration, while named application configurations such as `LED` and `SWITCH` are inserted into the channel array.

## Post-Build Configuration

`Port_PBcfg.c` independently declares its software and AUTOSAR versions.

It validates those versions against the Port API header before defining `Port_Configuration`.

This separates generated/configuration-style data from driver logic.

The pattern is important because configuration becomes data passed into initialization rather than being buried entirely in imperative startup code.

## TM4C123 Register Mapping

`Port_Regs.h` defines memory-mapped base addresses for GPIO ports A through F.

It also defines register offsets including:

- DATA,
- DIR,
- alternate-function selection,
- pull-up,
- pull-down,
- digital enable,
- lock,
- commit,
- analog mode,
- port control.

`Port.c` computes register addresses by adding those offsets to the selected port base.

This is direct bare-metal memory-mapped I/O.

## Port Initialization

`Port_Init` receives a configuration pointer.

For each configured pin, the implementation:

1. selects the correct GPIO base address;
2. enables the corresponding port clock;
3. handles protected/special pins;
4. applies direction;
5. applies initial output value;
6. applies input pull-up or pull-down configuration;
7. configures the selected pin mode.

The initialization therefore turns declarative configuration data into actual hardware-register state.

## Pin Direction

Output pins cause the corresponding direction bit to be set.

Input pins clear the direction bit.

For inputs, resistor configuration determines whether pull-up or pull-down registers are enabled.

Initial output level is also applied during setup.

## Pin Multiplexing

The Port driver contains explicit mode handling for multiple peripheral functions.

Positively evidenced modes include:

- DIO,
- UART,
- ADC,
- CAN,
- SSI,
- I²C,
- PWM,
- USB,
- QEI,
- GPT,
- NMI,
- analog comparator.

The driver manipulates:

- alternate-function selection,
- digital enable,
- analog-mode selection,
- port-control mux bits,
- open-drain state where relevant.

This is a substantial pin-multiplexing implementation.

## DIO Mode

Digital I/O mode:

- disables analog functionality,
- disables alternate function,
- clears the pin-control mux field,
- enables digital functionality.

## UART Mode

UART configuration enables:

- alternate function,
- digital functionality,
- appropriate port-control mux selection.

The implementation accounts for different mux values on specific pins.

## ADC Mode

ADC pin setup:

- enables alternate function,
- configures the pin as input,
- disables digital mode,
- enables analog mode.

## CAN Mode

CAN mode configures alternate function and chooses the correct mux values for different supported pins.

## SSI Mode

SSI setup enables alternate function and digital behavior and applies pin-control mux selection.

## I²C Mode

I²C configuration includes alternate-function and digital enable plus open-drain behavior.

## PWM, USB, QEI and GPT Modes

The code contains dedicated mux handling for these modes as well.

This broad set of pin alternatives shows that the Port implementation is intended as a configurable general microcontroller driver rather than a hard-coded LED example.

## DIO Driver Integration

The repository also contains a DIO module for the same TM4C123 platform.

Its implementation supports:

- module initialization,
- channel writes,
- channel reads,
- post-build channel configuration,
- DET validation.

The source explicitly credits Mohamed Tarek.

This is therefore repository-level integration evidence, not personally attributed Port work.

## SysTick / GPT Integration

`Gpt.c` implements SysTick timer behavior.

It provides:

- start,
- stop,
- interrupt handler,
- callback registration,
- interrupt priority configuration.

The interrupt handler calls a registered upper-layer callback when available.

The file explicitly credits Mohamed Tarek.

At repository level, this provides timer/callback infrastructure supporting the wider embedded stack.

## Upper-Layer Device Abstractions

The repository contains dedicated LED and Button modules.

That establishes a layered architecture in which application logic does not have to operate directly on every raw register.

The stack can be conceptualized as:

```text
Application
   ↓
LED / Button abstractions
   ↓
DIO / Port / GPT services
   ↓
TM4C123 memory-mapped registers
   ↓
Microcontroller hardware
```

## Platform and Standard Types

Files such as:

- `Std_Types.h`,
- `Platform_Types.h`,
- `Compiler.h`

provide common types and compiler/platform abstractions expected by the driver modules.

This supports consistent interface definitions across the stack.

## Startup Integration

`cstartup_M.c` is part of the repository tree.

Its presence, together with the TM4C123 register header and SysTick driver, places the project firmly in bare-metal microcontroller territory.

## Defensive Programming

Positive defensive mechanisms include:

- null-pointer validation,
- module-initialization state,
- channel-range validation,
- mode validation,
- compile-time version checks,
- configurable DET reporting.

These are especially relevant for embedded driver interfaces where invalid accesses can directly affect hardware state.

## Engineering Practices

### Layered Driver Design

Application abstractions, MCAL-style drivers and hardware registers are separated.

### Configuration Separation

Port and DIO configuration are held in dedicated configuration files.

### Compile-Time Compatibility Checks

Software and AUTOSAR versions are compared through preprocessor logic.

### Symbolic Hardware Access

Named base addresses and register offsets replace unexplained literals throughout core driver logic.

### Typed Configuration

Enums and structures model direction, resistance, changeability and pin mode.

### Error Detection

DET-compatible error IDs make invalid API use explicit.

## Implementation Scale

This is one of the larger low-level C repositories processed so far.

The repository contains roughly thirty source/header artifacts and several interacting embedded layers.

`Port.c` alone is approximately 33 KB.

The implementation spans:

- configuration,
- register access,
- APIs,
- error handling,
- pin multiplexing,
- timer callbacks,
- digital I/O,
- upper-layer devices.

## Skills Demonstrated

### Embedded C

- memory-mapped register access,
- bit manipulation,
- volatile pointers,
- callbacks,
- interrupt-facing code,
- hardware abstraction.

### AUTOSAR-Style Engineering

- AUTOSAR release metadata,
- module/service IDs,
- standard types,
- DET error reporting,
- pre-compile configuration,
- post-build configuration,
- version compatibility checks.

### Microcontroller I/O

- GPIO direction,
- pull-up/pull-down,
- digital enable,
- analog mode,
- alternate functions,
- pin multiplexing.

### Peripheral Configuration

- UART,
- ADC,
- CAN,
- SSI,
- I²C,
- PWM,
- USB,
- QEI,
- GPT,
- NMI.

### Software Architecture

- layered modules,
- upper/lower interface separation,
- configuration-driven initialization,
- reusable device abstractions.

## Capability Developed

The strongest personally attributable capability is the Port module.

It demonstrates moving from application-level embedded C to a configurable driver architecture with standardized interfaces, defensive checks and direct hardware register manipulation.

The broader repository also shows integration of that driver into a larger embedded software stack containing DIO, timer services, application abstractions and startup/platform support.

## Historical Portfolio Significance

This is the earliest processed repository with direct AUTOSAR 4.0.3-style MCAL conventions.

It is also the earliest processed repository with a substantial owner-attributed configurable Port driver for the TM4C123 platform.

The project introduces:

- DET-style error reporting,
- post-build driver configuration,
- compile-time AUTOSAR version checks,
- multi-peripheral GPIO pin multiplexing.

## Overall Project Narrative

`Port-AUTOSAR-ARM` represents a significant embedded-systems step in the portfolio.

Instead of writing one application directly against registers, the repository organizes microcontroller behavior into reusable driver modules with standardized metadata and configuration boundaries.

The owner-attributed Port implementation is the clearest evidence of this transition.

It translates a declarative pin configuration into the correct TM4C123 register state across many peripheral modes while enforcing initialization, version and error rules.

The surrounding DIO, GPT, LED, Button, OS and startup components demonstrate how such a driver participates in a broader embedded architecture, while their explicit source authorship is preserved rather than incorrectly attributed.

# Project Tags

- `c`
- `embedded-systems`
- `bare-metal`
- `tm4c123`
- `arm-cortex-m`
- `autosar`
- `autosar-4-0-3`
- `mcal-style-driver`
- `port-driver`
- `gpio`
- `memory-mapped-io`
- `volatile-register-access`
- `bit-manipulation`
- `pin-multiplexing`
- `post-build-configuration`
- `preprocessor-version-checks`
- `development-error-tracing`
- `det`
- `dio`
- `systick`
- `timer-callback`
- `uart-pin-config`
- `adc-pin-config`
- `can-pin-config`
- `ssi-pin-config`
- `i2c-pin-config`
- `pwm-pin-config`
- `usb-pin-config`
- `qei-pin-config`
- `gpt-pin-config`
- `nmi-pin-config`
- `pull-up-pull-down`
- `configuration-driven-initialization`
- `layered-embedded-architecture`
- `mixed-source-provenance`
- `individual-project`
- `earliest-observed-autosar`
- `earliest-observed-mcal-style-driver`
- `earliest-observed-port-driver`
- `earliest-observed-tm4c123`
