# Repository 044 — StudyTree

## Repository Identity

- **Repository:** `kirolossedra/StudyTree`
- **Repository start date:** 2024-08-30
- **Last meaningful update date:** 2024-08-30
- **Primary implementation format:** HTML with embedded CSS and JavaScript
- **Visualization library:** D3.js v7
- **Deployment:** GitHub Pages enabled
- **Collaboration classification:** individual project
- **Repository shape:** one self-contained interactive visualization page

## What This Project Is

`StudyTree` is a small browser application for visualizing a technical learning roadmap as a hierarchical tree.

Its initial data model contains two top-level tracks:

- Robotics,
- AI.

The Robotics branch records the sequence from ROS 2 basics through RViz/Gazebo and Nav2.

The AI branch begins with Machine Learning.

The application renders those relationships as an interactive D3 tree.

## Source Layout

The repository contains only:

- `README.md`,
- `index.html`.

All functional code is embedded in `index.html`.

This makes the project a self-contained static deployment.

## Data Model

The hierarchy is encoded as nested JavaScript objects.

The root is `Courses`.

Children are nested through `children` arrays.

This is then converted into a D3 hierarchy with:

`d3.hierarchy(data)`.

The structure is not hard-coded as absolute SVG coordinates.

The tree layout is computed from hierarchical data.

## D3 Tree Layout

The implementation creates a D3 tree using:

`d3.tree().size(...)`.

The root hierarchy is passed through the tree layout.

D3 assigns coordinates to each node.

The page therefore separates logical hierarchy from final render positions.

## SVG Rendering

The application creates a large SVG canvas.

It appends a translated group and renders tree links and nodes inside it.

Each node is represented by an SVG group.

That group is transformed to the D3-computed coordinates.

## Link Geometry

Edges between parent and child nodes are rendered as SVG paths.

The path uses a cubic Bézier curve.

Control points are calculated from the parent/child x/y positions.

This produces visually smooth hierarchical branches.

## Dynamic Node Rendering

The application binds `root.descendants()` to node groups.

It appends:

- rounded rectangles,
- text labels,
- checkboxes,
- checkmark paths.

This is data-driven DOM/SVG generation using D3's enter pattern.

## Branch Coloring

The page defines `generateShades`.

For each top-level branch:

- a base color is selected from `d3.schemeCategory10`,
- darker variants are generated,
- descendant nodes receive shades of that branch's base color.

This visually encodes hierarchy membership.

## Completion Interaction

Each node includes a checkbox-style rectangle and a hidden checkmark.

Click handlers toggle:

- the `checked` CSS class,
- checkmark visibility.

This turns the static hierarchy into a lightweight progress-tracking interface.

The state is in-memory only.

No persistence layer is implemented.

## Duplicate Click Handler

The file attaches a click handler when creating checkbox rectangles.

Later it selects `.checkbox` and attaches another click handler.

The second handler replaces the earlier D3 event binding for the selected elements.

The checked-state logic still exists, but the duplication is an implementation-cleanliness issue.

## Styling

The page defines inline CSS for:

- node rectangles,
- text,
- checkbox boundaries,
- checked state,
- checkmark paths.

The visualization is therefore entirely portable as a single HTML file plus the remotely loaded D3 library.

## External Dependency

D3 v7 is loaded from:

`https://d3js.org/d3.v7.min.js`.

The deployed page therefore depends on that CDN resource being available.

No bundler or package manager is used.

## Deployment Evidence

GitHub repository metadata has Pages enabled.

Combined with a root `index.html`, this supports classification as a deployed static visualization.

There is no separate server runtime.

## Engineering Work Evidenced

The repository positively demonstrates:

- hierarchical data modeling,
- D3 hierarchy construction,
- tree-layout computation,
- SVG rendering,
- data binding,
- Bézier path generation,
- dynamic DOM/SVG creation,
- branch-based color encoding,
- click-driven interaction,
- static-site deployment.

## Verification Evidence

There is no automated test suite.

The repository history contains several rapid updates to `index.html` on its creation day.

The practical verification mode is browser rendering and clicking the generated controls.

GitHub Pages provides a deployable execution surface.

## Skills Demonstrated

### Frontend

- HTML
- CSS
- JavaScript
- SVG
- event handling

### Data Visualization

- D3.js
- hierarchical data
- tree layouts
- color scales
- data joins
- path generation

### Product Thinking

The tool converts a learning plan into a visual navigable artifact rather than leaving it as plain notes.

The completion checkbox interaction introduces a minimal progress-tracking concept.

## Capability Developed

The project develops the ability to express structured knowledge visually.

A nested data model is translated into:

- spatial hierarchy,
- visual grouping,
- interactive completion controls.

This is a different frontend concern from the animation-focused sites seen earlier in the corpus.

## Portfolio Evolution

Historically, `StudyTree` appears immediately after the ROS/SLAM sequence.

Its actual hierarchy directly reflects that learning route.

The repository is therefore both a frontend artifact and a meta-artifact documenting how technical learning was being organized at that point.

## Historical Significance

Within the processed corpus, this is the earliest observed D3.js hierarchy/tree visualization.

It is also the earliest observed portfolio artifact that explicitly models a learning roadmap as structured data.

## Limitations

Progress state is not persisted.

There is no backend.

There is no authentication.

The roadmap data is embedded directly in source.

The viewport uses fixed SVG dimensions.

No automated accessibility or UI tests are present.

A duplicate checkbox event binding exists.

## Overall Narrative

`StudyTree` is a compact, deployed visualization that turns an engineering learning roadmap into an interactive hierarchy.

The technical substance lies in the D3 data-to-SVG pipeline: nested course data becomes coordinates, curved links, shaded branches, labels, and stateful controls.

It also serves as historical evidence that robotics and AI learning were being organized deliberately rather than accumulated as disconnected repositories.

# Project Tags

- `static-web-application`
- `interactive-utility`
- `individual-project`
- `html`
- `css`
- `javascript`
- `d3-js`
- `svg`
- `hierarchical-data`
- `tree-visualization`
- `data-visualization`
- `dynamic-dom-generation`
- `event-driven-ui`
- `stateful-ui`
- `color-scale`
- `bezier-curves`
- `learning-roadmap`
- `github-pages`
- `static-site-deployment`
- `client-side-application`
- `manual-verification`
