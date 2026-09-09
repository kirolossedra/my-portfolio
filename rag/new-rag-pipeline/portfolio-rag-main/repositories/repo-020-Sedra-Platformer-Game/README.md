# Sedra-Platformer-Game

## Repository Identity

- Repository: 020 / 134
- Name: `Sedra-Platformer-Game`
- Repository start date: 2023-03-05
- Latest meaningful update date: 2023-03-05
- Primary type: Desktop game prototype
- Technical field: Java game programming and real-time rendering
- Application domain: 2D character movement and sprite animation
- Project context: Personal project
- Collaboration type: `individual-project`
- Primary implementation language: Java

## Collaboration and Authorship Context

The repository has two owner-attributed commits and stores both source and compiled class outputs.

The Java implementation is therefore treated as personally attributable repository work.

## Evidence Basis

The source tree includes:

- `main/Main.java`;
- `main/MainWindow.java`;
- `main/MainPanel.java`;
- `main/SedraPlatformer.java`;
- `listeners/Keyboard.java`;
- `listeners/Mouse.java`;
- `things/Character.java`;
- `things/Protagonist.java`;
- `utilities/Globals.java`;
- sprite-sheet image assets.

A parallel `bin` hierarchy contains compiled `.class` files for the same application structure.

## What This Project Is

`Sedra-Platformer-Game` is a Java desktop game prototype built directly with Swing/AWT-style rendering and event listeners.

The project implements a controllable protagonist with:

- keyboard movement;
- mouse-triggered attacks;
- sprite-sheet animation;
- multiple animation states;
- a continuously running update/render loop;
- explicit frames-per-second and updates-per-second targets.

The project is a compact but real interactive runtime rather than a static object-oriented example.

## Architecture and System Shape

```text
Main
  ↓
SedraPlatformer
  ├─ MainWindow
  │    ↓
  │  MainPanel
  │    ├─ Keyboard listener
  │    └─ Mouse listener
  │
  ├─ update / render loop
  │
  └─ Protagonist
       ├─ position state
       ├─ movement flags
       ├─ attack state
       └─ sprite animation grid
```

The application separates windowing, rendering, input handling, runtime control, and player state into distinct classes/packages.

## Technical Stack

### Java

Java provides the application runtime and object model.

### Swing

`JPanel` is used as the rendering surface.

The panel overrides `paintComponent(Graphics)` and delegates drawing to the game controller.

### AWT Graphics and Events

The project uses:

- `Graphics` for rendering;
- `BufferedImage` for sprite data;
- `KeyListener` for keyboard input;
- `MouseListener` and `MouseMotionListener` for mouse input.

### ImageIO

`ImageIO.read()` loads the committed sprite sheet from the classpath.

## Runtime Game Loop

`SedraPlatformer` implements `Runnable` and starts a dedicated thread for the game loop.

The loop defines separate targets:

- `FPS_REQUIRED = 120`;
- `UPS_REQUIRED = 200`.

Nanosecond timing accumulators independently track when the next update and render should occur.

This is important because simulation updates and display refreshes are not treated as one identical cadence.

### Update Path

When the update accumulator reaches its threshold, the loop calls `refresh()`.

That delegates to `Protagonist.refresh()`.

### Render Path

When the frame accumulator reaches its threshold, the loop invokes `mainPanel.repaint()`.

Swing then calls the panel's `paintComponent()` method, which delegates drawing back through the game object.

### Runtime Instrumentation

Once per second, the loop prints measured frame and update counts:

```text
fps: <count> ups: <count>
```

This provides a simple runtime observation mechanism for whether the loop is reaching its configured cadence.

## Keyboard Input

`Keyboard` implements `KeyListener`.

The movement controls are:

- `A` → left;
- `S` → down;
- `D` → right;
- `W` → up.

On key press, the corresponding movement flag becomes true.

On key release, it becomes false.

The input layer therefore tracks sustained movement rather than treating each key press as one fixed displacement.

## Mouse Input

`Mouse` implements both:

- `MouseListener`;
- `MouseMotionListener`.

A left-button click sets the protagonist's attack flag.

This gives the prototype simultaneous keyboard navigation and mouse-triggered action input.

## Protagonist State

`Protagonist` extends the repository's `Character` abstraction.

Its runtime state includes:

- X/Y position;
- speed;
- movement flags;
- attack flag;
- current animation;
- animation timer;
- animation frame selector;
- sprite animation grid.

## Movement Logic

`alterPosition()` updates the player position according to active directional flags.

Opposing directions are explicitly checked so left/right and up/down conflict behavior is controlled.

The method also calculates whether the protagonist is currently moving.

That movement state influences animation selection.

## Animation State Selection

`alterAnimation()` switches between at least:

- running;
- idle;
- attack.

Attack state overrides ordinary movement/idle selection.

When the selected animation changes, frame counters are reset so the new animation begins cleanly.

## Animation Timing

`refreshAnimation()` increments an animation timer.

After the configured refresh interval, the frame selector advances.

When the frame count for the active animation is exhausted, the selector wraps back to zero.

Attack completion also clears the attack flag after the animation cycle.

This is concrete frame-sequencing logic rather than a single static sprite draw.

## Sprite-Sheet Processing

`formAnimations()` loads `/main.png` and slices it into subimages through repeated `BufferedImage.getSubimage()` calls.

The code builds a two-dimensional `AnimationGrid` covering animation groups such as:

- idle;
- running;
- jumping;
- attack 1;
- attack 2;
- attack 3;
- falling;
- hurt;
- death.

Each row of the sprite sheet is mapped into frame indices for an animation category.

This provides direct evidence of manual sprite-sheet coordinate management.

## Rendering

`Protagonist.show(Graphics)` draws the current animation frame at the protagonist's current position.

The frame is selected by:

```text
AnimationGrid[playerAnimation][AnimationSelector]
```

The result is rendered with explicit destination width and height.

## Window and Panel Structure

`MainPanel` owns the input listeners and receives a reference to `SedraPlatformer`.

It configures panel dimensions and delegates game drawing during `paintComponent()`.

The game controller creates both the panel and the window, then requests focus so keyboard events are delivered to the panel.

This is a small separation of concerns between:

- application loop;
- window/container;
- drawing surface;
- player model;
- input listeners.

## Build Evidence

The repository includes a `bin` tree with compiled class files for:

- listeners;
- main runtime classes;
- protagonist/domain classes;
- utility classes.

This shows the source had progressed through compilation into executable Java bytecode artifacts.

## Engineering Practices

### Update/Render Separation

The code explicitly targets updates and frames at different rates.

This introduces real-time loop reasoning beyond ordinary event-driven desktop UI.

### Input State Tracking

Keyboard events update persistent movement flags, which the update loop later consumes.

This decouples event arrival from movement simulation.

### Class Decomposition

Runtime, rendering panel, window, player model, listeners, and globals are separated into packages/classes.

### Resource-Based Asset Loading

The sprite sheet is loaded from the classpath rather than an absolute filesystem path.

### Animation State Reset

Changing animation clears frame/timer state so transitions begin from the first frame.

## Scale and Complexity

### Implementation Scale

The repository is small, but it contains a complete interactive loop and several cooperating classes rather than one standalone exercise.

### Runtime Complexity

The application simultaneously manages:

- real-time timing;
- event-driven input;
- mutable position;
- animation state;
- rendering cadence;
- resource loading.

### Asset Complexity

A single sprite sheet is manually decomposed into multiple animation families and frame counts.

## Skills Demonstrated

### Java Desktop Development

- **Java — strong evidence.**
- **Swing rendering — strong evidence.**
- **AWT event handling — strong evidence.**
- **Threads / `Runnable` — strong evidence.**
- **Buffered image processing — strong evidence.**

### Game Programming

- **Game loop — strong evidence.**
- **Separate update and frame rates — strong evidence.**
- **Keyboard movement — strong evidence.**
- **Mouse attack input — strong evidence.**
- **Sprite-sheet animation — strong evidence.**
- **Animation state switching — strong evidence.**
- **Frame timing — strong evidence.**

### Architecture

- **Input/render/model decomposition — strong evidence.**
- **Persistent input state — strong evidence.**
- **Resource loading — strong evidence.**

## Capability Developed

This repository turns Java from a design-pattern learning language into an interactive real-time application environment.

The key new capability is coordinating multiple timing domains and state sources:

- user input arrives asynchronously;
- movement updates happen at a configured update cadence;
- rendering happens at a separate frame cadence;
- animation frames advance on their own timer;
- attack and movement flags change the rendered state.

That introduces practical runtime/game-loop reasoning absent from the earlier pattern repositories.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- Java game programming;
- Swing-based game rendering;
- an explicit threaded game loop;
- separate FPS and UPS targets;
- sprite-sheet slicing;
- animation-state sequencing;
- combined keyboard and mouse game input.

## Historical Significance

`Sedra-Platformer-Game` records an early experiment in interactive real-time software.

It sits between object-oriented design study and later systems/projects by showing the same Java fundamentals applied to timing, graphics, events, and animation rather than purely structural examples.

## Overall Repository Narrative

`Sedra-Platformer-Game` is a personally authored Java desktop game prototype with a threaded runtime loop, Swing rendering, keyboard movement, mouse-triggered attacks, and manual sprite-sheet animation.

The runtime independently tracks update and render timing, the protagonist maintains movement and animation state, and the rendering path selects frames from a two-dimensional sprite grid. Compiled class files provide direct build evidence.

Its strongest portfolio evidence is the transition into real-time interactive programming: timing loops, event state, rendering, and animated assets coordinated inside one application.

# Project Tags

## Project Type

- `personal-project`
- `prototype`

## Collaboration and Authorship

- `individual-project`

## Languages

- `java`

## Frontend and Presentation

- `desktop-gui`
- `event-driven-ui`
- `swing`
- `awt-graphics`
- `sprite-sheet-animation`

## Systems Engineering and Algorithms

- `game-loop`
- `threaded-runtime`
- `update-render-separation`
- `frame-timing`
- `input-state-tracking`
- `animation-state-machine`

## Testing and Verification

- `build-artifact-evidence`

## Portfolio Significance

- `earliest-observed-game-development`
- `earliest-observed-java-game-loop`
- `earliest-observed-sprite-sheet-animation`
- `earliest-observed-update-render-separation`
