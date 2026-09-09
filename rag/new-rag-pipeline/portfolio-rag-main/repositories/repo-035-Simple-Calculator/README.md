# Repository 035 — Simple-Calculator

## Repository Identity

- **Repository:** `kirolossedra/Simple-Calculator`
- **Repository start date:** 2024-06-01
- **Last meaningful update date:** 2024-06-01
- **Primary language:** C
- **Runtime context:** AVR microcontroller
- **Application type:** keypad/LCD embedded calculator
- **Collaboration classification:** individual application logic with externally attributed support drivers

## What This Project Is

`Simple-Calculator` is an AVR calculator application that accepts one arithmetic expression from a matrix keypad and displays both input and result on an LCD.

The repository is layered into `Calculator.c` plus GPIO, keypad, LCD, shared type, and macro modules.

The main calculator source explicitly identifies `kirol` as its author.

Several supporting drivers, including GPIO and keypad, explicitly credit Mohamed Tarek. The corpus therefore treats the calculator parsing and application workflow as personally attributable while preserving the external provenance of those support modules.

## Functional Scope

The calculator supports one binary arithmetic operation between two non-negative integer operands.

Implemented operations are addition, subtraction, multiplication, and division.

The user enters characters through the keypad until `=` is received, and the result is rendered on the LCD.

## Input Pipeline

The application creates a fixed 30-byte RAM buffer.

The `read()` function performs the interaction cycle: displays a prompt, waits for keypad readiness, reads keys, echoes numbers or operators, stores keys into the buffer, and stops acquisition when `=` is pressed.

A counter records the amount of expression content captured.

## Operator Detection

After input collection, the application scans the buffered expression.

A stored value greater than 9 is interpreted as the operator character, and its position is recorded as `OpIndex`.

That divides the expression into left digits, one operator, and right digits.

The design is intentionally narrow and targeted at one arithmetic operator per expression.

## Manual Decimal Parsing

The source manually reconstructs integer operands from individual keypad digits.

For each digit it builds the appropriate decimal place value by multiplying a temporary accumulator by 10 for every remaining digit position.

The right operand is reconstructed with the same technique.

The parser therefore does not depend on `atoi`, `strtol`, dynamic strings, or an expression library.

## Arithmetic Dispatch

The operator stored at `RAM[OpIndex]` drives a `switch`.

The application performs addition, subtraction, multiplication, or floating-point division.

Integer-style results are sent to `LCD_longToString`.

Division casts both operands to `double` and uses `LCD_doubleToString`.

## Interaction Reset

After displaying a result, the application waits for a particular keypad code before clearing the LCD and beginning another calculation.

`main()` initializes the LCD and repeatedly calls the application read/compute/display cycle.

## Hardware Abstraction Structure

The calculator does not manipulate all pins directly in the application source.

Instead, it consumes keypad and LCD interfaces built over GPIO.

This is an early layered embedded structure in which application semantics sit above lower-level peripheral handling.

## Authorship Boundary

`Calculator.c` contains creation date 7 November 2021 and author `kirol`.

The inspected GPIO and keypad drivers explicitly credit Mohamed Tarek.

Accordingly, the strongest personally attributable work is the expression acquisition, fixed-buffer management, operator identification, operand reconstruction, arithmetic dispatch, and LCD-oriented workflow.

The support-driver presence is not converted into a personal authorship claim.

## Engineering Skills Demonstrated

### Embedded Application Composition

The application combines keypad input and LCD output through reusable driver APIs.

### Fixed-Buffer Processing

Input is captured into a bounded RAM buffer with explicit indices.

### Numeric Parsing

Decimal integers are reconstructed manually from individual keypad digits.

### Control Flow

A small parser identifies the operator and dispatches arithmetic through a switch.

### Hardware Abstraction Consumption

The application sits above GPIO/keypad/LCD layers instead of putting all register logic in one source file.

## Capability Developed

The key capability is building an end-user workflow on top of embedded peripheral drivers.

Compared with a register-level exercise, the focus moves upward toward input semantics, parsing, application state, presentation, and reuse of device abstractions.

## Portfolio Evolution

`Simple-Calculator` follows the previous day's AVR stopwatch.

The stopwatch emphasized interrupts and timer hardware.

The calculator emphasizes peripheral abstraction, interactive input, numeric parsing, and LCD presentation.

Together they show two distinct embedded application styles: asynchronous timing/control and user-driven input/compute/output.

## Overall Project Narrative

`Simple-Calculator` turns a keypad and LCD into a self-contained arithmetic interface.

The user enters a fixed-format expression, the application stores keypad values, locates the operator, reconstructs decimal operands manually, executes the chosen operation, and renders the result.

Source headers make it possible to distinguish personally authored application logic from externally attributed support drivers.

# Project Tags

## Project Type
- `embedded-application`
- `embedded-calculator`
- `educational-project`
- `individual-project`

## Languages
- `c`

## Embedded and Hardware
- `avr`
- `keypad-interface`
- `lcd-interface`
- `gpio`

## Data and Algorithms
- `fixed-buffer-processing`
- `manual-numeric-parsing`
- `decimal-place-reconstruction`
- `arithmetic-dispatch`

## Software Engineering Practices
- `module-decomposition`
- `hardware-abstraction`
- `externally-attributed-support-code`

## Portfolio Significance
- `earliest-observed-embedded-calculator`
- `earliest-observed-lcd-interface`
