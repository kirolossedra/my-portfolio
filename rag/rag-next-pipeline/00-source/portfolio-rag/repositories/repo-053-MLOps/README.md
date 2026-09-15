# Repository 053 — MLOps

## Repository Identity

- **Repository:** `kirolossedra/MLOps`
- **Repository start date:** 2024-10-10
- **Last meaningful update date:** 2024-10-11
- **Primary implementation environment:** Jupyter Notebook / Python
- **Primary API framework:** FastAPI
- **Model-serving context:** image upload / object-detection inference experiment
- **Serving runtime evidence:** Uvicorn imports and local API documentation route
- **Collaboration classification:** individual learning repository
- **Repository type:** model-serving / API deployment experiment

## What This Project Is

`MLOps` is a small repository focused on exposing machine-learning functionality through an HTTP API.

The substantive artifact is:

`Simple Deployment using FAST Api/Deploying an ML Model.ipynb`.

The accompanying README documents a manual interaction flow:

1. navigate to the notebook-provided API link,
2. open the API interface,
3. upload an image,
4. receive a response.

This is model-serving experimentation rather than model training alone.

## FastAPI Setup

The executed notebook installs FastAPI.

Saved installation output shows FastAPI and its dependencies being installed.

The notebook imports:

- `FastAPI`,
- `UploadFile`,
- `File`,
- `HTTPException`,
- response classes.

This is direct framework usage.

## Uvicorn / Async Notebook Serving

The notebook imports:

- `uvicorn`,
- `nest_asyncio`.

These are commonly used to run an ASGI FastAPI application from an interactive notebook context.

The repository therefore experiments with serving the API from the notebook environment.

## API Application

The notebook creates FastAPI applications.

Visible code includes:

`app = FastAPI(...)`.

The API is not only described in prose.

Actual route decorators are present.

## File Upload Route

The notebook defines an HTTP POST endpoint at:

`/upload`.

It accepts:

`UploadFile = File(...)`.

This is concrete multipart file-upload handling.

## Prediction Route

The notebook also defines:

`@app.post("/predict")`.

The prediction function accepts:

- a selected model,
- an uploaded file.

This creates an API boundary around image/model inference behavior.

## Model Selection

The notebook defines a string `Enum` named `Model`.

Visible options include:

- `yolov3-tiny`,
- `yolov3`.

This makes model choice part of the typed API input rather than a hidden constant.

## Image Processing

The API code imports:

- OpenCV (`cv2`),
- NumPy,
- streaming/JSON response classes.

The notebook therefore combines:

HTTP upload
→ binary image handling
→ computer-vision processing/inference path
→ API response.

## Interactive API Documentation

Saved notebook text instructs the user to navigate to:

`http://localhost:8000/docs`.

This is FastAPI's generated OpenAPI/Swagger-style interactive documentation interface.

The repository README screenshots document use of an upload interface and resulting response.

## API Error Handling

The notebook imports and uses `HTTPException` in the serving code path.

This introduces explicit HTTP failure semantics rather than only raw Python exceptions.

## Streaming / JSON Responses

The notebook imports response classes including:

- `StreamingResponse`,
- `JSONResponse`.

This shows experimentation with different HTTP response representations.

## Dependency Installation

The notebook installs packages interactively.

Visible installation activity includes:

- FastAPI,
- TensorFlow,
- OpenCV-related packages.

This demonstrates environment setup work but also exposes dependency-management problems.

## Dependency Conflict Evidence

Saved notebook output records an installation error for:

`tensorflow-keras`.

It also records a NumPy/TensorFlow compatibility warning where TensorFlow 2.17 expects NumPy below 2.0 but NumPy 2.1.2 is installed.

This is significant operational evidence.

The corpus retains it because model deployment is partly about environment compatibility.

## CPU Runtime Evidence

TensorFlow output in the notebook reports that CUDA drivers were not found and GPU would not be used.

That indicates the tested notebook environment was CPU-oriented at that point.

This is execution-environment evidence, not a design requirement.

## README Verification

The nested README contains screenshots showing:

- the API running,
- the upload interaction,
- a returned response.

This is manual end-to-end evidence that the serving workflow was exercised.

## What “Deployment” Means Here

The repository calls the exercise deployment.

The inspected evidence supports:

- a running FastAPI application,
- notebook-hosted/local serving,
- interactive API access,
- uploaded-image processing.

The repository does not establish a persistent production cloud deployment.

The corpus therefore uses `model-serving-experiment` rather than implying production hosting.

## MLOps Scope

The repository name is broad.

The implementation is narrower.

Concrete MLOps-related capability shown here is:

- packaging inference behind an HTTP boundary,
- runtime dependency setup,
- endpoint interaction,
- input handling,
- deployment troubleshooting.

It does not yet demonstrate a full ML lifecycle platform.

## Not Evidenced

The repository does not establish:

- model registry,
- experiment tracking,
- feature store,
- CI/CD for ML,
- automated retraining,
- drift monitoring,
- canary deployment,
- container orchestration.

Those terms are intentionally omitted from project tags.

## Testing and Verification

Verification is manual and notebook-based.

Evidence includes:

- executed package installation,
- running API output,
- interactive docs,
- uploaded image flow,
- README screenshots.

No automated API test suite is checked in.

## Skills Demonstrated

### Backend / APIs

- FastAPI
- POST endpoints
- file upload handling
- typed enum input
- HTTP exceptions
- JSON/streaming responses
- interactive OpenAPI docs

### ML Serving

- inference API boundary
- selectable YOLO model variants
- image ingestion
- OpenCV integration

### Runtime / Operations

- package installation
- dependency compatibility troubleshooting
- notebook-hosted ASGI serving
- Uvicorn
- CPU runtime observation

## Capability Developed

This repository develops a key productization transition:

a model is no longer useful only through a notebook cell.

It becomes callable through an HTTP contract.

That introduces new concerns:

- request validation,
- binary input,
- model selection,
- response design,
- runtime dependencies,
- serving process.

## Portfolio Evolution

The preceding repositories are heavily model- and data-oriented.

`MLOps` begins moving those capabilities toward service integration.

This is important because later software projects can consume an API without embedding an ML notebook.

## Historical Significance

Within the processed corpus, this is the earliest observed repository centered specifically on exposing ML/computer-vision inference through FastAPI.

It is also an early explicit bridge between ML experimentation and backend service behavior.

## Limitations

The work is notebook-centric.

The API is not packaged as a standalone service repository.

No production hosting configuration is checked in.

No container is present.

No automated tests are present.

No CI/CD is present.

Dependency conflicts are visible in saved output.

The broad `MLOps` repository name should therefore not be interpreted as evidence for every MLOps discipline.

## Overall Narrative

`MLOps` is a focused model-serving experiment.

It exposes image/model functionality through FastAPI, supports file uploads and model selection, runs an interactive API surface, and documents a manual end-to-end request flow.

Its operational problems are also informative: package conflicts and CPU-only TensorFlow output show the friction involved in turning notebook ML into a callable service.

# Project Tags

- `individual-project`
- `python`
- `jupyter-notebook`
- `ml-serving`
- `model-serving-experiment`
- `fastapi`
- `asgi`
- `uvicorn`
- `rest-api`
- `http-post`
- `file-upload`
- `multipart-form-data`
- `openapi`
- `swagger-ui`
- `http-exception-handling`
- `json-response`
- `streaming-response`
- `opencv`
- `computer-vision`
- `yolov3`
- `yolov3-tiny`
- `inference-api`
- `dependency-troubleshooting`
- `manual-verification`
