# Repository 036 — Fan-Controller

## Repository Identity

- **Repository:** `kirolossedra/Fan-Controller`
- **Repository start date:** 2024-06-01
- **Last meaningful update date:** 2024-06-01
- **Primary language:** C
- **Runtime context:** AVR microcontroller
- **Project type:** temperature-driven fan controller
- **Collaboration classification:** individual application and several owner-attributed device modules with reused support infrastructure

## What This Project Is

`Fan-Controller` is an embedded control application that reads temperature from an LM35 sensor and maps temperature ranges to fan operating state and speed.

The implementation combines ADC conversion, LM35 temperature acquisition, DC motor control, PWM duty-cycle generation, LCD status display, and GPIO support.

The main application explicitly identifies Kirolos Sedra as author.

The ADC, DC motor, and PWM modules inspected in the repository also carry `kirol` authorship headers.

## System Behavior

The application continuously samples temperature.

Its implemented policy is:

| Temperature | Fan state | Commanded speed |
|---|---|---:|
| `< 30 °C` | OFF | stopped |
| `30–59 °C` | ON / clockwise | 25% |
| `60–89 °C` | ON / clockwise | 50% |
| `90–119 °C` | ON / clockwise | 75% |
| `>= 120 °C` | ON / clockwise | 100% |

The LCD simultaneously displays whether the fan is ON or OFF and the current measured temperature.

## Layered Embedded Architecture

### Application Layer

`MINI_PROJECT_3.c` owns the temperature-to-actuator policy and coordinates the sensor, motor, ADC, and display.

### Sensor Layer

The LM35 module supplies temperature to the application instead of exposing arbitrary raw ADC values directly to `main()`.

### ADC Layer

`adc.c` configures the AVR ADC.

The owner-attributed implementation selects reference behavior through configuration, sets the prescaler, enables the ADC, selects a channel, starts conversion, polls conversion completion, and returns the ADC register value.

### Motor Layer

`dcm.c` abstracts DC motor state.

`DcMotor_Rotate(state, speed)` controls two direction pins and delegates speed generation to the PWM module.

The module supports stop, clockwise, and counter-clockwise states.

### PWM Layer

`pwm.c` configures AVR Timer0 for PWM output.

A percentage duty cycle is converted into an `OCR0` compare value, and the timer drives the OC0 output pin.

Motor speed is therefore hardware-timer driven rather than produced by software delay loops.

## End-to-End Data Flow

The control loop is:

1. LM35 senses temperature.
2. ADC produces a digital measurement.
3. LM35 abstraction yields temperature.
4. Application selects state and speed band.
5. DC motor abstraction sets direction pins.
6. PWM establishes duty cycle.
7. LCD reports state and temperature.
8. Loop repeats.

This is a clean sensor-to-decision-to-actuator pipeline.

## Control Strategy

The controller is threshold based rather than continuously proportional.

Temperature is quantized into four active speed regions plus an off region.

This makes every output condition explicit and inspectable.

## User Feedback

The LCD functions as operational telemetry.

At startup the application establishes fixed labels for fan state and temperature.

During the loop it updates those positions and writes a trailing space after shorter temperature values so stale digits are not left visible.

## Engineering Skills Demonstrated

### ADC Peripheral Programming

ADC configuration and conversion are represented directly in source.

### Sensor Integration

An LM35 sensor is translated into application-level temperature.

### PWM Motor Control

Timer0 PWM drives explicit motor-speed percentages.

### Layered Drivers

Application policy, sensor logic, ADC, motor logic, PWM, LCD, and GPIO are separated.

### Rule-Based Control

Temperature bands map deterministically to actuator commands.

### Runtime Telemetry

LCD output exposes current system state during execution.

## Capability Developed

The repository demonstrates a complete embedded sensing/control chain:

**analog sensor → ADC → physical quantity → policy → PWM actuator → display feedback**

That is materially closer to embedded product behavior than an isolated driver exercise.

## Portfolio Evolution

Chronologically, this project immediately follows `Simple-Calculator`.

The calculator was user-input driven.

`Fan-Controller` introduces continuous environmental sensing and autonomous actuator control.

It is the earliest processed repository to combine ADC acquisition, temperature sensing, threshold control, and PWM motor speed in one embedded application.

## Overall Project Narrative

`Fan-Controller` is a compact environmental-control device implemented in AVR C.

It continuously samples an LM35, converts the measurement through an ADC abstraction, chooses a fan-speed band, drives a DC motor through PWM, and reports state and temperature on an LCD.

Several key modules—main application, ADC, DC motor, and PWM—carry owner-attributed source headers, providing clear evidence for the personally implemented control chain.

# Project Tags

## Project Type
- `embedded-application`
- `sensor-control-project`
- `educational-project`
- `individual-project`

## Languages
- `c`

## Embedded and Hardware
- `avr`
- `adc`
- `lm35-temperature-sensor`
- `dc-motor-control`
- `pwm`
- `pwm-duty-cycle`
- `timer0`
- `lcd-interface`
- `gpio`

## Systems Engineering
- `sensor-control-logic`
- `temperature-control`
- `rule-based-control`
- `sensor-to-actuator-pipeline`
- `state-driven-control`

## Software Engineering Practices
- `module-decomposition`
- `hardware-abstraction`
- `configuration-struct`

## Portfolio Significance
- `earliest-observed-adc`
- `earliest-observed-lm35-temperature-sensor`
- `earliest-observed-pwm-motor-control`
