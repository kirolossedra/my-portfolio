# Repository 074 — Habit-Tracker

## Repository Identity

- **Repository:** `kirolossedra/Habit-Tracker`
- **Repository start date:** 2024-12-27
- **Last meaningful update date:** 2024-12-27
- **Latest meaningful commit:** `7b13277ba1e8e236fb3194b1b64cecfb45b02fd8`
- **Primary technical field:** mobile-oriented frontend interaction
- **Application domain:** daily activity / habit tracking
- **Primary technologies:** HTML, CSS, JavaScript
- **Project context:** personal frontend utility
- **Collaboration classification:** `individual-project`

## Evidence Basis

The repository contains:

- a small README;
- one substantial `index.html`.

The single HTML file contains the full interface, styling, state, and interaction logic.

## What This Project Is

`Habit-Tracker` is a browser-based daily-activity tracker optimized for touch interaction.

Users can:

- create activities;
- classify them as core or non-core;
- attach an emoji;
- mark an activity completed;
- edit an activity;
- delete an activity.

The implementation is intentionally compact: the entire application lives in one static page.

## Application Shape

```text
Browser page
    ↓
Activity list
    ↓
Add button
    ↓
Modal form
  ├─ name
  ├─ core / non-core type
  └─ emoji
    ↓
Dynamic activity card
    ↓
Interactions
  ├─ click → completed
  └─ long press → context menu
                  ├─ edit
                  └─ delete
```

## Mobile-Oriented Layout

The viewport disables user scaling and the page is designed around a full-height mobile-style interface.

The CSS includes:

- flexbox layout;
- scrollable activity list;
- circular add button;
- touch-action control;
- disabled text selection;
- modal overlay;
- custom context menu.

These choices show deliberate consideration of phone interaction rather than desktop-only layout.

## Activity Creation

The add button opens a modal.

The modal captures:

- activity name;
- activity type;
- selected emoji.

When the user confirms a valid name, JavaScript creates a new list item dynamically.

## Activity Type

The user can distinguish activities as:

- `core`;
- `non-core`.

That introduces lightweight categorization into the tracker.

## Emoji Selection

The modal presents a set of emoji choices.

Clicking an emoji:

- clears previous selection state;
- marks the new emoji as selected;
- stores it for activity creation.

The emoji becomes part of the visible activity card.

## Dynamic Color Assignment

New activities receive a randomly selected pastel background from a predefined palette.

This adds visual differentiation without requiring a color picker.

## Completion Interaction

A normal click toggles the `completed` class.

The completed state changes presentation through:

- muted background;
- line-through text.

The browser DOM itself therefore acts as the active task-state model during the session.

## Long-Press Interaction

The application implements its own long-press gesture.

### Touch Start

A timer begins on `touchstart`.

### Trigger Threshold

After 500 milliseconds, the custom context menu is shown.

### Cancellation

The timer is cleared on:

- `touchend`;
- `touchmove`.

This prevents a movement gesture from unintentionally triggering the menu.

## Custom Context Menu

The context menu offers:

- Edit;
- Delete.

Its position is calculated relative to the selected activity.

This is a nontrivial mobile interaction pattern implemented directly with DOM events and geometry.

## Edit Workflow

Selecting Edit:

1. stores the current item as `editingActivity`;
2. extracts its name and type;
3. fills the modal fields;
4. changes the modal title;
5. opens the modal.

Confirming the modal updates the existing card rather than creating a new one.

## Delete Workflow

Selecting Delete removes the active list item from the DOM.

The context menu is then dismissed.

## Overlay and Modal State

The modal and overlay are toggled together through CSS classes.

Closing the modal resets:

- input text;
- activity type;
- selected emoji;
- editing state;
- modal title.

This keeps add and edit workflows inside one reusable component.

## Touch Behavior Control

The page deliberately suppresses browser defaults on activity items.

It uses:

- `touch-action: none`;
- `preventDefault`;
- non-passive touch listeners.

That gives the application control over long-press behavior.

## Engineering Practices

### Reusable Add/Edit Workflow

One modal supports both creation and editing.

### Explicit Interaction State

JavaScript tracks:

- selected emoji;
- currently edited item;
- long-press timer;
- current context-menu item.

### Event-Driven Architecture

The whole application is driven by DOM events rather than polling.

### Interaction Cleanup

Timers are cleared on touch cancellation paths.

### Input Validation

Empty activity names are rejected before creation.

## Product Engineering

Even as a small static app, the project contains several product-facing details:

- activity categorization;
- completion state;
- edit/delete flows;
- emoji personalization;
- touch-first long-press behavior;
- modal entry;
- custom context menu;
- mobile-friendly layout.

This makes it a usable interaction prototype rather than a static mockup.

## Scale and Complexity

The repository has one implementation file.

Within that file, it combines:

- state management;
- dynamic DOM creation;
- modal UI;
- touch gestures;
- context-menu positioning;
- editing;
- deletion;
- completion toggling.

The compact file therefore contains a meaningful amount of frontend interaction logic.

## Skills Demonstrated

### Frontend

- **HTML — strong evidence.**
- **CSS — strong evidence.**
- **JavaScript — strong evidence.**
- **Dynamic DOM construction — strong evidence.**
- **Modal UI — strong evidence.**

### Mobile Interaction

- **Touch events — strong evidence.**
- **Long-press gesture — strong evidence.**
- **Custom context menu — strong evidence.**
- **Touch-default suppression — strong evidence.**

### Product Behavior

- **Create/edit/delete interaction — strong evidence.**
- **Completion-state toggling — strong evidence.**
- **Lightweight activity categorization — strong evidence.**

## Capability Developed

This project extends earlier web interaction experience into touch-first application behavior.

The distinctive addition is custom gesture handling: a long press becomes a secondary-action surface for editing or deleting an item.

## Portfolio Evolution Context

This is the earliest processed repository centered on a habit/activity-tracking interface.

It also provides the earliest direct evidence in the processed corpus of an explicitly implemented touch long-press context-menu workflow.

## Historical Significance

`Habit-Tracker` is a small but revealing product prototype.

The focus is less on algorithms and more on interaction design: how a user creates, completes, edits, and deletes personal items on a phone-sized surface.

## Overall Repository Narrative

`Habit-Tracker` is a self-contained mobile-oriented web utility for managing daily activities.

Its strongest engineering evidence is the interaction layer: modal reuse, dynamic DOM state, touch timers, long-press detection, context-menu positioning, edit/delete actions, completion state, and personalized visual cards.

# Project Tags

## Project Type

- `habit-tracker`
- `single-page-web-application`
- `interactive-utility`
- `frontend-prototype`

## Collaboration and Authorship

- `individual-project`

## Languages

- `html`
- `css`
- `javascript`

## Frontend

- `dynamic-dom`
- `modal-dialog`
- `mobile-first-ui`
- `touch-interaction`
- `touch-long-press`
- `custom-context-menu`
- `emoji-picker`
- `event-driven-ui`

## Product Behavior

- `activity-tracking`
- `completion-state`
- `create-edit-delete-ui`
- `activity-categorization`

## Portfolio Significance

- `earliest-observed-habit-tracker`
- `earliest-observed-touch-long-press`
