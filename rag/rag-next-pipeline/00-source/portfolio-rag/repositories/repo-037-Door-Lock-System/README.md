# Repository 037 — Door-Lock-System

## Repository Identity

- **Repository:** `kirolossedra/Door-Lock-System`
- **Repository start date:** 2024-06-01
- **Last meaningful update date:** 2024-06-01
- **Primary language:** C
- **Runtime context:** AVR embedded system
- **System shape:** two-microcontroller door-lock architecture
- **Source-provenance classification:** externally attributed core implementation preserved in the owner's portfolio repository

## What This Repository Contains

`Door-Lock-System` contains a two-controller embedded access-control design split between `MC1` and `MC2`.

The system integrates keypad input, LCD output, UART communication, external EEPROM, TWI/I²C, DC motor control, PWM, timers, and buzzer behavior.

Provenance is critical: both central application files explicitly state **Author: Mohamed Tarek**, date **25/4/2014**, and identify themselves as challenge code. Repository ownership therefore does not support claiming original authorship of the core system.

## System Architecture

### MC1 — User Interface Controller

MC1 handles keypad entry, LCD prompts, password creation, password confirmation, menu selection, retry counting, and UART transmission.

The menu supports:

- opening the door,
- changing the password.

### MC2 — Security and Actuation Controller

MC2 handles UART command reception, EEPROM persistence, password comparison, motor actuation, timer callbacks, TWI, and buzzer response.

This architecture separates user interaction from persistent security state and physical actuation.

## Password Creation

MC1 asks for a five-digit password and then requests the same password again.

When the two local entries agree, MC1 transmits the five bytes over UART.

MC2 receives them and writes each byte to external EEPROM.

Credential persistence therefore resides on the control MCU rather than only in volatile UI memory.

## Password Verification

For a protected action, MC1 reads five keypad values and transmits them to MC2.

MC2 reads the stored five-byte credential from EEPROM, compares the received sequence, and sends an acceptance byte when all positions match.

The verification decision is therefore made by the MCU that owns the stored credential.

## Retry and Alarm Behavior

MC1 permits up to three verification attempts.

It displays remaining attempts after failures.

After the third failure it transmits a buzzer command.

MC2 reacts by enabling the buzzer and using timer/callback logic to terminate the alarm behavior.

## Door Actuation

A valid open-door path sends an `OPEN_DOOR` command to MC2.

MC2 installs a timer callback and drives the DC motor through a timed sequence.

The motor initially rotates in one direction, later stops, then rotates in the opposite direction before the timer sequence is deinitialized.

Door behavior is therefore represented as a temporal actuator workflow rather than a static GPIO state.

## Password Change

The password-change path first authenticates the current password.

Only after successful verification does MC1 trigger the password-entry workflow again and MC2 update EEPROM-backed credential data.

This reuses the same trust boundary as door opening.

## Inter-MCU Protocol

UART carries both commands and password data.

Defined control values include acceptance, open-door command, and buzzer command.

The system is therefore a small embedded distributed protocol across two processors.

## Peripheral Stack

Repository-level capability includes UART, keypad, LCD, GPIO, external EEPROM, TWI/I²C, DC motor, PWM, timers, and buzzer.

This is a broad embedded-system integration example at the repository level.

## Authorship Boundary

The strongest direct source evidence attributes `MC1.c` and `MC2.c` to Mohamed Tarek.

Accordingly, the corpus distinguishes two things.

### Repository-level capability

The repository contains a functioning architectural pattern for dual-MCU access control with persistent credentials, communication, actuation, and alarm behavior.

### Personally attributable evidence

The repository supports evidence that the owner studied, organized, retained, and worked with this architecture.

It does **not** support a claim that the owner originally authored the central controller application source.

This prevents future RAG answers from converting possession of a repository into false implementation credit.

## Engineering Concepts Represented

The codebase materially demonstrates multi-controller responsibility partitioning, UART command/data exchange, persistent EEPROM-backed state, authentication flow, retry limits, timer-driven actuation, alarm behavior, TWI/I²C peripheral access, and keypad/LCD interaction.

## Portfolio Evolution

This repository appears directly after personally attributed AVR stopwatch, calculator, and fan-controller work.

Its significance is different.

It expands the observed embedded architecture into a two-MCU system while also becoming an important provenance case: technical repository scope and personal authorship must be stored as separate facts.

## Overall Repository Narrative

`Door-Lock-System` models a distributed embedded access-control device.

One controller owns keypad/LCD interaction. The other owns password storage, verification, motor control, and alarm response. UART connects the processors, TWI connects persistent EEPROM, and timers coordinate actuator timing.

The architecture is technically substantial, but the core source explicitly credits another author. The corpus therefore records the design in detail without misattributing its implementation.

# Project Tags

## Project Type
- `embedded-system-reference`
- `dual-microcontroller-system`
- `access-control-system`
- `educational-project`

## Languages
- `c`

## Embedded and Hardware
- `avr`
- `uart`
- `twi-i2c`
- `external-eeprom`
- `keypad-interface`
- `lcd-interface`
- `dc-motor-control`
- `pwm`
- `timer-callback`
- `buzzer`

## Systems Engineering
- `inter-mcu-communication`
- `persistent-credential-storage`
- `password-authentication`
- `retry-limit`
- `alarm-control`
- `timed-actuation`

## Collaboration and Authorship
- `externally-attributed-source`
- `instructional-reference-code`

## Portfolio Significance
- `earliest-observed-dual-microcontroller-system`
- `earliest-observed-external-eeprom`
- `earliest-observed-inter-mcu-communication`
