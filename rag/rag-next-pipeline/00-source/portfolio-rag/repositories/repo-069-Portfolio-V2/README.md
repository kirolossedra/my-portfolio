# Repository 069 — Portfolio-V2

## Repository Identity

- **Repository:** `kirolossedra/Portfolio-V2`
- **Repository start date:** 2024-10-23
- **Last meaningful update date:** 2024-10-28
- **Latest meaningful commit:** `eb484071f652816aaefb4ebf018f851dba58b8f7`
- **Primary technical field:** browser-based machine-learning portfolio and data visualization
- **Primary technologies:** HTML, CSS, JavaScript, TensorFlow.js, Chart.js
- **Project context:** personal portfolio / ML demonstration site
- **Collaboration classification:** `individual-project`

## Evidence Basis

The repository tree contains several independent browser-facing artifacts:

- `models.html`;
- `MNIST MODEL.html`;
- `model.json`;
- a TensorFlow.js weight shard;
- `dashboard.html`;
- `timeline.html`;
- a minimal root README.

The latest meaningful commit updates `models.html` on 2024-10-28.

The strongest evidence comes from the implemented browser model-loading, preprocessing, prediction, visualization, and interaction code rather than from the repository's short README.

## What This Project Is

`Portfolio-V2` is a static browser portfolio that combines software-project presentation with interactive machine-learning demonstrations.

The project does not merely display screenshots of models. It loads a TensorFlow.js model in the browser, accepts user-created image input, preprocesses that input into the model's expected representation, executes inference, and renders a predicted class and confidence.

A second model demonstration implements logistic-regression inference directly in JavaScript using explicit coefficients and a sigmoid function.

Separate pages explore:

- a Chart.js skills/data dashboard;
- a responsive career-timeline component;
- an integrated model showcase.

The repository therefore represents a move from learning models in notebooks toward exposing model behavior through an interactive web interface.

## Repository Structure

```text
Portfolio-V2/
├── MNIST MODEL.html
├── dashboard.html
├── group1-shard1of1.txt
├── model.json
├── models.html
├── timeline.html
└── README.md
```

The model JSON plus weight shard provide concrete model-distribution artifacts for browser loading.

## System Shape

```text
Static browser page
      ↓
TensorFlow.js
      ↓
loadLayersModel(model.json)
      ↓
User input
  ├─ uploaded image
  └─ drawn digit on canvas
      ↓
Image preprocessing
  ├─ grayscale conversion
  ├─ resize to 28×28
  ├─ normalization
  ├─ conditional inversion
  └─ contrast normalization
      ↓
Model inference
      ↓
argMax + confidence
      ↓
Rendered browser result
```

A separate prediction path performs:

```text
Loan form
   ↓
Categorical/numeric preprocessing
   ↓
Hard-coded logistic-regression coefficients
   ↓
Linear score z
   ↓
Sigmoid
   ↓
Approval threshold
```

## TensorFlow.js Integration

### Browser Model Loading

`models.html` imports TensorFlow.js from a CDN and loads the checked-in model through:

```javascript
model = await tf.loadLayersModel('model.json');
```

This is direct client-side model loading, not merely a link to an external model service.

### Model Distribution

The repository contains both:

- model topology/configuration in `model.json`;
- a multi-megabyte weight shard.

These are the artifacts TensorFlow.js needs to reconstruct the trained model for inference.

### Status Handling

Model loading is wrapped in `try/catch` logic and updates a visible status element for successful or failed loading.

This makes model availability part of the user-facing state.

## Handwritten-Digit Input Workflows

### Image Upload

The UI accepts local image files through a browser file input.

The selected image is loaded into an `Image` object, scaled into a preview canvas, preprocessed, and passed to the model.

### Freehand Drawing

A second interaction path provides a 280×280 drawing canvas.

Mouse listeners implement:

- drawing start;
- pointer movement;
- stroke rendering;
- drawing stop;
- canvas clearing;
- explicit prediction.

This turns the model demo into an interactive input surface rather than a fixed test example.

## Image Preprocessing Pipeline

The browser preprocessing code demonstrates the model-input preparation needed to bridge arbitrary user images and an MNIST-style model.

### Grayscale Tensor Creation

Image pixels are converted with:

```javascript
tf.browser.fromPixels(image, 1)
```

The single channel matches a grayscale digit-model workflow.

### Resize

Input is resized to 28×28 when required through TensorFlow.js image operations.

### Numeric Normalization

Pixel values are converted to floating point and scaled by `255.0`.

### Background Inversion

The mean pixel value is examined.

For predominantly light backgrounds, the image is inverted so digit/background polarity better matches the model representation.

### Contrast Normalization

The tensor is shifted by its minimum and divided by its range, producing a normalized intensity span.

### Batch Dimension

The processed tensor is expanded into a batch before prediction.

## Browser Inference

The model receives the processed tensor through `model.predict(...)`.

The output is used to derive:

- the predicted class with `argMax`;
- the probability-like value associated with that class;
- a user-facing confidence percentage.

Temporary tensors are explicitly disposed after inference.

This is meaningful browser-side ML integration evidence because the full path from user input to prediction is implemented in the frontend.

## Logistic-Regression Demonstration

The second model workflow is intentionally simpler and transparent.

### Form Inputs

The loan form collects variables including:

- gender;
- marital status;
- dependents;
- education;
- self-employment;
- applicant income;
- co-applicant income;
- loan amount;
- loan term;
- credit history;
- property area.

### Feature Encoding

Categorical values are converted into numeric representations directly in JavaScript.

### Explicit Model Parameters

The model uses an array of learned weights and a scalar bias.

### Sigmoid Inference

The implementation computes:

```text
z = bias + Σ(weight_i × feature_i)
prediction = 1 / (1 + exp(-z))
```

A threshold converts the output into the two displayed decision labels.

This is useful model-deployment evidence because inference is reproduced independently of a Python runtime.

## Model Showcase Integration

`models.html` combines the digit-recognition and loan-prediction experiences inside one model-portfolio page.

Expandable sections separate:

- evaluation;
- interactive try-out behavior.

This shows an attempt to package model behavior into a reusable portfolio presentation rather than keeping each experiment isolated.

## Relationship to `Testing-Model-Deployment`

The digit-recognition page in this repository uses the same checked-in HTML blob as the standalone deployment prototype processed immediately afterward.

The appropriate interpretation is reuse and integration:

- `Testing-Model-Deployment` isolates model-serving-in-the-browser experimentation;
- `Portfolio-V2` integrates that result into a broader portfolio experience.

This reuse is positive architecture evidence without counting identical code twice as independent model implementation.

## Skills Dashboard

`dashboard.html` imports Chart.js and creates three charts.

### Skills Bar Chart

A bar chart displays self-entered skill labels and numerical values.

Those numbers are portfolio presentation data, not independently validated proficiency measurements.

### Language-Usage Timeline

A line chart visualizes self-entered language-use values across multiple years.

### Work/Study Distribution

A pie chart represents a self-authored distribution across software engineering, data science, and data engineering.

The implementation evidence here is **Chart.js visualization and browser chart configuration**, not the objective truth of the displayed ratings.

## Chart.js Engineering

The dashboard demonstrates:

- multiple chart types;
- datasets;
- labels;
- axes;
- legends;
- titles;
- responsive browser visualization;
- independent canvas elements.

It therefore adds a browser data-visualization capability to the portfolio chronology.

## Responsive Timeline Component

`timeline.html` implements a visual timeline using CSS Grid and custom properties.

The layout includes:

- alternating left/right cards on wider viewports;
- a central vertical line;
- date markers;
- card accents;
- responsive media-query behavior;
- pseudo-elements for visual connectors.

The checked-in card content is placeholder-style sample content, so the evidence is the **responsive timeline component itself**, not those example career events.

## Frontend Engineering

### DOM and Event Handling

The project uses event listeners for:

- mouse drawing;
- file selection;
- button actions;
- form submission;
- dropdown toggling.

### Canvas APIs

Canvas is used for:

- drawing;
- image preview;
- resizing input before preprocessing.

### Asynchronous JavaScript

Model loading and inference are implemented with `async`/`await`.

### Error Handling

Model and image-processing flows use `try/catch` and visible error states.

### Tensor Lifecycle Management

Created prediction tensors are explicitly disposed, showing awareness of TensorFlow.js resource management.

## Product Engineering

The project is designed as a portfolio experience rather than a code-only experiment.

The model demonstrations let a visitor interact directly with ML functionality.

Notable product choices include:

- two input methods for digit recognition;
- visible model-loading state;
- confidence output;
- interactive loan form;
- collapsible model sections;
- multiple visualization pages.

## Scale and Complexity

### Repository Scale

The repository has few source files, but it includes a multi-megabyte model weight artifact.

### Functional Breadth

The browser surface spans:

- model inference;
- canvas interaction;
- image preprocessing;
- numerical inference;
- portfolio visualization;
- timeline presentation.

### Integration Complexity

Its main complexity is integration across browser UI, model artifacts, TensorFlow.js tensor operations, and presentation logic.

## Skills Demonstrated

### Frontend

- **HTML — strong evidence.**
- **CSS — strong evidence.**
- **JavaScript — strong evidence.**
- **Canvas interaction — strong evidence.**
- **Responsive layout — strong evidence.**
- **DOM event handling — strong evidence.**

### Machine Learning Integration

- **TensorFlow.js — strong evidence.**
- **Browser model loading — strong evidence.**
- **Client-side inference — strong evidence.**
- **Image preprocessing — strong evidence.**
- **Digit-recognition model integration — strong evidence.**
- **Logistic-regression inference — strong evidence.**

### Visualization

- **Chart.js — strong evidence.**
- **Browser data visualization — strong evidence.**
- **Responsive timeline presentation — strong evidence.**

### Product Engineering

- **Interactive model demonstration — strong evidence.**
- **Model portfolio presentation — strong evidence.**
- **Reusable integration of a prior model-deployment prototype — strong evidence.**

## Capability Developed

This repository closes an important gap between ML experimentation and product presentation.

Earlier repositories establish model training, notebook-based analysis, and a FastAPI model-serving experiment.

`Portfolio-V2` demonstrates another delivery model: distribute model artifacts with a web page and perform inference directly inside the visitor's browser.

## Portfolio Evolution Context

This is the earliest processed repository with direct evidence of:

- TensorFlow.js;
- browser-side loading of a trained neural-network artifact;
- interactive browser ML inference;
- Chart.js;
- a portfolio page built around directly executable model demonstrations.

## Historical Significance

`Portfolio-V2` marks the point where machine-learning work becomes something a portfolio visitor can operate.

It is especially useful for career-history queries because it combines:

- prior frontend experience;
- prior model-building experience;
- model artifact packaging;
- product-oriented interactive presentation.

## Overall Repository Narrative

`Portfolio-V2` is a browser-based ML portfolio that packages model artifacts, JavaScript inference, interactive input, and visualization into a static site.

Its strongest engineering evidence is not the self-entered skill ratings displayed in one dashboard. It is the implemented bridge between ML artifacts and a usable browser experience: drawing and image upload, preprocessing, TensorFlow.js prediction, confidence rendering, explicit logistic-regression inference, and interactive presentation.

# Project Tags

## Project Type

- `developer-portfolio-site`
- `machine-learning-demo`
- `static-web-application`
- `interactive-utility`

## Collaboration and Authorship

- `individual-project`
- `prototype-reuse-and-integration`

## Languages

- `html`
- `css`
- `javascript`

## Frontend

- `browser-dom`
- `event-driven-ui`
- `canvas-api`
- `canvas-drawing-input`
- `image-upload`
- `responsive-layout`
- `async-javascript`
- `interactive-forms`

## Machine Learning

- `tensorflow-js`
- `browser-ml-inference`
- `client-side-model-loading`
- `digit-recognition`
- `image-preprocessing`
- `logistic-regression-inference`
- `model-artifact-loading`
- `tensor-lifecycle-management`

## Visualization

- `chart-js`
- `data-visualization`
- `responsive-timeline`

## Portfolio Significance

- `earliest-observed-tensorflow-js`
- `earliest-observed-browser-ml-inference`
- `earliest-observed-client-side-model-loading`
- `earliest-observed-chart-js`
