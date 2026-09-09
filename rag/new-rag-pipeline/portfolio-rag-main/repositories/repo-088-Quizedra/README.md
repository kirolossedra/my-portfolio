# Repository 088 — Quizedra

## Repository Identity

- **Repository:** `kirolossedra/Quizedra`
- **Corpus index:** 088
- **Repository start date:** 2025-06-23
- **Last meaningful update date:** 2025-06-23
- **Latest meaningful commit:** `fb5d8bed12a9992971d6e0ed814c0602dabccabb`
- **Primary repository language:** HTML
- **Project form:** real-time audience feedback / meeting interaction prototype
- **Collaboration classification:** `individual-project`
- **Main files:** `index.html`, `index2.html`

## Evidence Basis

The repository contains two substantive browser pages.

`index.html` is titled `Meeting Feedback - Master Display`.

`index2.html` is titled `Share Your Feedback`.

Both directly integrate Firebase Realtime Database.

The master page generates a QR code that points to the participant page.

The participant page writes feedback.

The master page subscribes to feedback and displays new responses live.

The source includes Firebase web configuration.

This corpus analysis records the architecture without reproducing exact project identifiers or configuration values.

## What the Project Is

Quizedra is a two-screen live meeting-feedback system.

One screen acts as a shared presentation/master display.

The other acts as a mobile-friendly participant submission form.

Participants can scan a QR code from the master screen.

They enter their name and feedback.

The feedback is written to Firebase.

The master screen receives updates in real time.

New messages appear as animated bubbles.

The display also tracks session message and participant counts.

This is closer to a lightweight audience-engagement tool than a traditional quiz engine.

The repository name `Quizedra` should not be allowed to override the actual implementation.

## Project Scope

The implemented scope is a two-page live meeting-feedback experience: QR-based participant onboarding, realtime submission, and a shared master display.

It does not implement quiz scoring, moderation, authenticated sessions, or a general event-management platform.

## Two-Page Interaction Model

### Master Display — `index.html`

The master page:

- shows meeting-feedback branding;
- generates a QR code;
- points the QR code at `index2.html`;
- opens a real-time Firebase listener;
- displays new responses;
- counts messages;
- counts distinct participant names;
- positions feedback bubbles;
- plays a synthesized bubble sound.

### Participant Page — `index2.html`

The participant page:

- collects a name;
- collects a feedback message;
- enforces length limits;
- shows a live character count;
- writes the response to Firebase;
- displays loading, success, and error states;
- resets after successful submission.

The two pages form complementary roles.

## QR-Code Onboarding

The master page calculates the participant-page URL relative to its current URL.

It then uses `qrcodejs` to generate a QR code.

This avoids hard-coding a full deployment URL into the QR logic.

The intended physical workflow is:

```text
presenter opens master page
          |
          v
audience sees QR code
          |
          v
participant scans QR
          |
          v
participant page opens
```

This is an effective bridge between a shared display and personal mobile devices.

## Firebase Data Flow

The participant page writes to:

```text
thegame/messages
```

Each message contains:

- name;
- message;
- timestamp.

The master page subscribes to the same path using a real-time listener.

This produces a direct shared-state system:

```text
participant browser
       |
       v
Firebase Realtime Database
       |
       v
master display listener
```

No custom backend sits between clients and Firebase.

## Session Boundary

The master page records `masterOpenTime`.

It filters incoming messages so the screen shows only those whose timestamps are at or after that session start.

It also tracks message IDs already rendered.

This avoids redisplaying the entire historical Firebase dataset every time the master opens.

It creates a lightweight session concept without creating an explicit session record in the database.

That is a practical but client-local design.

## Real-Time Subscription

The master page uses `onValue`.

Every database update causes the current message set to be evaluated.

The code:

1. converts keyed records into message objects;
2. filters by session time;
3. filters already displayed IDs;
4. schedules bubble creation;
5. recomputes session statistics.

This is event-driven UI behavior built on realtime database synchronization.

## Participant Counting

The master page uses a JavaScript `Set`.

Participant identity is represented by the submitted `name` string.

Distinct names are counted.

There is no account identity.

Two people using the same name are counted as one participant.

One person using multiple names can be counted more than once.

This should be understood as a display statistic, not authenticated attendance.

## Message Bubble Placement

The master page tries to avoid overlapping message bubbles.

It defines an approximate grid.

It tracks occupied positions in a `Set`.

It searches for an available cell.

Older position reservations are periodically cleaned up.

If no suitable grid position is found after repeated attempts, it falls back to random positioning.

This is a simple spatial-layout heuristic.

It is more deliberate than purely random placement.

## Animated Feedback

New bubbles use CSS animation.

The animation combines:

- translation;
- scaling;
- opacity.

The master display delays consecutive messages slightly.

That creates a staged arrival effect when several responses appear together.

## Browser Audio Synthesis

The master creates a Web Audio `AudioContext`.

For each new bubble it attempts to synthesize a short tone using:

- oscillator;
- gain node;
- frequency ramp;
- gain ramp.

The audio context is resumed after user interaction if browser autoplay policy suspended it.

This is direct Web Audio API use.

No audio file is required.

## Participant Validation

The participant page validates:

- non-empty name;
- non-empty message;
- maximum name length;
- maximum message length.

The message character counter updates continuously.

Visual color changes warn as the message approaches the limit.

The input itself is truncated at 500 characters.

## Submission State Management

On submission, the page:

- disables the submit button;
- shows a loading state;
- hides prior error/success states;
- awaits Firebase `push`;
- shows success on completion;
- resets after a delay.

On failure, the page:

- shows an error state;
- re-enables submission;
- automatically hides the error later.

This is a complete asynchronous form lifecycle.

## Architecture / System Shape

```text
                  shared display
                  index.html
                      |
              QR code to participant
                      |
                      v
                index2.html
                      |
                 Firebase push
                      |
                      v
           Firebase Realtime Database
                      |
                 onValue listener
                      |
                      v
              master bubble UI
```

Supporting client APIs:

- QRCode.js
- Web Audio API
- browser DOM/CSS animation

## Technical Stack

- HTML
- CSS
- browser JavaScript
- Firebase
- Firebase Realtime Database
- QRCode.js
- Web Audio API
- responsive browser UI
- realtime event subscription

## Major Engineering Work

### 1. Role-Specific Pages

The developer separated presenter and participant experiences.

That avoids overloading one interface with conflicting needs.

### 2. Frictionless Join Flow

QR onboarding turns a shared screen into a multi-device interaction entry point.

### 3. Real-Time Data Propagation

Participant submissions reach the master through Firebase subscriptions.

### 4. Session Filtering

The master avoids automatically rendering stale messages from before it was opened.

### 5. Duplicate Render Prevention

Message IDs already displayed are tracked.

### 6. Participant and Message Metrics

The UI exposes basic session statistics.

### 7. Spatial Bubble Layout

The application implements a collision-avoidance heuristic for feedback placement.

### 8. Audio Feedback

The app generates a sound in-browser for new messages.

### 9. Input Guardrails

Submission fields have explicit validation and visual character feedback.

## Testing & Verification Evidence

No automated tests are checked in.

No E2E browser test exists in the repository.

No CI workflow is visible.

The commit history shows many rapid iterative updates to the participant page.

That indicates hands-on UI debugging.

It does not establish regression coverage.

The built-in success/error/loading paths support manual verification.

Firebase realtime behavior itself can be observed directly through the two-screen flow.

## Engineering Discipline

Positive evidence:

- clear separation of master vs participant role;
- asynchronous submission handling;
- input validation;
- realtime subscription;
- session-time filtering;
- deduplication of rendered IDs;
- responsive participant form;
- graceful audio fallback;
- URL-relative QR construction;
- user-visible error states.

Constraints:

- Firebase browser configuration embedded in source;
- no authentication;
- no database security rules in repo;
- no explicit session ID;
- session defined only by master-open timestamp;
- participant identity based only on name;
- user-provided strings inserted into `innerHTML` on the master page;
- no sanitization visible before that HTML interpolation;
- no moderation workflow;
- no rate limiting;
- no automated tests.

The `innerHTML` interpolation is a meaningful security limitation.

Untrusted `name` or `message` content could be rendered as markup.

The corpus should not label the application XSS-safe.

## Product Engineering

This prototype is strongly product-shaped.

It solves a recognizable live-meeting workflow:

- presenter needs a shared interaction surface;
- participants need near-zero-friction entry;
- feedback should appear immediately;
- the room benefits from visible participation.

The QR code reduces onboarding friction.

The live bubble visualization creates social feedback.

The simple session stats make participation visible.

This is a good example of product behavior emerging from a very small codebase.

## Scale and Complexity

The repository has only two major pages.

The system nevertheless spans:

- multi-device workflow;
- realtime shared data;
- session filtering;
- QR onboarding;
- dynamic layout;
- audio;
- async form lifecycle.

It is a compact distributed interaction pattern.

Firebase carries most of the backend infrastructure.

## Skills Demonstrated

Evidence supports:

- browser JavaScript;
- realtime database integration;
- event-driven frontend design;
- Firebase `onValue`;
- QR-code generation;
- multi-device interaction design;
- session-state filtering;
- deduplication;
- JavaScript Sets;
- dynamic DOM creation;
- CSS animation;
- Web Audio API;
- responsive forms;
- async form handling;
- UX feedback states.

## What Was Learned / Capability Developed

This project demonstrates a shift from single-user browser utilities to a synchronized multi-user interaction.

The central engineering problem is coordination.

One browser writes.

Another browser subscribes.

The shared screen must decide what is new and how to present it.

That is a useful precursor to larger realtime applications.

## Portfolio Evolution Context

Earlier Firebase projects in the corpus focused on trackers and persistent CRUD-style data.

Quizedra uses Firebase differently.

The primary value is not persistence.

It is immediate cross-device propagation.

This marks a meaningful evolution from “database-backed page” to “live shared experience.”

## Historical Significance

Within the processed corpus, Quizedra is an early clear example of:

- QR-driven multi-device onboarding;
- realtime audience feedback;
- role-separated presenter/participant browser pages;
- Web Audio synthesis;
- realtime Firebase subscription used for live room interaction.

## Limitations and Missing Evidence

No evidence supports:

- authentication;
- moderation;
- anonymous identity protection;
- XSS hardening;
- production scaling;
- rate limiting;
- session persistence model;
- access control;
- automated tests;
- analytics backend;
- quiz scoring.

Despite the repository name, there is no observed MCQ engine.

The product is a live feedback tool in this snapshot.

## Overall Narrative

Quizedra is a compact realtime audience-engagement prototype.

Its strongest idea is the end-to-end room workflow.

A QR code gets participants onto a dedicated submission surface, Firebase propagates responses, and the master display turns them into a live animated conversation.

The implementation shows growing comfort with realtime, multi-client product behavior.

# Project Tags

- `individual-project`
- `web-application`
- `realtime-application`
- `audience-feedback`
- `meeting-feedback`
- `multi-device-workflow`
- `presenter-display`
- `participant-form`
- `html`
- `css`
- `javascript`
- `firebase`
- `firebase-realtime-database`
- `realtime-subscription`
- `qr-code`
- `qrcodejs`
- `web-audio-api`
- `audio-synthesis`
- `session-filtering`
- `message-deduplication`
- `participant-counting`
- `dynamic-bubble-layout`
- `css-animation`
- `async-form-submission`
- `input-validation`
- `responsive-layout`
- `known-xss-risk`
- `earliest-observed-qr-driven-realtime-feedback`
- `earliest-observed-web-audio-api`
