# Repository 130 — LogicApp

## Repository Identity

- **Repository:** `kirolossedra/LogicApp`
- **Repository index:** 130
- **Start date:** 2026-03-17
- **Latest meaningful update:** 2026-03-17
- **Latest meaningful commit:** `17652a95372c6c3284fde956d5b45079527a63c7` — `Create logicapp.json`
- **Primary artifact type:** exported Azure Logic Apps workflow definition
- **Collaboration classification:** `individual-project-with-external-services`
- **Primary implementation:** `logicapp.json`

## What This Repository Is

`LogicApp` is a compact integration/orchestration repository centered on one exported Azure Logic Apps workflow.

The workflow consumes sensor events from Azure Service Bus, parses a Base64-encoded sensor payload, records leak-event metadata in SQL, resolves sensor/client ownership data, routes water-leak notifications through email and SMS, and forwards the sensor event to an HTTP dashboard endpoint.

The repository therefore represents integration engineering rather than a conventional application with a custom frontend and backend.

Its value is in the workflow topology, branching logic, connector composition, event normalization, notification routing, and data-flow coordination across managed services.

## Evidence Boundary

The repository contains Microsoft Logic Apps workflow configuration that references managed connectors and provider infrastructure.

Those providers are external systems, not owner-authored implementations.

The evidence attributable to the project is the composition and orchestration of:

- Service Bus event ingestion;
- JSON parsing;
- event identity and timestamp derivation;
- SQL reads/writes;
- leak-state branching;
- client and linked-user lookup;
- email notification routing;
- SMS notification routing;
- special-recipient routing through Excel Online;
- HTTP forwarding;
- explicit workflow termination paths.

The repository does **not** establish authorship of:

- Azure Service Bus;
- Azure SQL;
- Microsoft Office 365;
- Excel Online Business;
- Twilio;
- the Azure Logic Apps runtime;
- the downstream dashboard service.

## Repository Shape

The repository is intentionally small.

Observed source files are:

```text
README.md
logicapp.json
```

The implementation is almost entirely declarative workflow JSON.

That makes this repository useful evidence of low-code/serverless orchestration skill rather than evidence of a large handwritten codebase.

## Core Business Scenario

The workflow handles water-leak sensor events.

A sensor message enters a queue-backed workflow, the payload identifies the sensor, the workflow records an event-level database row, loads sensor metadata, evaluates existing leak state, and conditionally sends human-facing alerts.

The workflow combines machine-event processing with business notification policy.

A simplified flow is:

```text
Service Bus queue event
        |
        v
Decode Base64 message payload
        |
        v
Parse sensor JSON
        |
        +-----------------------> HTTP dashboard webhook
        |
        v
Create event identity + EST timestamp
        |
        v
Insert leak event metadata in SQL
        |
        v
Load sensorDetails row by MAC
        |
        v
Evaluate leak/update state
        |
        v
Load client + linked users
        |
        +--> email notifications
        |
        +--> SMS routing
        |
        +--> special institutional recipient branch
        |
        v
Terminate successful workflow path
```

## Event Ingestion

The workflow uses an Azure Service Bus API connection as its trigger.

The queue is `aquaqueue`.

The trigger is configured as a recurring batch-head read rather than a custom event-consumer process.

Important orchestration characteristics include:

- recurrence-based polling;
- a sub-second configured interval;
- Eastern Standard Time configuration;
- a maximum-message batch size;
- `splitOn` processing so trigger-body items can be handled independently.

This demonstrates use of a managed queue as an integration boundary.

## Sensor Message Parsing

The trigger body carries message data in encoded form.

The workflow explicitly decodes the Base64 content and converts the result to JSON before schema validation.

The parsed payload schema includes fields for:

- `Data`;
- `GWID`;
- `MAC`;
- `RSSI`.

The sensor MAC becomes an important lookup key later in the workflow.

The workflow therefore performs transport-to-domain normalization before business branching.

## Message Identity

The workflow captures the Service Bus message identifier into an initialized variable.

That identifier is then persisted as the leak-event message UID.

Using the queue message identity as persisted event metadata provides a traceable bridge between transport-level events and SQL state.

## Time Normalization

The workflow initializes a timestamp variable by converting UTC to Eastern Standard Time.

The resulting timestamp is inserted with the leak-event metadata.

This is a practical integration concern because message transport, databases, and human-facing operations frequently use different time conventions.

The workflow makes the conversion explicit instead of relying on implicit local runtime time.

## SQL Persistence

Azure SQL is used through the managed SQL connector.

Observed tables include:

- `leakParams`;
- `sensorDetails`;
- `clientInfo`;
- `linkedUser`.

### `leakParams`

A leak-event row is inserted with at least:

- the unique message ID;
- the normalized event timestamp.

This creates an event-level persistence record before later notification logic.

### `sensorDetails`

The workflow loads a sensor row using the parsed MAC address.

Sensor metadata supplies business context such as:

- associated client identifier;
- physical location;
- building;
- floor;
- unit;
- spot;
- leak-state fields;
- notification-related state.

### `clientInfo`

The workflow resolves the client associated with the sensor.

Client data is then used to route direct email/SMS notifications.

### `linkedUser`

The workflow queries linked users by client identifier.

This supports one-to-many notification routing rather than assuming every sensor has only one human recipient.

## Leak-State Logic

The workflow contains conditional logic around the sensor's leak-update state.

The orchestration is therefore not simply:

```text
message -> send alert
```

It incorporates persisted sensor state before deciding how to proceed.

One observed branch updates a drying-day field to a fixed value under a condition and participates in the broader `leak_update` handling path.

This is evidence of business-state-aware orchestration.

## Demo Sensor Branch

The workflow includes a `Demo Sensor` condition based on sensor-location content.

This shows that the orchestration distinguishes special/demo devices from ordinary production routing inside the same workflow definition.

That distinction is implemented as workflow policy rather than a separate service.

## Snooze / Notification Suppression

The workflow contains conditions related to notification snoozing.

The important architectural point is that notification delivery is not treated as unconditional.

Stored business state can suppress or redirect outward communication.

This is a useful example of integrating operational state with notification side effects.

## Email Notification Flow

Office 365 is used through a managed API connection.

The workflow composes high-importance water-leak email messages from resolved client and sensor information.

The content includes contextual location information and the triggering sensor identifier.

Email therefore occurs after data enrichment, not directly from the raw queue payload.

This sequence reduces the amount of business metadata that must be encoded in the device event itself.

## Linked-User Notification Flow

The SQL query against `linkedUser` supports notification of additional users associated with the client.

The workflow uses iteration to deliver notifications across the returned recipient set.

This shows explicit fan-out behavior inside the workflow.

## SMS Notification Flow

Twilio is used through a managed connector for SMS delivery.

The normal branch resolves the client contact and sends a leak alert containing relevant sensor-location context.

The connector is external; the repository's engineering evidence is the conditional routing and data composition around it.

## Special Institutional Routing

The workflow contains a special branch triggered by client data matching an institutional marker.

In this path it:

1. reads rows from an Excel Online Business workbook;
2. iterates over those rows;
3. extracts recipient numbers;
4. sends leak-notification SMS messages through Twilio;
5. terminates the branch after the fan-out completes.

This is a distinct routing strategy from the normal single-client-contact SMS path.

It demonstrates support for recipient lists maintained outside the primary SQL schema.

## Excel Online Integration

Excel Online Business acts as an operational recipient source for the special branch.

The workflow therefore combines:

- transactional SQL data;
- queue event data;
- spreadsheet-maintained recipient data.

This is characteristic of business integration systems where not every operational data set is controlled by one application database.

## HTTP Forwarding

After parsing the incoming sensor message, the workflow also performs an HTTP POST to a dashboard webhook.

Before forwarding, it rewrites/adds gateway identity using IoT/trigger metadata.

The HTTP side effect is independent from the later SQL-and-notification flow.

This means a single incoming sensor event can feed both:

- application/dashboard processing;
- leak-state persistence and alerting.

## Parallel Side Effects

The workflow structure shows multiple actions running after payload parsing.

That reflects an orchestration mindset in which one event can produce several coordinated downstream effects without requiring one monolithic service function.

The declarative run-after graph is part of the design.

## Run-After Semantics

Logic Apps `runAfter` relationships are used throughout the exported definition.

The workflow explicitly controls whether an action waits for:

- success;
- failure;
- completion of earlier branches.

This is important because integration workflows must define failure propagation and branch continuation, not just nominal ordering.

## Explicit Termination

Several branches terminate explicitly with a successful run status.

These termination nodes are used to stop further processing once a policy branch has completed or intentionally suppressed subsequent actions.

This is cleaner than allowing irrelevant downstream actions to remain reachable after a special-case branch.

## Managed Connector Parameters

The exported definition uses the Logic Apps `$connections` object to bind workflow actions to managed connectors.

Observed connector families include:

- Service Bus;
- SQL;
- Office 365;
- Excel Online Business;
- Twilio.

The corpus intentionally records connector *types* and roles, not copied subscription identifiers, resource IDs, phone numbers, or recipient addresses from the exported workflow.

## Security and Privacy Boundary

The source artifact contains operational integration configuration and notification templates.

For portfolio retrieval, the important skill evidence is architectural.

Sensitive operational values are not required to demonstrate:

- connector composition;
- data flow;
- event parsing;
- conditional routing;
- SQL enrichment;
- notification fan-out.

## Event-Driven Design Skills

This repository provides evidence of understanding:

- asynchronous event ingestion;
- queue-backed processing;
- event identifiers;
- payload decoding;
- schema-based parsing;
- event enrichment;
- stateful conditional routing;
- side-effect orchestration;
- managed integration connectors.

## Integration Engineering Skills

The workflow crosses multiple system boundaries:

```text
Service Bus
SQL
Office 365
Excel Online
Twilio
HTTP API
```

The engineering challenge is therefore coordination across heterogeneous interfaces rather than implementing one algorithm in isolation.

## Data-Mapping Skills

The workflow repeatedly maps values between:

- queue transport fields;
- parsed JSON fields;
- SQL row fields;
- email templates;
- SMS templates;
- HTTP request bodies.

This is direct evidence of integration data transformation.

## Business-Rule Encoding

Conditions encode operational policy such as:

- leak-update state;
- demo-sensor behavior;
- snoozed notifications;
- special institutional routing.

The repository shows how business rules can be represented in a managed workflow engine.

## Operational Observability

The persisted message UID and timestamp improve traceability across events.

The workflow's explicit run graph also provides the per-action execution visibility inherent to Logic Apps.

The repository itself does not contain a custom observability service, so the corpus does not inflate this into a standalone monitoring implementation.

## Maturity Assessment

This is a **focused operational workflow artifact**, not a broad software product.

Its maturity comes from the number of integrated systems and business branches represented in a single deployable Logic Apps definition.

The repository is strongest as evidence of:

- Azure workflow orchestration;
- event-driven integration;
- SQL-backed enrichment;
- multi-channel notification routing;
- managed connector composition.

Its small repository size should not be confused with trivial system interaction: the workflow coordinates several external services and domain-state decisions.

## RAG Retrieval Guidance

This repository is a strong match for queries involving:

- Azure Logic Apps;
- Service Bus queue consumption;
- managed connectors;
- event-driven workflows;
- workflow orchestration;
- SQL enrichment of queued events;
- Office 365 email automation;
- Twilio SMS automation;
- Excel-driven recipient routing;
- water-leak alerting;
- IoT event processing;
- event fan-out;
- low-code integration engineering.

It is a weak match for queries asking for:

- a custom Azure Service Bus implementation;
- a custom SQL database engine;
- a Twilio SDK implementation;
- a conventional frontend/backend web architecture.

Those systems are consumed as external managed services.

# Project Tags

- `azure-logic-apps`
- `workflow-orchestration`
- `event-driven-workflow`
- `azure-service-bus`
- `queue-processing`
- `sensor-event-processing`
- `iot-integration`
- `water-leak-alerting`
- `base64-payload-decoding`
- `json-schema-parsing`
- `event-enrichment`
- `azure-sql-connector`
- `sql-data-enrichment`
- `office365-email-automation`
- `twilio-sms-automation`
- `excel-online-integration`
- `notification-routing`
- `recipient-fan-out`
- `conditional-workflow`
- `managed-connectors`
- `http-webhook-forwarding`
- `business-process-automation`
- `integration-engineering`
