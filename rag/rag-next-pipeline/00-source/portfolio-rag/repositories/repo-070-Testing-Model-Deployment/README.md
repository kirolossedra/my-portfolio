# Repository 070 — Testing-Model-Deployment

## Repository Identity

- **Repository:** `kirolossedra/Testing-Model-Deployment`
- **Repository start date:** 2024-10-24
- **Last meaningful update date:** 2024-10-26
- **Latest meaningful commit:** `d22ef114e2f41fa1c067bc7b82317e3c0ed80432`
- **Primary technical field:** client-side machine-learning deployment
- **Primary technologies:** HTML, CSS, JavaScript, TensorFlow.js
- **Deployment evidence:** GitHub Pages
- **Project context:** personal model-deployment experiment
- **Collaboration classification:** `individual-project`

## Evidence Basis

The repository contains:

- `index.html`;
- `logistic-regression.html`;
- `model.json`;
- TensorFlow.js weight shards;
- a minimal README.

The repository metadata confirms GitHub Pages is enabled.

The strongest evidence comes from the client-side inference code and the model artifacts stored alongside it.

## What This Project Is

`Testing-Model-Deployment` is a focused experiment in taking trained machine-learning models out of notebook/Python contexts and making them executable through a static website.

It explores two deployment styles:

1. load a TensorFlow/Keras-style model through TensorFlow.js and perform handwritten-digit inference;
2. encode logistic-regression parameters directly into JavaScript and calculate predictions numerically in the browser.

The repository is therefore a deployment prototype rather than a model-training repository.

## Repository Shape

```text
Testing-Model-Deployment/
├── index.html
├── logistic-regression.html
├── model.json
├── group1-shard1of1.bin
├── folder/
│   └── group1-shard1of1.bin
└── README.md
```

The JSON and binary files are concrete browser-loadable model artifacts.

## Digit-Recognition Deployment

`index.html` implements a complete interaction loop around a TensorFlow.js model.

### TensorFlow.js Runtime

The page imports TensorFlow.js and TensorFlow.js visualization support from CDNs.

### Model Loading

The checked-in model is loaded at page startup using:

```javascript
tf.loadLayersModel('model.json')
```

A visible status area communicates model-loading state.

### Input Modes

Two user input methods are implemented:

- upload an existing image;
- draw a digit freehand on a canvas.

This makes the deployment test interactive rather than hard-coded to one test image.

## Drawing Interface

The drawing canvas is initialized at 280×280 pixels.

Mouse listeners implement:

- start drawing;
- continuous stroke updates;
- stop drawing;
- clear;
- predict.

Stroke width, line cap, and line join are configured to produce digit-like freehand input.

## Drawing Preprocessing

Before inference, the 280×280 drawing is copied into a temporary 28×28 canvas.

The resulting image is converted to a TensorFlow.js grayscale tensor.

The preprocessing pipeline includes:

- resize;
- floating-point conversion;
- division by 255;
- mean-intensity measurement;
- conditional inversion for light backgrounds;
- contrast normalization;
- batch-dimension expansion.

This is direct evidence of model-serving preprocessing implemented in JavaScript.

## Prediction Pipeline

After preprocessing:

```text
processed image
    ↓
model.predict
    ↓
prediction vector
    ↓
argMax
    ↓
predicted digit
    ↓
confidence percentage
```

The page displays both the predicted class and confidence.

Prediction tensors are disposed after use.

## Image-Upload Workflow

Uploaded files are loaded into an `Image` object.

The browser:

- calculates a display scale;
- centers the image inside the preview canvas;
- preprocesses the original image;
- invokes the same model;
- renders the prediction and confidence.

The architecture therefore reuses one inference path for two user input modes.

## Model-Loading and Processing Errors

Model loading and image processing use explicit `try/catch` handling.

Failures are surfaced through the status element instead of silently failing.

## Logistic-Regression Deployment

`logistic-regression.html` demonstrates a different deployment strategy.

Instead of loading a model through TensorFlow.js, the page directly contains learned coefficients.

### User Inputs

The form collects:

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

### Feature Transformation

Categorical values are mapped to numerical encodings.

Numeric inputs are parsed from form values.

### Direct Numerical Inference

An 11-element weight array and scalar bias are stored in JavaScript.

The prediction function computes the weighted sum and applies the logistic sigmoid.

```javascript
const z = weights.reduce((sum, weight, i) => sum + weight * features[i], bias);
return 1 / (1 + Math.exp(-z));
```

A `0.5` threshold selects the rendered approval label.

This is strong evidence of understanding how a simple trained model can be detached from its training environment and reproduced as deterministic frontend math.

## Static Deployment

Repository metadata indicates GitHub Pages is enabled.

That makes the model demonstrations compatible with an entirely static hosting path:

```text
GitHub repository
    ↓
HTML + JS + model artifacts
    ↓
GitHub Pages
    ↓
Browser TensorFlow.js runtime
    ↓
Interactive inference
```

## Relationship to Portfolio-V2

The handwritten-digit artifact is subsequently reused inside `Portfolio-V2`.

That sequence is historically useful:

```text
deployment experiment
     ↓
working browser inference
     ↓
integration into broader portfolio
```

The two repositories therefore show prototyping followed by integration.

## Engineering Practices

### Model/Runtime Separation

The neural model topology and weights are stored separately from the webpage that loads them.

### Reusable Preprocessing

Both uploaded images and drawn input are routed into the same preprocessing/prediction concept.

### Resource Cleanup

Inference tensors are explicitly disposed.

### Input Validation Through UI Controls

The loan form uses required fields and constrained select options before numerical inference.

### Failure Visibility

Model/image failures are represented in the interface.

## Product Engineering

The deployment is designed for direct user experimentation.

A user does not need:

- a notebook;
- Python;
- a local ML environment.

The browser becomes the model execution environment.

That is the project's strongest product implication.

## Scale and Complexity

The repository is small in source count but contains multi-megabyte model weights.

Its complexity comes from bridging:

- model serialization;
- browser model loading;
- canvas input;
- image processing;
- tensor operations;
- direct numerical inference;
- static web delivery.

## Skills Demonstrated

### Frontend

- **HTML/CSS/JavaScript — strong evidence.**
- **Canvas input — strong evidence.**
- **File upload handling — strong evidence.**
- **Async browser logic — strong evidence.**

### Machine Learning Deployment

- **TensorFlow.js — strong evidence.**
- **Client-side neural-network inference — strong evidence.**
- **Model artifact loading — strong evidence.**
- **Image preprocessing — strong evidence.**
- **Direct logistic-regression inference — strong evidence.**

### Delivery

- **Static ML deployment — strong evidence.**
- **GitHub Pages — strong deployment evidence.**

## Capability Developed

This repository turns trained model artifacts into user-operable software.

It demonstrates two important deployment intuitions:

- some models can be loaded into a browser runtime;
- simpler models can be reduced to their numerical parameters and executed directly without a framework.

## Portfolio Evolution Context

The immediately preceding `Portfolio-V2` is the earliest processed TensorFlow.js integration by repository creation date.

This repository provides the more focused deployment experiment that underlies part of that portfolio experience.

## Historical Significance

`Testing-Model-Deployment` is a concrete transition from ML experimentation toward deployment engineering.

It adds direct evidence that model-serving does not necessarily require a server: browser execution and static hosting can be viable for compatible models.

## Overall Repository Narrative

`Testing-Model-Deployment` is a compact but concrete client-side ML deployment prototype.

The repository contains the model files, JavaScript runtime integration, preprocessing, canvas and upload UX, prediction flow, numerical logistic-regression inference, and static deployment shape required to make machine-learning outputs directly usable in a browser.

# Project Tags

## Project Type

- `model-deployment-prototype`
- `static-web-application`
- `machine-learning-demo`
- `interactive-utility`

## Collaboration and Authorship

- `individual-project`

## Languages

- `html`
- `css`
- `javascript`

## Frontend

- `canvas-api`
- `canvas-drawing-input`
- `image-upload`
- `event-driven-ui`
- `async-javascript`

## Machine Learning

- `tensorflow-js`
- `browser-ml-inference`
- `client-side-model-loading`
- `handwritten-digit-recognition`
- `image-preprocessing`
- `browser-logistic-regression`
- `model-artifact-loading`
- `tensor-lifecycle-management`

## Cloud and Delivery

- `github-pages`
- `static-site-deployment`
- `static-model-deployment`
