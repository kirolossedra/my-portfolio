# Aquaseninsg-Auto-Test-Kit

## Repository Identity

- Repository: 108 / 134
- Name: `Aquaseninsg-Auto-Test-Kit`
- Repository start date: 2026-05-25
- Last meaningful update date: 2026-06-15
- Latest meaningful commit: `e7208d6541e94a050cc5cf101d29fac042c5487c`
- Primary type: IoT gateway provisioning and hardware-validation toolkit
- Technical field: IoT systems, desktop tooling, cloud databases, MQTT, embedded firmware, test simulation
- Application domain: AquaSensing/AquaHub gateway and sensor validation workflows
- Collaboration type: `individual-project`
- Primary languages: Python, C/C++, HTML, CSS, JavaScript

## Collaboration and Authorship Context

The repository history is owner-driven and combines several utilities built around a common gateway/sensor testing context. The corpus treats the Azure SQL manager, MQTT publisher, ESP32 simulator, and alert-dashboard implementation as personally attributable repository work.

External services such as Azure SQL, Azure IoT Hub, and Firebase are infrastructure used by the tooling. The engineering claim is the client-side integration, validation workflow, data modeling, and test-support logic implemented in this repository.

## Evidence Basis

The analysis is grounded in:

- `Gateway-Registerar.py`;
- `hardware-stub.py`;
- `main.c`;
- `index.html`;
- repository history through the June 15 debugging update.

The files represent complementary parts of one operational test-kit environment rather than unrelated toy snippets.

## What This Project Is

`Aquaseninsg-Auto-Test-Kit` is a collection of engineering utilities for provisioning, simulating, and observing AquaSensing gateway/sensor behavior.

The repository addresses several stages of a hardware validation workflow:

- registering and auditing gateway-build metadata in Azure SQL;
- simulating hardware telemetry into Azure IoT Hub over MQTT;
- simulating periodic sensor power events from an ESP32 into Firebase;
- observing resulting alerts through a browser dashboard.

This creates a practical test ecosystem around devices that have firmware, cellular/SIM attributes, BLE build modes, cloud telemetry, and quality-control state.

## Project Scope

### Gateway Registration Manager

`Gateway-Registerar.py` implements a CustomTkinter desktop application backed by Azure SQL.

Its declared workflow includes:

- password-based database login;
- Azure SQL connection testing;
- automatic table creation;
- gateway-record insertion;
- record updates;
- searching and viewing records;
- loading an existing record back into the form;
- deleting records.

The application therefore acts as an operational CRUD tool around gateway provisioning history.

### Gateway Addition Data Model

The Azure SQL table stores concrete gateway-build and validation fields including:

- gateway ID;
- programmer/operator name;
- ICCID;
- BLE build mode;
- LTE firmware status;
- quality-check result;
- LTE modem firmware version;
- SIM provider;
- data-limit enforcement;
- in-force date;
- deployment/testing purpose;
- internal/external usage scope;
- intended user;
- creation/update timestamps.

Several columns contain SQL `CHECK` constraints so allowed workflow states are enforced by the database schema.

### Azure SQL Bootstrap

The desktop tool checks `INFORMATION_SCHEMA.TABLES` and creates `dbo.GatewayAdditionLogs` when it does not already exist.

This means schema bootstrapping is embedded in the application rather than requiring a separate manual database initialization step.

### Search and Maintenance

The database manager supports parameterized inserts, updates, deletes, and searches.

Search spans multiple operational fields and limits the result set to recent records.

Parameterized queries are used for user-provided values rather than string-concatenating form input directly into SQL values.

### Azure IoT Hub Hardware Stub

`hardware-stub.py` implements a desktop MQTT publisher targeting an Azure IoT Hub endpoint.

The GUI allows a tester to supply:

- MQTT username;
- password / SAS token;
- beacon MAC address.

The remaining connection settings are fixed for the test environment.

The generated JSON payload contains:

- RSSI;
- MAC address;
- beacon data;
- gateway ID.

### MQTT Transport

The hardware stub uses Paho MQTT with:

- MQTT v3.1.1;
- TLS;
- certificate verification;
- port 8883;
- QoS 1;
- explicit keepalive;
- Azure IoT device telemetry topic structure.

Connection and publish operations are performed in a background thread so the Tkinter UI is not blocked during network operations.

### Test Input Validation

Before publishing, the hardware-stub GUI validates:

- username presence;
- password/token presence;
- MAC-address structure.

The MAC is normalized to uppercase and the payload preview is refreshed from the validated value.

### ESP32 Sensor-Power Simulator

`main.c` implements an ESP32-based test loop.

The firmware:

- connects to Wi-Fi;
- configures GPIO 18 as a sensor-power output;
- turns the GPIO on;
- posts an alert to Firebase when power is enabled;
- keeps the output on for a fixed interval;
- turns it off;
- waits until the next fixed cycle.

The implemented timing is a 30-second powered period within a three-minute cycle.

### Firebase Alert Posting

The ESP32 firmware uses `HTTPClient` and `WiFiClientSecure` to send JSON to a Firebase Realtime Database REST endpoint.

The alert payload includes:

- kit owner;
- sensor identifier;
- Firebase server timestamp.

The firmware also reconnects to Wi-Fi if connectivity is lost before posting.

### Browser Alert Dashboard

`index.html` implements a responsive dashboard for displaying kit alerts.

The interface includes:

- summary statistics;
- searchable alert records;
- timestamp presentation;
- owner and sensor presentation;
- live/new-alert visual treatment;
- endpoint information;
- login UI;
- responsive table and card behavior.

The dashboard is designed as the observation surface for events generated by the simulated hardware path.

## Architecture and System Shape

The repository contains two related cloud/test paths.

### Gateway Provisioning Path

```text
CustomTkinter desktop UI
          ↓
Python DatabaseManager
          ↓
ODBC Driver 18
          ↓
Azure SQL
          ↓
dbo.GatewayAdditionLogs
```

### Hardware Simulation Path

```text
Tester GUI
   ↓
Paho MQTT publisher
   ↓ TLS / QoS 1
Azure IoT Hub
```

and:

```text
ESP32 GPIO cycle
      ↓
Firebase REST POST
      ↓
Realtime alert data
      ↓
Browser dashboard
```

The repo therefore spans provisioning records, cloud telemetry simulation, embedded event generation, and browser observation.

## Technical Stack

### Python

Python implements the two desktop utilities:

- Azure SQL gateway management;
- MQTT hardware simulation.

### CustomTkinter / Tkinter

Desktop interfaces provide login, CRUD forms, search, telemetry input, payload preview, status reporting, and logs.

### Azure SQL and PyODBC

`pyodbc` connects to Azure SQL using ODBC Driver 18 with encrypted transport and certificate validation.

SQL handles schema creation, constrained operational fields, and CRUD persistence.

### Paho MQTT

Paho MQTT simulates a device telemetry publisher against Azure IoT Hub.

### TLS

The MQTT client uses TLS with certificate verification enabled and explicitly rejects insecure TLS mode.

### ESP32 / Arduino Libraries

The embedded simulator uses:

- `WiFi.h`;
- `HTTPClient.h`;
- `WiFiClientSecure.h`.

These support connectivity, HTTPS requests, and GPIO-driven test behavior.

### Firebase Realtime Database

Firebase REST endpoints receive simulated alert events and provide a data source for the browser-side monitoring workflow.

### HTML / CSS / JavaScript

The dashboard provides a responsive web interface around alert records and test-state presentation.

## Major Engineering Work

### Operational Gateway Data Modeling

The Azure SQL schema captures both identity and lifecycle/quality metadata for gateways.

It is not a generic key/value table: typed columns and `CHECK` constraints encode allowed build and deployment states.

### Self-Bootstrapping Database Tool

The application can establish its own required table if it is absent.

That reduces setup friction for technicians using the registration utility.

### Parameterized CRUD Layer

Database operations are centralized in `DatabaseManager` and use parameters for user data.

The GUI is therefore separated from direct cursor-management details.

### Simulated IoT Telemetry

The MQTT publisher creates a controllable stand-in for hardware telemetry.

This allows a tester to vary beacon identity and credentials while holding the rest of the test payload stable.

### Background Network Work

MQTT connection/publish operations run on a daemon thread and use Tkinter's event loop to apply UI updates safely afterward.

This avoids freezing the desktop interface during connection waits.

### Publish Completion Signaling

Threading events are used to wait for MQTT connection and publish callbacks with bounded timeouts.

The application distinguishes broker rejection, timeout, publish-call failure, and successful publish completion.

### Embedded Timing Simulation

The ESP32 code models a hardware behavior over time rather than issuing a one-shot request.

The cycle tracks elapsed execution time and waits only the remaining duration needed to preserve the intended period.

### End-to-End Alert Visibility

The repository pairs event generation with a browser monitoring surface, making simulated hardware activity inspectable outside the device serial console.

## Testing and Verification

### Hardware Stub Validation

The MQTT utility validates user inputs before attempting cloud communication.

### Connection Outcome Verification

MQTT callbacks and return codes are used to determine connection and publish success.

### Azure SQL Connection Validation

The gateway manager contains an explicit database-login/connection path before entering the record-management workflow.

### Database Constraints

SQL `CHECK` constraints provide persistence-level validation for several enumerated gateway fields.

### Observable Embedded Test Cycle

The ESP32 reports connection status, power transitions, HTTP status codes, and Firebase responses over serial output.

## Engineering Practices

### Separation of Concerns

The repository separates:

- provisioning data management;
- cloud telemetry simulation;
- embedded hardware simulation;
- browser observation.

### Defensive Validation

User-entered MQTT identity data and gateway database fields are validated before operational use.

### Secure Transport Configuration

Azure SQL enables encryption and certificate validation, while MQTT uses TLS with insecure mode disabled.

### Structured Operational Data

Gateway build metadata is persisted in explicit relational columns rather than free-form notes alone.

### Test Substitution

The hardware stub provides a software substitute for physical telemetry generation, allowing cloud paths to be exercised independently of the full production device.

## Scale and Complexity

### Integration Complexity

The toolkit touches Azure SQL, Azure IoT Hub, MQTT/TLS, Firebase REST, ESP32 firmware, desktop GUIs, and a browser dashboard.

### Workflow Complexity

The provisioning manager represents multiple hardware/firmware state fields and supports their full CRUD lifecycle.

### Hardware/Cloud Boundary

The ESP32 and MQTT stub both generate cloud-visible events, creating multiple ways to test upstream/downstream integration paths.

## Skills Demonstrated

### Python and Desktop Tooling

- **Python application development — strong evidence.**
- **Tkinter / CustomTkinter UI development — strong evidence.**
- **Background-threaded network operations — strong evidence.**

### Databases

- **Azure SQL integration — strong evidence.**
- **PyODBC — strong evidence.**
- **Relational schema design — strong evidence.**
- **Parameterized CRUD — strong evidence.**
- **SQL constraints — strong evidence.**

### IoT and Networking

- **MQTT device telemetry — strong evidence.**
- **Azure IoT Hub integration — strong evidence.**
- **TLS configuration — strong evidence.**
- **QoS-aware publishing — strong evidence.**
- **JSON telemetry design — strong evidence.**

### Embedded Systems

- **ESP32 firmware — strong evidence.**
- **GPIO control — strong evidence.**
- **Wi-Fi reconnection logic — strong evidence.**
- **Periodic hardware simulation — strong evidence.**
- **HTTPS REST posting — strong evidence.**

### Frontend

- **HTML/CSS dashboard engineering — strong evidence.**
- **Responsive operational UI — strong evidence.**
- **Alert visualization — strong evidence.**

### Test Engineering

- **Hardware stubbing — strong evidence.**
- **Cloud-path simulation — strong evidence.**
- **Provisioning audit tooling — strong evidence.**
- **Input and connection validation — strong evidence.**

## Capability Developed

This repository demonstrates the ability to build support tooling around a real IoT system rather than only writing device firmware or cloud code in isolation.

It treats provisioning, simulated telemetry, periodic hardware behavior, cloud persistence, and operator visibility as connected validation concerns.

## Portfolio Evolution Context

Earlier processed repositories contain embedded systems, Firebase applications, networking research, and hardware-control scripts.

`Aquaseninsg-Auto-Test-Kit` combines those strands in an operational IoT validation context with Azure SQL and Azure IoT Hub.

The notable transition is from experimenting with individual technologies toward building technician-facing tools and controllable substitutes around a device lifecycle.

## Historical Significance

Within the processed corpus so far, this is the earliest observed repository combining:

- an Azure SQL gateway provisioning log;
- an Azure IoT Hub MQTT hardware stub;
- ESP32-based periodic event simulation;
- Firebase alert persistence;
- a browser monitoring surface.

## Overall Repository Narrative

`Aquaseninsg-Auto-Test-Kit` is an IoT engineering support suite built around gateway provisioning and hardware/cloud validation.

A CustomTkinter application manages structured gateway addition logs in Azure SQL, including SIM, BLE, LTE firmware, quality-control, deployment-purpose, and usage metadata. A separate Tkinter application simulates device telemetry into Azure IoT Hub using MQTT over TLS. An ESP32 program simulates periodic sensor-power activity and posts server-timestamped alerts into Firebase, while the browser dashboard provides an operator-facing view of those alerts.

The strongest evidence is systems integration across the device lifecycle: relational provisioning records, cloud messaging, embedded simulation, validation logic, and observation tooling are all represented as practical test infrastructure.

# Project Tags

## Project Type

- `iot-test-toolkit`
- `gateway-provisioning-tool`
- `hardware-simulation`
- `individual-project`

## Languages

- `python`
- `c-plus-plus`
- `html`
- `css`
- `javascript`

## Desktop Tooling

- `tkinter`
- `customtkinter`
- `desktop-operations-tool`

## Database and Cloud

- `azure-sql`
- `pyodbc`
- `sql-server`
- `relational-schema`
- `database-check-constraints`
- `parameterized-sql`
- `firebase-realtime-database`
- `firebase-rest-api`

## IoT and Networking

- `azure-iot-hub`
- `mqtt`
- `paho-mqtt`
- `mqtt-qos-1`
- `tls`
- `json-telemetry`
- `hardware-stub`

## Embedded and Hardware

- `esp32`
- `gpio-control`
- `wifi`
- `periodic-device-cycle`
- `https-post`

## Testing and Verification

- `input-validation`
- `connection-validation`
- `cloud-path-simulation`
- `hardware-behavior-simulation`
- `provisioning-audit-log`

## Frontend

- `operational-dashboard`
- `responsive-web-ui`
- `alert-monitoring`

## Portfolio Significance

- `earliest-observed-azure-iot-mqtt-hardware-stub`
- `earliest-observed-azure-sql-gateway-provisioning-tool`
- `earliest-observed-integrated-iot-provisioning-simulation-dashboard-toolkit`
