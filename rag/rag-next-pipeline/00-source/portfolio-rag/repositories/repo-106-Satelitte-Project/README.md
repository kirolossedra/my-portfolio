# Satelitte-Project

## Repository Identity

- Repository: 106 / 134
- Name: `Satelitte-Project`
- Repository start date: 2026-04-02
- Last meaningful update date: 2026-04-02
- Latest meaningful commit: `b72aacfc19ed7ab1374b052913f4c6e97105c627`
- Primary type: Automated cellular/satellite modem validation harness
- Technical field: Cellular networking, modem control, serial communications, automated test engineering
- Application domain: Rogers satellite-network validation using a Quectel RM520N modem
- Collaboration type: `individual-project`
- Primary language: Python

## Collaboration and Authorship Context

The repository history is owner-driven and the implementation is contained in a single Python test harness. The corpus therefore treats the modem-control, parsing, automated test flow, logging, and report-generation logic as personally attributable repository work.

The Rogers network identifiers, SIM inventory, and modem/network behavior are operational test inputs. The engineering claim is the automation around them rather than ownership of the external network infrastructure.

## Evidence Basis

The analysis is grounded in the current `test.py` implementation and repository history.

The script contains:

- modem-port discovery;
- direct AT-command execution;
- parser functions for modem/network responses;
- explicit test-case objects;
- a staged validation runner;
- conditional abort logic;
- repeated registration monitoring;
- success and failure diagnostics;
- restoration of normal modem state;
- raw command/response logging;
- JSON, text, LaTeX, and optional PDF report generation.

## What This Project Is

`Satelitte-Project` is an automated validation harness for testing a Quectel RM520N cellular modem against a specific Rogers satellite-network test plan.

Rather than requiring a tester to manually enter commands and interpret modem responses, the program drives the modem over a serial connection, collects and parses responses, evaluates explicit pass/fail conditions, records evidence, and generates structured run reports.

The workflow is stateful. It begins by establishing that the connected hardware and SIM are appropriate, captures the current modem/network state, moves the modem into airplane mode, applies a dedicated LTE/network configuration, scans for the target network, conditionally performs manual operator selection, monitors registration, gathers diagnostics, and finally restores the modem to normal automatic behavior.

## Project Scope

### Modem Discovery

The tool searches common Linux serial-device paths including:

- `/dev/ttyUSB*`;
- `/dev/ttyACM*`;
- `/dev/serial/by-id/*`.

Candidate ports are opened with PySerial and probed using `AT` and `ATI`.

A successful modem response determines the serial interface used by the rest of the run.

### Preliminary Identity and SIM Validation

The first test stage collects:

- IMSI;
- IMEI;
- SIM initialization state;
- PDP contexts.

The IMSI is checked against an explicit approved-SIM allowlist.

This means the automated test does not proceed solely because a modem is reachable; it validates that the attached subscriber identity belongs to the intended test inventory.

### Modem and Network State Inspection

The script records current state through commands including:

- `ATI`;
- `AT+COPS?`;
- `AT+CEREG?`;
- `AT+QNWINFO`;
- `AT+QENG="servingcell"`.

Dedicated parser functions transform the raw text into structured fields such as operator mode, registration state, radio access technology, band, channel, and serving-cell state.

### Satellite-Network Configuration

The harness drives the modem into airplane mode with `AT+CFUN=4`, then applies the target configuration.

The implemented settings include:

- LTE-only mode preference;
- roaming preference;
- data-roaming configuration;
- a target APN;
- detailed EPS registration reporting.

Each configuration command contributes to the test-case pass/fail result.

### Network Scan and Conditional Progression

After returning the modem to full functionality, the script performs a long-running `AT+COPS=?` network scan.

The scan output is parsed into operator entries.

The target PLMN is searched explicitly.

If the target network is absent, the runner records an abort reason and stops before the manual-selection stage.

This conditional progression is important test engineering: later actions are not executed when the prerequisite network evidence is absent.

### Manual Operator Selection

When the target PLMN is visible, the harness attempts explicit manual selection using the configured access technology.

The command outcome is captured as a dedicated test case.

### Registration Monitoring

The registration stage performs repeated rounds of diagnostic sampling.

Each round captures information from commands including:

- network clock;
- operator selection;
- EPS registration;
- RSSI/BER;
- Quectel signal-quality output;
- RSRP;
- serving-cell state;
- system mode.

The script waits between unsuccessful rounds and stops early when registration succeeds.

### Success Diagnostics

On successful registration the harness additionally inspects:

- PDP-context activation state;
- assigned PDP addresses;
- RRC state.

The report records whether context 1 is active and which IP address it received.

### Failure Diagnostics

If registration does not succeed after the configured monitoring rounds, the program captures additional network rejection/error information through Quectel/network diagnostic commands.

The final test-case reason contains the terminal registration state and supporting diagnostic values.

### State Restoration

The run contains a final restoration stage that returns the modem toward normal automatic operation.

That makes the test harness responsible not just for test setup and observation but also for post-test cleanup of the device state.

## Architecture and System Shape

```text
Linux serial-device discovery
          ↓
AT / ATI modem probe
          ↓
Quectel RM520N serial connection
          ↓
Staged test runner
          ↓
AT command execution + response collection
          ↓
Protocol-specific parser functions
          ↓
Per-step pass/fail evaluation
          ↓
Raw log + JSON + text + LaTeX/PDF reports
```

The implementation separates several concerns even though they live in one file:

- transport and serial handling;
- response parsing;
- test-case representation;
- orchestration;
- reporting.

## Technical Stack

### Python

Python implements the complete validation workflow, parsing layer, report generation, and device orchestration.

### PySerial

PySerial opens the modem interface, controls buffers, writes AT commands, and collects modem responses.

### Regular Expressions

Regex parsers extract structured state from modem responses such as:

- IMSI and IMEI numbers;
- PDP contexts;
- operator-selection results;
- registration state;
- signal-quality metrics;
- RSRP values;
- system and RRC state.

### JSON

The complete run is serialized to a machine-readable JSON report containing test cases, commands, extracted values, reasons, and overall status.

### LaTeX and PDF

The script generates a LaTeX report with a run summary, pass/fail checkboxes, extracted data, and detailed command logs.

When `pdflatex` is available, the LaTeX source is compiled into a PDF automatically.

## Major Engineering Work

### Robust AT-Command Transport

The `send_at` helper records timestamps, writes the command, waits for serial output, and recognizes terminal success and error conditions.

It distinguishes:

- `OK`;
- `ERROR`;
- CME errors;
- CMS errors;
- timeout completion.

It also captures command duration and raw modem responses for later reporting.

### Raw Audit Logging

Every transmitted command and received response line is appended to a timestamped raw log.

This creates an execution trace independent of the summarized pass/fail report.

### Structured Response Parsing

The repository contains dedicated parsers rather than relying on ad-hoc string checks throughout the runner.

Examples include parsers for:

- `+CGDCONT`;
- `+COPS` query and scan formats;
- `+CEREG`;
- `+QNWINFO`;
- `+CSQ`;
- `+QCSQ`;
- `+QRSRP`;
- `+CGACT`;
- `+CGPADDR`;
- Quectel system/RRC state.

This turns modem text protocols into structured test data.

### Explicit Test Cases

Each stage is represented by a `TestCase` object carrying:

- case ID;
- title;
- description;
- step;
- command records;
- pass/fail state;
- reason;
- extracted data.

That provides a reusable report contract between execution and output rendering.

### Safety Through Preconditions

The script encodes important preconditions directly into execution:

- modem must respond;
- SIM identity must be approved;
- target PLMN must appear before manual selection;
- registration monitoring has a bounded number of rounds.

These are test-plan constraints represented as executable control flow.

### Success/Failure Branch Diagnostics

The runner does not merely mark registration as passed or failed.

Successful registration triggers context and RRC inspection, while unsuccessful registration triggers rejection/error diagnostics.

This preserves evidence useful for troubleshooting both outcomes.

### Multi-Format Reporting

One run produces several complementary artifacts:

- raw command/response log;
- structured JSON;
- human-readable text;
- LaTeX source;
- PDF when the local toolchain is available.

The LaTeX output includes per-test pass/fail checkboxes and detailed command evidence.

## Testing and Verification

### Automated Pass/Fail Evaluation

The repository is itself an automated test harness.

Each test step computes a boolean result from actual modem/network evidence.

Examples include:

- allowed SIM identity;
- modem identity/state availability;
- successful configuration commands;
- presence of the target PLMN;
- manual selection response;
- registration success;
- restoration behavior.

### Conditional Test Execution

The test plan contains executable prerequisite logic.

If the target PLMN is not visible during scanning, later forced-selection behavior is skipped and an explicit abort reason is retained.

### Repeated Observation

Registration is not judged from a single sample.

The runner performs bounded repeated monitoring with delays and stops early on success.

### Evidence-Rich Results

Pass/fail decisions retain the underlying commands, timestamps, raw responses, parsed values, and reason strings.

This makes the automated outcome auditable.

## Engineering Practices

### Defensive Device Discovery

The modem is located by probing actual candidate serial ports rather than assuming one hard-coded path.

### Bounded Waiting

Normal commands, long network scans, and registration rounds all use explicit timeout or round limits.

### State Cleanup

The test flow includes a restoration step after the experimental configuration.

### Structured Logging

Raw evidence and summarized outputs are separated into dedicated artifacts.

### Local Parsing Contracts

Each modem response family has a specific parser returning predictable structured dictionaries.

## Scale and Complexity

### Protocol Complexity

The tool coordinates many AT-command response formats and converts them into a consistent Python representation.

### Temporal Complexity

The network scan may require a long timeout, and registration is observed across multiple delayed rounds.

### Artifact Complexity

A single run produces multiple report formats while preserving the full serial evidence trail.

### Operational Complexity

The harness changes modem operating state, network preference, PDP configuration, and operator selection before restoring automatic behavior.

## Skills Demonstrated

### Languages

- **Python — strong evidence.**

### Cellular Networking

- **AT-command modem control — strong evidence.**
- **Quectel RM520N integration — strong evidence.**
- **PLMN scanning and selection — strong evidence.**
- **LTE registration-state interpretation — strong evidence.**
- **PDP context inspection — strong evidence.**
- **RRC-state inspection — strong evidence.**
- **Cellular signal telemetry parsing — strong evidence.**

### Systems Engineering

- **Serial-device discovery — strong evidence.**
- **PySerial communication — strong evidence.**
- **Timeout management — strong evidence.**
- **Device-state restoration — strong evidence.**

### Test Engineering

- **Automated test orchestration — strong evidence.**
- **Pass/fail evaluation — strong evidence.**
- **Conditional test-plan execution — strong evidence.**
- **Diagnostic evidence capture — strong evidence.**
- **SIM allowlist enforcement — strong evidence.**

### Reporting

- **Structured JSON reporting — strong evidence.**
- **Text report generation — strong evidence.**
- **LaTeX generation — strong evidence.**
- **Optional PDF compilation — strong evidence.**
- **Raw audit logging — strong evidence.**

## Capability Developed

This repository demonstrates a move from using AT commands as an exploratory debugging interface toward encoding a modem/network validation procedure as software.

The important capability is executable test discipline around real hardware: preconditions, configuration, bounded waits, conditional progression, repeated observation, diagnostics, cleanup, and report artifacts are all represented directly in code.

## Portfolio Evolution Context

Repository 098 already provided direct Quectel modem telemetry and NR5G-NSA serving-cell parsing in a broader wireless experiment workspace.

`Satelitte-Project` narrows that capability into a dedicated automated cellular-network acceptance harness.

Compared with the earlier exploratory telemetry use, the modem interaction here is organized as an explicit sequence of test cases with machine-computed results and generated reports.

## Historical Significance

Within the processed corpus so far, this is the earliest observed repository centered on an end-to-end automated Quectel modem network-validation plan with:

- SIM eligibility checks;
- target-PLMN scan gating;
- forced operator selection;
- repeated registration monitoring;
- success/failure diagnostics;
- post-test state restoration;
- machine-readable and printable run reports.

## Overall Repository Narrative

`Satelitte-Project` is a Python-based automated validation system for exercising a Quectel RM520N modem against a Rogers satellite-network test plan.

It discovers the appropriate serial interface, verifies modem and subscriber identity, applies cellular configuration, searches for the target PLMN, conditionally forces operator selection, monitors registration over time, captures success or failure diagnostics, and restores normal modem settings.

The implementation converts raw AT-command interaction into structured parser outputs and explicit test-case results. Every command can be retained in a raw audit log, while the completed run is also rendered into JSON, text, LaTeX, and optionally PDF.

The strongest engineering evidence is therefore not simply cellular networking knowledge but the conversion of a manual hardware/network test procedure into an auditable automated test harness.

# Project Tags

## Project Type

- `automated-test-harness`
- `network-validation-tool`
- `hardware-integration-tool`
- `individual-project`

## Languages

- `python`

## Cellular Networking

- `quectel-modem`
- `cellular-modem`
- `at-commands`
- `lte`
- `plmn-scan`
- `manual-operator-selection`
- `eps-registration`
- `pdp-context`
- `rrc-state`
- `rsrp`
- `cellular-signal-telemetry`

## Systems Engineering

- `serial-communication`
- `pyserial`
- `serial-port-discovery`
- `timeout-management`
- `device-state-restoration`

## Testing and Verification

- `automated-pass-fail`
- `conditional-test-execution`
- `sim-allowlist-validation`
- `repeated-registration-monitoring`
- `diagnostic-capture`
- `test-case-model`

## Reporting

- `json-reporting`
- `text-reporting`
- `latex-reporting`
- `pdf-reporting`
- `raw-command-log`
- `timestamped-logging`

## Portfolio Significance

- `earliest-observed-automated-quectel-network-validation-harness`
- `earliest-observed-plmn-gated-modem-test-plan`
