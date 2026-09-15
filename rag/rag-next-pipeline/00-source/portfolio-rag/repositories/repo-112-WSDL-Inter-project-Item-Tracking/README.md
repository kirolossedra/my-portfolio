# WSDL-Inter-project-Item-Tracking

## Repository Identity

- Repository: 112 / 134
- Name: `WSDL-Inter-project-Item-Tracking`
- Repository start date: 2026-07-30
- Last meaningful update date: 2026-07-31
- Latest meaningful commit: `3fae021d03901dfb2f9a18e34dc871e4076e42be`
- Primary type: Authenticated lab-equipment inventory and lifecycle tracker
- Technical field: Frontend engineering, realtime persistence, operational workflow modeling, inventory systems
- Application domain: Cross-project laboratory equipment, serial-number, location, lending, notes, and audit tracking
- Collaboration type: `individual-project`
- Primary languages: HTML, CSS, JavaScript
- Persistence: Firebase Realtime Database
- Authentication: Firebase Authentication

## Collaboration and Authorship Context

The repository is owner-driven and contains the complete browser application plus its Firebase service module. The corpus treats the inventory domain model, validation rules, realtime subscriptions, lifecycle operations, activity logging, reporting/export preparation, authentication integration, and responsive UI as personally attributable repository work.

The Firebase project itself is external infrastructure reused by the application. The engineering evidence is the tracker-specific data model and software behavior implemented under its isolated database root.

## Evidence Basis

The analysis is grounded in:

- `firebase-config.js`;
- `index.html`;
- database-rule documentation embedded in the Firebase service;
- repository history through July 31, 2026.

The root README is minimal. The implementation files provide the authoritative project evidence.

## What This Project Is

`WSDL-Inter-project-Item-Tracking` is an authenticated web application for managing physical laboratory equipment across projects while preserving serial-level location, lending, note, and activity history.

The system is more granular than a quantity-only inventory table.

An equipment record can own multiple registered serial numbers. Each serial can have its own:

- physical location;
- exact-location description;
- loan state;
- borrower identity;
- lifecycle history.

The application also supports item-level notes and photos, generates reporting/export structures, and records user-attributed activity events when operational state changes.

Its central engineering concern is therefore traceability of physical items through real laboratory workflows.

## Project Scope

### Equipment Records

Equipment is represented under a dedicated Firebase root and contains fields such as:

- project;
- item type;
- name;
- comment;
- quantity;
- registered serial count;
- optional Base64 photo;
- creation/update timestamps;
- creating/updating user identity.

The implemented project categories include named research/engineering contexts plus a generic category.

The item-type vocabulary distinguishes devices and components.

### Serial-Level Inventory

Serial numbers are stored separately under their parent equipment item.

Each serial record contains:

- serial number;
- current location;
- lending state;
- borrower when lent;
- lending timestamp;
- creation/update metadata;
- creating/updating user identity.

This allows multiple physical instances of one catalog item to be tracked independently.

### Quantity / Serial Invariant

The application enforces consistency between declared quantity and registered physical serials.

When adding serials, the service refuses an operation that would make the number of serial records exceed the equipment quantity.

When editing equipment quantity, the quantity cannot be reduced below the number of already registered serial numbers.

This is a concrete domain invariant rather than a UI-only convention.

### Duplicate Serial Protection

Incoming serial numbers are normalized for comparison and checked against:

- existing serials;
- other entries in the same incoming batch.

Empty or duplicate entries are excluded, and an operation fails when no valid new serial remains.

When editing a serial, the service also prevents collisions with another serial under the same equipment item.

### Physical Location Model

Location is modeled as structured data rather than one unrestricted string.

The current model includes:

- site;
- sub-location;
- office owner where relevant;
- exact-location note.

Allowed sites map to allowed sub-locations.

When a location refers to someone else's office, the office-owner field becomes required.

This gives the tracker both controlled location categories and a human-readable exact-placement field.

## Lending Workflow

### Lend

A serial can be lent only when it is currently available.

The lending operation requires a borrower/member name and stores the lending timestamp.

### Return

A return operation applies only to a currently lent serial.

Returning clears borrower/lending state and records the serial's returned physical location.

### Movement Guard

A currently lent serial cannot be moved through the normal inventory-location operation.

The application requires it to be returned first.

This avoids representing the same serial simultaneously as externally lent and internally relocated.

### Loan-State Normalization

Loan objects are normalized into a predictable structure containing:

- `isLoaned`;
- `memberName`;
- `loanedAt`.

Borrower data is retained only while the serial is actually lent.

## Activity History

### User-Attributed Events

Operational changes create dedicated activity-log records.

Serial-level logs capture actions such as:

- registration;
- serial modification;
- removal;
- movement;
- lending;
- return.

Item-level logs capture note lifecycle events.

Each log records contextual identity including:

- item ID/name;
- project;
- item type;
- serial ID/number where relevant;
- action type;
- event occurrence time;
- log timestamp;
- actor UID;
- actor email.

### Before/After Context

Modification events retain meaningful previous/next state where implemented.

For example, serial modification logs include previous and next serial/location/loan representations.

Movement logs record origin and destination.

Lending/return logs retain borrower and relevant location context.

### Preserved Historical Logs

Deleting an equipment record deliberately removes its current equipment, serial, and note records while leaving historical activity logs intact.

This makes the audit trail outlive the current inventory object.

### Realtime Log Subscription

The application queries activity history ordered by occurrence time and subscribes to the most recent bounded set.

Incoming logs are sorted newest-first for the application layer.

## Notes and Photos

### Item Notes

Equipment items can have dated notes containing:

- text;
- optional Base64 photo;
- note date;
- creation/update metadata;
- creating/updating user identity.

A note must contain text, a photo, or both.

### Note Lifecycle

The service supports:

- note creation;
- note modification;
- note deletion.

Each operation also creates a corresponding activity-log event.

### Base64 Image Validation

Photos are stored as data URLs and validated before persistence.

Accepted image forms are constrained to supported image MIME types, and the encoded string has an explicit size limit.

This applies both to equipment photos and note photos through the shared normalization function.

## Authentication and Authorization Context

### Firebase Authentication

The service uses Firebase Authentication with:

- email/password sign-in;
- authentication-state observation;
- persistent browser-local sessions;
- sign-out;
- password-reset email.

### Authenticated Database Boundary

The documented Realtime Database rules isolate tracker data under `labEquipmentTracker` and require an authenticated user for tracker reads and writes.

The tracker therefore has a clear application-data boundary inside the reused Firebase project.

### User Stamps

Write operations require a signed-in user and attach user identity to created/updated records.

The helper rejects calls that do not have a Firebase UID.

## Realtime Data Architecture

### Equipment Subscription

The application subscribes to the equipment branch with `onValue` and sorts records by update time.

### Serial Subscription

Serials are subscribed per equipment item and sorted by serial number using numeric-aware comparison.

### Notes Subscription

Notes are subscribed per item and sorted by note/update time.

### Activity Subscription

Activity events are queried by `occurredAt`, limited to a bounded recent set, and streamed live.

The browser therefore receives operational changes without requiring manual page refreshes for each data category.

## Atomic Multi-Path Writes

Several lifecycle operations use one Firebase `update(ref(db), writes)` call containing multiple paths.

For example, registering serials can update in one multi-location write:

- new serial records;
- activity-log records;
- equipment serial count;
- equipment update metadata.

Movement, lending, return, note operations, and serial edits similarly combine the operational state mutation with the corresponding history entry.

This reduces the risk of changing the current state without recording the associated audit event.

## Equipment Creation and Editing

### Domain Validation

Equipment creation/editing validates:

- allowed project;
- allowed item type;
- required name;
- integer quantity;
- bounded quantity range;
- photo encoding/size;
- serial-count compatibility during edits.

### Server Timestamps

Firebase server timestamps are used for created/updated/logged metadata where appropriate.

This avoids depending solely on arbitrary text timestamps supplied through UI fields.

## Reporting and Export Preparation

### Inventory Report Data

The service can read the complete tracker root and assemble report-ready equipment objects that include:

- equipment record;
- sorted serials;
- sorted notes.

The report function can also restrict output to selected item IDs.

### Export Rows

A separate export transformation flattens inventory into tabular rows containing fields such as:

- project;
- item type;
- item name;
- quantity;
- comment;
- serial number;
- formatted location;
- lending status;
- borrower/member name.

Items without registered serials still produce an export row marked as unregistered.

This gives downstream CSV/report generation a normalized row model rather than forcing export code to understand the nested Firebase schema directly.

## Frontend Application

### Responsive Operational Interface

`index.html` implements the full Lab Equipment Tracker UI.

The page contains a dedicated login experience and authenticated application shell with responsive layouts, forms, status styles, tables, cards, and mobile behavior.

### Authentication UX

The login interface is tied to the Firebase authentication service and includes password-reset support through the service module.

### Equipment Operations

The frontend is built around day-to-day lab inventory actions rather than passive display.

Its service contract exposes the functions required for:

- equipment creation/editing/deletion;
- serial registration/editing/removal;
- serial movement;
- lending and return;
- notes;
- report data;
- export rows;
- live activity history.

### Human-Readable State

The design turns nested technical data into operational concepts such as:

- location;
- available/lent status;
- member name;
- project association;
- notes;
- recent activity.

That makes the persistence model usable by people handling physical equipment rather than requiring direct Firebase inspection.

## Architecture and System Shape

```text
Firebase Authentication
          ↓
authenticated browser session
          ↓
Lab Equipment Tracker UI
          ↓
firebase-config.js domain/service layer
          ↓
validation + lifecycle rules
          ↓
Firebase Realtime Database
          │
          ├── equipment
          ├── serials/{itemId}
          ├── notes/{itemId}
          └── activityLogs
```

Many writes follow this pattern:

```text
user action
   ↓
validate domain preconditions
   ↓
construct state change + history event
   ↓
Firebase multi-path update
   ↓
realtime subscriptions refresh UI state
```

## Technical Stack

### HTML / CSS / JavaScript

The application is implemented as a standalone browser UI with substantial responsive styling and JavaScript interaction.

### Firebase Authentication

Firebase handles persistent email/password identity and session observation.

### Firebase Realtime Database

Realtime Database stores inventory, serials, notes, and activity history while supplying live subscriptions.

### Firebase Modular Web SDK

The service imports modular v11 authentication/database functions directly from Firebase's hosted modules.

### Base64 Data URLs

Images are encoded directly into persisted tracker records rather than stored as separate file objects.

## Major Engineering Work

### Serial-Level Lifecycle Modeling

The project models physical instances independently even when multiple serials belong to one equipment definition.

### Domain-Invariant Enforcement

Quantity, serial uniqueness, location validity, and loan-state transitions are validated before writes.

### Audit-Coupled Mutations

Operational changes and activity events are written together through multi-path Firebase updates.

### Historical Preservation

Activity history remains after current equipment records are deleted.

### Realtime Operational State

Equipment, serials, notes, and recent activity are all exposed through live subscriptions.

### Nested-to-Tabular Export Transformation

The service transforms nested inventory/serial/location/loan structures into report/export-friendly rows.

## Testing and Verification

### Runtime Domain Validation

The service contains explicit executable checks for invalid states such as:

- unsupported project/item type;
- invalid quantity;
- quantity below registered serial count;
- duplicate serials;
- invalid location combinations;
- loan without borrower;
- movement while lent;
- lending an already lent serial;
- returning a serial that is not lent;
- invalid/oversized Base64 image data.

### Authenticated Write Preconditions

User-stamped operations require a valid authenticated UID.

### Persistence-Level Rules

The documented Firebase rules require authenticated tracker reads/writes and index activity logs by occurrence time.

## Engineering Practices

### Separation of UI and Data Service

`firebase-config.js` centralizes authentication, persistence, subscriptions, validation, and domain mutations outside the HTML UI code.

### Defensive Normalization

Text, dates, locations, loans, and photos pass through normalization helpers before persistence.

### Atomic Multi-Record Operations

Related current-state and history writes are grouped into one Firebase multi-location update.

### Auditability

Actor identity, occurrence time, action type, item/serial identity, and contextual details are persisted for lifecycle events.

### Local Decision Support

The application keeps location, lending, and equipment decisions at the operational inventory layer rather than requiring administrators to interpret raw database records.

## Product Engineering

### Real Operational Workflow

The software models tasks a laboratory team actually performs:

- register physical equipment;
- identify each unit by serial number;
- know where it is;
- lend it to a person;
- return it;
- move it;
- record notes/photos;
- review history;
- export inventory state.

### Accountability Without Erasing History

Deleting current inventory data does not erase the corresponding historical event stream.

This is significant for shared physical assets because current ownership/state and historical accountability are different concerns.

### Human-Centered Traceability

The system records borrower names, exact location notes, and actor identities alongside machine identifiers.

That makes the tracker useful for coordination between people, not merely for counting objects.

## Scale and Complexity

### Data-Model Complexity

The application manages relationships among equipment, serial instances, notes, locations, loan states, users, and activity events.

### Workflow Complexity

Serials move through multiple guarded operational states rather than simple CRUD fields.

### Realtime Complexity

Multiple independent Firebase subscriptions keep nested operational views current.

### Audit Complexity

Many state changes also require a durable contextual event describing what happened, when, and by whom.

## Skills Demonstrated

### Frontend

- **HTML/CSS/JavaScript application engineering — strong evidence.**
- **Responsive operational UI — strong evidence.**

### Firebase

- **Firebase Authentication — strong evidence.**
- **Firebase Realtime Database — strong evidence.**
- **Realtime subscriptions — strong evidence.**
- **Multi-path updates — strong evidence.**
- **Server timestamps — strong evidence.**

### Data Modeling

- **Inventory domain modeling — strong evidence.**
- **Serial-number lifecycle modeling — strong evidence.**
- **Structured physical-location modeling — strong evidence.**
- **Loan-state modeling — strong evidence.**
- **Audit-event modeling — strong evidence.**

### Validation

- **Domain invariant enforcement — strong evidence.**
- **Duplicate prevention — strong evidence.**
- **State-transition guards — strong evidence.**
- **Base64 image validation — strong evidence.**

### Operational Product Engineering

- **Equipment lending workflow — strong evidence.**
- **Location tracking — strong evidence.**
- **Historical activity preservation — strong evidence.**
- **Inventory report/export preparation — strong evidence.**

## Capability Developed

`WSDL-Inter-project-Item-Tracking` demonstrates movement from simple application data storage toward explicit operational domain modeling.

The system does not merely save an equipment row. It models physical instances, permissible state transitions, structured locations, human borrowing relationships, authenticated actors, and historical events around those changes.

## Portfolio Evolution Context

Earlier processed Firebase projects establish realtime persistence and application workflows.

This repository strengthens that capability through a more explicit operational model: related state/history writes are coupled, domain invariants are enforced before persistence, and current inventory can be removed without destroying historical activity evidence.

It also adds a concrete shared-resource workflow around physical laboratory assets.

## Historical Significance

Within the processed corpus so far, this is the earliest observed repository centered on serial-level laboratory inventory with integrated:

- structured location tracking;
- lending/return state transitions;
- authenticated actor attribution;
- preserved activity history;
- Base64 notes/photos;
- realtime subscriptions;
- nested-to-tabular inventory export preparation.

## Overall Repository Narrative

`WSDL-Inter-project-Item-Tracking` is an authenticated Firebase-backed Lab Equipment Tracker built for managing physical assets across multiple engineering/research projects.

Equipment records define the catalog-level object and quantity, while individual serial records track real physical units. Location rules make sites and sub-locations explicit; lending and return operations enforce valid state transitions; notes can carry text and Base64 images; and activity records preserve who performed operational changes and when.

The Firebase service centralizes domain validation and frequently couples current-state mutations with history events through atomic multi-path updates. Realtime subscriptions expose equipment, serials, notes, and recent activity to the browser, while reporting helpers turn nested inventory into structured report objects and flat export rows.

The strongest engineering evidence is in operational traceability: the application treats physical inventory as a lifecycle involving objects, places, people, state transitions, and history rather than as a static list of quantities.

# Project Tags

## Project Type

- `lab-equipment-tracker`
- `inventory-management`
- `operational-web-application`
- `individual-project`

## Languages

- `html`
- `css`
- `javascript`

## Authentication and Security

- `firebase-authentication`
- `email-password-authentication`
- `persistent-auth-session`
- `authenticated-database-access`

## Database and Data

- `firebase-realtime-database`
- `realtime-subscriptions`
- `atomic-multipath-update`
- `server-timestamps`
- `base64-photo-storage`
- `nested-to-tabular-export`

## Product and Domain

- `serial-number-inventory`
- `equipment-location-tracking`
- `equipment-lending-workflow`
- `borrower-tracking`
- `inventory-notes`
- `activity-history`
- `historical-log-preservation`
- `inventory-reporting`

## Software Engineering Practices

- `domain-invariant-validation`
- `duplicate-prevention`
- `state-transition-guards`
- `separation-of-concerns`
- `audit-coupled-state-change`
- `user-attribution`

## Frontend

- `responsive-web-ui`
- `operational-dashboard`

## Portfolio Significance

- `earliest-observed-serial-level-lab-equipment-lifecycle-tracker`
- `earliest-observed-audit-coupled-firebase-inventory-workflow`
