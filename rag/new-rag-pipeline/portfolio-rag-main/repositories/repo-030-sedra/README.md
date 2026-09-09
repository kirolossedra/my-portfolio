# sedra

## Repository Identity

- Repository: 030 / 134
- Name: `sedra`
- Repository Start Date: 2024-05-30
- Latest Meaningful Update Date: 2024-07-22
- Primary Type: Personal developer portfolio site
- Primary Stack: HTML, CSS, JavaScript, jQuery
- Delivery: GitHub Pages
- Collaboration Type: Individual Project

## Collaboration and Authorship Context

The visible repository history is owner-attributed.

The owner created and iterated the HTML pages, experimented with a custom-domain `CNAME`, later removed it, and continued updating repository assets through July 2024.

The resulting repository is best classified as an individual developer-portfolio project.

## What This Project Is

`sedra` is a personal static portfolio website.

It combines an animated landing page with a second page that presents selected projects as responsive visual cards.

The site is explicitly personal.

Visible text includes:

- “Welcome to Sedra's”,
- “Hi, I AM”,
- “kIROLOS SEDRA”,
- “Welcome and Enjoy”.

The project therefore represents an early dedicated web identity layer around the technical portfolio.

## Site Structure

The repository contains:

```text
sedra/
├── index.html
├── index2.html
├── favicon.png
├── New Bitmap Image (2).bmp
└── assets/
    └── img/
```

GitHub Pages is enabled for the repository.

The two HTML pages serve distinct roles.

### `index.html`

Animated entry/landing experience.

### `index2.html`

Responsive project-card portfolio.

## Landing Page Experience

The first page uses a dark full-screen gradient background.

Its dominant visual effect is animated rain.

The effect is constructed from:

- `.rain` containers,
- `.drop` elements,
- `.stem` elements,
- `.splat` elements,
- CSS keyframes,
- randomized JavaScript-generated positions and timing.

## Procedural Rain Generation

The `makeItRain()` function dynamically builds rain-drop HTML.

For each generated drop, JavaScript randomizes:

- position,
- animation delay,
- animation duration.

It creates separate front-row and back-row drop strings and injects them into the corresponding containers.

This is procedural DOM generation rather than a fixed static animation.

## CSS Animation

The landing page defines multiple keyframe animations.

### Drop

Moves each drop vertically through the viewport.

### Stem

Controls rain-streak opacity.

### Splat

Scales and fades a dotted impact effect.

The body enables both back-row and splat behavior through CSS classes.

## jQuery

The project loads jQuery 3.5.1 from Google’s CDN.

jQuery is used to:

- clear rain containers,
- append generated front-row rain,
- append generated back-row rain.

The project therefore includes direct third-party browser-library integration.

## Animated Navigation Button

The landing page contains a custom neon-style link.

It uses:

- an SVG `polyline`,
- `stroke-dasharray`,
- `stroke-dashoffset`,
- CSS transitions,
- box-shadow hover effects.

Clicking the control calls `redirectToPage()` and moves the browser to `/index2.html`.

## Portfolio Page

The second page presents selected projects as cards.

The checked-in content highlights three portfolio elements.

### Egyptiantor

Described as:

> My first software project ever

The card links to the deployed Egypt project.

### Problem Solving

Described as:

> In C++

The card links to the owner’s LeetCode profile.

### Self-Driving Digital Twin

Described as:

> Graduation Project

The card links to `RADAR-Experiement-SENSOR-FUSION-TEAM`.

These cards are useful portfolio evidence because the repository itself records how the owner chose to narrate earlier work at this point in time.

## Dynamic Introductory Text

The second page rotates through three text messages every two seconds.

JavaScript stores the messages in an array and advances the active index with `setInterval`.

This creates a simple timed content animation independent of CSS-only effects.

## Responsive Card Layout

The card layout uses CSS Grid.

The page adapts at several breakpoints.

### Small devices

Card widths and container spacing are reduced.

### Medium devices

The grid switches to two columns.

### Large devices

The grid expands to three columns and larger card dimensions.

This is direct responsive-layout implementation.

## Hover-Reveal Interaction

Each card contains an initially hidden data panel.

Hovering the card triggers animations that:

- move the data panel upward,
- reveal it,
- temporarily change overflow behavior.

When hover ends, complementary keyframes restore the original presentation.

This is a richer interaction pattern than a simple color hover state.

## CSS Custom Properties

The second page defines design tokens under `:root`.

They include:

- primary color,
- title color,
- text color,
- body color,
- container color,
- body font,
- heading size,
- small font size.

This centralizes presentation values and makes responsive typography easier to adjust.

## External Font Integration

The portfolio imports Poppins from Google Fonts.

The font is then assigned through a CSS custom property.

## Deployment and Domain Experimentation

Repository metadata shows GitHub Pages is enabled.

Commit history also records:

- creation of a `CNAME`,
- later deletion of that `CNAME`.

That demonstrates direct experimentation with custom-domain configuration around a static hosted site.

## Product / Portfolio Engineering

Although small, the repository has a clear user-facing purpose:

- introduce the developer,
- guide visitors into the portfolio,
- showcase selected work,
- link to external project destinations.

The project therefore acts as a presentation layer over previously independent repositories.

## Engineering Practices

### Separation of Entry and Portfolio Views

The landing page and actual portfolio cards are separated into distinct documents.

### Responsive Design

Media queries adapt the portfolio presentation across viewport sizes.

### Reusable Card Styling

Repeated project cards share the same class structure.

### Dynamic DOM Generation

The rain effect is generated at runtime rather than manually enumerated.

### Progressive Visual Interaction

Transitions, hover states, SVG strokes and text rotation are combined to create a more deliberate interaction experience.

## Implementation Scale

The application is still a static site, but it contains several front-end mechanisms:

- CSS keyframes,
- JavaScript timers,
- jQuery DOM manipulation,
- SVG animation,
- responsive grid layout,
- hover-reveal cards,
- external fonts,
- GitHub Pages deployment.

## Skills Demonstrated

### Web Development

- semantic HTML structure,
- CSS,
- JavaScript,
- jQuery,
- DOM generation.

### Frontend Interaction

- CSS animation,
- timed text changes,
- hover-reveal interaction,
- SVG stroke animation.

### Responsive Design

- CSS Grid,
- media queries,
- responsive sizing.

### Developer Portfolio Engineering

- project curation,
- cross-project linking,
- public developer branding,
- static hosting,
- custom-domain experimentation.

## Capability Developed

This repository is important because it begins treating the portfolio itself as a product surface.

Earlier projects existed as independent technical artifacts.

Here, selected work is intentionally framed for an external visitor.

That introduces a new engineering concern:

> how should technical work be presented, navigated and visually experienced?

## Historical Portfolio Significance

This is the earliest processed repository dedicated specifically to a multi-project personal portfolio website.

It also provides explicit historical self-description:

- Egyptiantor is called the owner’s first software project,
- the radar/sensor-fusion project is called the graduation project.

Those statements are valuable first-party portfolio chronology evidence.

## Overall Project Narrative

`sedra` is an early personal developer website that combines experimentation with practical portfolio presentation.

Its landing page explores procedural animation and visual identity.

Its second page organizes technical history into responsive cards.

The project therefore bridges two concerns:

- front-end experimentation,
- developer self-presentation.

That makes it an important precursor to later, more structured portfolio systems.

# Project Tags

- `static-web-application`
- `personal-project`
- `individual-project`
- `developer-portfolio`
- `developer-branding`
- `html`
- `css`
- `javascript`
- `jquery`
- `browser-dom`
- `css-animation`
- `svg-animation`
- `dynamic-dom-generation`
- `responsive-layout`
- `css-grid`
- `media-queries`
- `css-custom-properties`
- `hover-interaction`
- `timed-text-rotation`
- `google-fonts`
- `github-pages`
- `static-site-deployment`
- `custom-domain-experiment`
- `portfolio-project-links`
- `earliest-observed-developer-portfolio-site`
- `earliest-observed-jquery`
- `earliest-observed-svg-animation`
