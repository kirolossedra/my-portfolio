# CollisionGame

## Repository Identity

- Repository: 024 / 134
- Name: `CollisionGame`
- Repository start date: 2023-12-01
- Last meaningful update date: 2023-12-01
- Primary type: Browser-based particle/collision simulation
- Technical field: Frontend animation, collision handling, and deployment automation
- Project context: Personal interactive experiment
- Collaboration type: `individual-project`
- Primary implementation languages: HTML, JavaScript, CSS
- Deployment: GitHub Pages through GitHub Actions

## Collaboration and Authorship Context

The visible implementation commits are attributed to `kirolossedra`, including the final collision-logic update. The browser simulation and repository deployment workflow are therefore personally attributable.

## Evidence Basis

The repository contains:

- `index.html`;
- `.github/workflows/static.yml`;
- `README.md`.

`index.html` contains the complete simulation, styling, and runtime logic.

The GitHub Actions workflow deploys the repository as static content to GitHub Pages.

## What This Project Is

`CollisionGame` is a single-page browser simulation containing 150 independently moving colored balls.

Each ball receives a random initial position, random color, and random X/Y velocity.

The runtime repeatedly:

1. moves every ball;
2. checks screen boundaries;
3. reverses velocity at walls;
4. checks ball-to-ball distances;
5. resolves overlaps;
6. adjusts velocities after collisions;
7. reacts to mouse proximity.

The result is an interactive particle/collision experiment implemented entirely in client-side browser code.

## Project Scope

The simulation includes:

- dynamic DOM element creation;
- 150 moving entities;
- random color generation;
- random initial velocity;
- absolute-position movement;
- screen-boundary collision handling;
- pairwise ball collision detection;
- overlap separation;
- angle-based velocity transformation;
- cursor-proximity interaction;
- fixed-timestep-style browser updates;
- static deployment automation.

## Architecture and System Shape

```text
DOMContentLoaded
      ↓
create 150 balls
      ↓
store per-element speedX / speedY
      ↓
16 ms interval
      ↓
moveBalls()
  ├─ update positions
  ├─ bounce from viewport walls
  └─ handleCollisions()
        ├─ pairwise distance
        ├─ overlap resolution
        └─ velocity adjustment

Mouse movement
      ↓
distance-to-cursor check
      ↓
nearby-ball displacement
```

The DOM elements themselves act as both rendered entities and holders of movement state.

## Technical Stack

### HTML

The page is a standalone HTML document with embedded style and script logic.

### JavaScript

JavaScript implements:

- element creation;
- random generation;
- movement state;
- trigonometry;
- Euclidean distance;
- collision response;
- mouse interaction;
- periodic updates.

### CSS

CSS defines circular ball geometry, absolute positioning, and visual transition behavior.

### GitHub Actions

A workflow automatically deploys the repository to GitHub Pages on pushes to `main`.

### GitHub Pages

The repository has Pages enabled and the workflow publishes the static site.

## Major Engineering Work

### Dynamic Particle Creation

`createBall()` creates a new `<div>` element, assigns the `ball` class, chooses a random hexadecimal color, places the ball randomly inside the viewport, assigns random X/Y velocities, and appends it to the page.

A loop creates 150 such entities.

### Continuous Motion Loop

`setInterval(moveBalls, 16)` updates the simulation approximately every 16 milliseconds.

`moveBalls()` applies each ball's current velocity to its DOM position before handling boundaries and inter-ball collisions.

### Boundary Collisions

When a ball reaches the left/right viewport boundary, its X velocity changes sign.

When it reaches the top/bottom boundary, its Y velocity changes sign.

This keeps the simulation bounded to the browser viewport.

### Pairwise Collision Detection

`handleCollisions()` compares every ball with every other ball.

For each pair it computes:

- center-to-center X difference;
- center-to-center Y difference;
- Euclidean distance through `Math.hypot`;
- minimum non-overlapping distance from ball radii.

A collision is recognized when actual distance becomes smaller than the required minimum distance.

### Overlap Resolution

The final implementation computes overlap distance and separates the two balls along the collision angle.

This is an important refinement over simply changing velocity while leaving visual elements interpenetrating.

### Collision Velocity Adjustment

The final commit replaces an earlier simpler collision rule with angle-based calculations.

It derives:

- movement angles;
- velocity magnitudes;
- velocity components relative to the collision axis;
- resulting speed components;
- transformed X/Y velocities.

The commit history therefore shows iterative refinement of collision behavior rather than one static upload.

### Mouse Interaction

A `mousemove` handler computes cursor distance from each ball.

Balls inside a 40-pixel radius are displaced according to the mouse-relative angle while their new coordinates are clamped to viewport bounds.

This adds direct user interaction to the simulation.

## Deployment and Delivery

### GitHub Actions Pages Workflow

`.github/workflows/static.yml` runs on:

- pushes to `main`;
- manual `workflow_dispatch`.

The workflow:

1. checks out the repository;
2. configures GitHub Pages;
3. uploads the repository as a Pages artifact;
4. deploys through `actions/deploy-pages`.

### Deployment Permissions

The workflow explicitly grants:

- `contents: read`;
- `pages: write`;
- `id-token: write`.

### Deployment Concurrency

The workflow defines a `pages` concurrency group and preserves in-progress deployments.

This is concrete CI/CD-style deployment configuration.

## Verification

### Browser-Visible Simulation

The simulation is inherently observable through movement, collision response, wall bouncing, and mouse interaction.

### Iterative Commit Refinement

The repository contains several same-day updates to `index.html`.

The final commit specifically replaces simpler rectangular/distance collision handling with center-distance overlap resolution and more detailed velocity calculations.

### Deployment Pipeline

The GitHub Actions workflow provides automated publication of the current static implementation.

## Engineering Practices

### Incremental Refinement

Several focused commits modify the same collision logic during one development session.

### Explicit State Per Entity

Each generated DOM node carries `speedX` and `speedY`, keeping motion state associated with the rendered object.

### Boundary Clamping

Cursor-driven movement clamps new positions to valid viewport coordinates.

### Automated Static Deployment

The project moves from code-only static hosting to an explicit GitHub Actions deployment workflow.

## Scale and Complexity

### Entity Scale

The simulation creates 150 moving balls.

### Computational Shape

The collision routine uses nested pair iteration, producing quadratic pair-check behavior with respect to ball count.

### Temporal Scale

Updates occur every 16 milliseconds, so movement and collision work runs continuously while the page is active.

### Conceptual Complexity

The simulation combines:

- DOM state;
- timing;
- geometry;
- trigonometry;
- collision detection;
- collision response;
- user interaction;
- deployment automation.

## Skills Demonstrated

### Frontend

- **Dynamic DOM creation — strong evidence.**
- **Client-side animation loop — strong evidence.**
- **Event-driven mouse interaction — strong evidence.**
- **Absolute-position rendering — strong evidence.**

### Algorithms and Mathematics

- **Euclidean distance — strong evidence.**
- **Collision detection — strong evidence.**
- **Overlap resolution — strong evidence.**
- **Trigonometric velocity transformation — strong evidence.**
- **Viewport boundary handling — strong evidence.**

### DevOps and Delivery

- **GitHub Actions — strong evidence.**
- **GitHub Pages deployment automation — strong evidence.**
- **Workflow permissions — strong evidence.**
- **Deployment concurrency configuration — moderate evidence.**

## Capability Developed

This repository combines a visually interactive algorithm with an automated deployment path.

Earlier browser projects already demonstrated DOM-driven product behavior; `CollisionGame` adds continuous simulation, many concurrent visual entities, pairwise geometry, and an explicit Pages deployment workflow.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- GitHub Actions;
- automated GitHub Pages deployment;
- continuous browser simulation;
- pairwise collision detection;
- explicit collision overlap resolution;
- deployment concurrency configuration.

## Historical Significance

`CollisionGame` is a concise transition point where a small browser experiment also receives repository-level deployment automation.

It therefore contributes to both frontend simulation history and the beginning of explicit CI/CD configuration in the processed portfolio.

## Overall Repository Narrative

`CollisionGame` is an owner-authored browser particle simulation built in one HTML file and published through GitHub Actions.

One hundred and fifty balls move continuously, bounce off viewport walls, detect collisions through center distance, separate when overlapping, transform their velocities around collision angles, and react to nearby mouse movement.

The repository's final collision commit shows active algorithm refinement, while the Pages workflow adds the earliest observed explicit GitHub Actions deployment automation in the corpus.

# Project Tags

## Project Type

- `browser-simulation`
- `interactive-experiment`
- `static-web-application`
- `personal-project`

## Collaboration and Authorship

- `individual-project`

## Languages

- `html`
- `javascript`
- `css`

## Frontend and Presentation

- `browser-dom`
- `event-driven-ui`
- `client-side-animation`
- `mousemove-interaction`
- `dynamic-element-creation`

## Systems Engineering and Algorithms

- `collision-detection`
- `collision-response`
- `euclidean-distance`
- `trigonometry`
- `boundary-collision`
- `pairwise-iteration`
- `simulation-loop`

## DevOps and Delivery

- `github-actions`
- `github-pages`
- `deployment-automation`
- `pages-artifact`
- `workflow-dispatch`
- `deployment-concurrency`

## Portfolio Significance

- `earliest-observed-github-actions`
- `earliest-observed-deployment-automation`
- `earliest-observed-browser-collision-simulation`
