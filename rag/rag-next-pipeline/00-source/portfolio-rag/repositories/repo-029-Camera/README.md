# Camera

## Repository Identity

- Repository: 029 / 134
- Name: `Camera`
- Repository Start Date: 2024-05-28
- Latest Meaningful Update Date: 2024-07-03
- Primary Environment: Jupyter Notebook / Python
- Technical Field: Computer vision, autonomous-driving perception, time-to-collision
- Primary Context: Perception and sensor-processing lab collection
- Collaboration Type: Individual repository artifact with notebook-provenance qualification

## Collaboration and Authorship Context

Repository commits are owner-attributed and show the owner repeatedly uploading, organizing and renaming the lab artifacts.

The small TTC notebooks expose their implementation directly and are therefore strong evidence of hands-on Python perception work.

Two much larger notebooks are also present for feature tracking and lidar/object detection.

Because those multi-megabyte notebooks cannot be completely exposed through the repository connector, this README treats their names and surrounding data as positive scope evidence without manufacturing detailed algorithm claims from filenames alone.

## What This Project Is

`Camera` is a collection of autonomous-driving perception experiments organized into three major areas:

1. feature tracking,
2. lidar and object detection,
3. time-to-collision estimation.

The TTC portion is split into:

- camera-based TTC,
- lidar-based TTC.

The repository combines Jupyter notebooks with binary `.dat` inputs and image artifacts.

This gives it the shape of a technical lab workspace rather than a single standalone application.

## Repository Structure

The checked-in tree includes:

```text
Camera/
├── Feature Tracking/
│   ├── Feature_Tracking.ipynb
│   ├── DRBS.dat
│   ├── DSBS.dat
│   ├── KRBS.dat
│   ├── KSBS.dat
│   ├── gauss.png
│   ├── gaussrgb.png
│   ├── im1mono.png
│   └── im2mono.png
├── Lidar and Object Detection/
│   └── Lidar_and_Object_Detection.ipynb
└── TTC/
    ├── Camera/
    │   ├── CameraTTC.ipynb
    │   ├── matchA.dat
    │   ├── refA.dat
    │   └── srcA.dat
    └── Lidar/
        ├── LidarTTC.ipynb
        ├── first.dat
        └── prev.dat
```

This organization separates perception problems by sensing modality and analysis purpose.

## Technical Workflow

At a high level, the repository contains several perception workflows:

```text
image / feature data
        ↓
camera keypoints + matches
        ↓
relative feature-distance change
        ↓
camera TTC
```

and:

```text
lidar point snapshots
        ↓
ego-lane filtering
        ↓
closest longitudinal distance
        ↓
lidar TTC
```

The surrounding notebooks broaden the workspace toward feature tracking and lidar/object-detection experimentation.

## Camera-Based Time-to-Collision

`TTC/Camera/CameraTTC.ipynb` contains directly inspectable Python implementation.

The notebook loads binary keypoint and match data.

It reconstructs:

- `cv2.KeyPoint` objects,
- `cv2.DMatch` objects.

The binary reader uses Python’s `struct` module to unpack serialized records.

That means the notebook is not only performing TTC mathematics; it also bridges previously serialized native/OpenCV-style structures into Python objects.

## Binary Keypoint Parsing

The camera TTC notebook implements helpers for reading packed binary data.

Keypoint records are interpreted as:

- x,
- y,
- size,
- angle,
- response,
- octave,
- class ID.

Match records are interpreted as:

- query index,
- train index,
- image index,
- distance.

Those values are then reconstructed into OpenCV objects.

This is concrete cross-representation data handling.

## Camera TTC Algorithm

`compute_ttc_camera` compares geometric spacing between matched keypoints across consecutive frames.

For each pair of matches, the implementation calculates:

- current-frame keypoint distance,
- previous-frame keypoint distance,
- the ratio between those distances.

Ratios are accepted only when:

- the previous distance is above floating-point epsilon,
- the current distance is at least 100 pixels.

The algorithm then uses the median of the accepted ratios.

Using the median makes the estimate less sensitive to outlying feature-pair ratios than a simple mean.

With frame interval:

```text
dT = 1 / frame_rate
```

the notebook computes TTC as:

```text
TTC = -dT / (1 - median_distance_ratio)
```

## Camera TTC Executed Result

The notebook executes the implementation against the checked-in keypoint and match data with a 10 FPS frame rate.

The preserved output is approximately:

```text
12.454468169322238 seconds
```

That provides concrete execution evidence rather than only a formula.

## Lidar Data Representation

`TTC/Lidar/LidarTTC.ipynb` defines a `LidarPoint` object containing:

- x,
- y,
- z,
- reflectivity.

The notebook implements binary serialization/deserialization helpers with Python `struct`.

It loads two point snapshots:

- `first.dat`,
- `prev.dat`.

Preserved notebook output shows actual point values and reflectivity measurements being decoded.

## Lidar-Based Time-to-Collision

The lidar TTC calculation works on two sequential point clouds.

The function filters points to the ego lane using lateral `y` position.

It then determines the closest longitudinal `x` position in each frame.

Conceptually:

```text
previous lidar points ─┐
                       ├─ ego-lane filtering
current lidar points ──┘
            ↓
closest x in each frame
            ↓
distance change over dT
            ↓
TTC estimate
```

The notebook uses a measurement interval of `0.1` seconds.

Its TTC expression is:

```text
min_x_current * dT
---------------------------
min_x_previous - min_x_current
```

The implementation explicitly handles a zero denominator by returning infinity.

## Sensor-Modality Comparison

One valuable property of the repository is that TTC is approached through two distinct sensing modalities.

### Camera TTC

Uses changes in relative spacing between matched visual keypoints.

### Lidar TTC

Uses direct longitudinal distance change from 3D point measurements inside the ego lane.

This creates a concrete conceptual comparison between indirect image-space motion cues and direct ranging data.

## Feature Tracking Workspace

The repository includes a substantial `Feature_Tracking.ipynb` notebook together with:

- multiple `.dat` files,
- monochrome images,
- Gaussian-related image outputs.

The artifact names establish feature-tracking experimentation as a material repository scope.

The corpus does not infer specific detector/descriptor algorithms solely from those filenames.

## Lidar and Object Detection Workspace

A separate multi-megabyte notebook is checked in as:

`Lidar_and_Object_Detection.ipynb`

This establishes lidar/object-detection experimentation as another material repository workstream.

The TTC notebooks provide the directly inspectable lidar calculations used for more detailed capability claims.

## Technical Stack

### Python

Used for notebook execution, numeric processing and binary data handling.

### NumPy

Used for Euclidean norms, arrays, medians and numerical computation.

### OpenCV

Used for camera feature structures including `KeyPoint` and `DMatch`.

### Jupyter / Colab

Used as the interactive computational environment.

### Python `struct`

Used to decode packed binary records into Python representations.

## Engineering Practices

### Problem Decomposition by Sensor

Camera and lidar TTC are stored separately.

This makes modality-specific assumptions explicit.

### Robust Statistic

The camera implementation selects the median distance ratio.

### Boundary Handling

The lidar TTC calculation explicitly guards a zero denominator.

### Reusable Data Readers

Binary reading behavior is factored into helper functions.

### Reproducible Inputs

The repository checks in the `.dat` snapshots consumed by the TTC notebooks.

## Verification and Execution Evidence

The camera notebook preserves a concrete TTC output.

The lidar notebook preserves decoded sensor-point outputs.

These notebook outputs demonstrate that the code paths were executed against the included data.

## Implementation Scale

This repository is substantially larger than a single lab notebook.

Its checked-in artifacts cover:

- feature tracking,
- lidar/object detection,
- camera TTC,
- lidar TTC,
- binary input data,
- image artifacts.

Two notebooks are multi-megabyte artifacts, reflecting substantial embedded outputs or visual content.

## Skills Demonstrated

### Computer Vision

- camera keypoints,
- feature matches,
- geometric distance calculations,
- visual TTC estimation,
- feature-tracking experimentation.

### Lidar and Sensor Processing

- point representation,
- reflectivity,
- lane-based point filtering,
- longitudinal range comparison,
- lidar TTC.

### Python Data Handling

- binary parsing,
- object reconstruction,
- NumPy numerical processing,
- notebook execution.

### Autonomous Driving

- perception-oriented analysis,
- TTC estimation,
- multi-modality sensing concepts,
- vehicle-relative distance reasoning.

## Capability Developed

This repository adds a particularly useful perception capability to the portfolio: estimating collision timing from both cameras and lidar.

Earlier autonomous-driving work already covered radar and lidar detection/simulation.

`Camera` adds explicit temporal reasoning about how quickly a target is being approached.

That moves the portfolio from merely describing sensed objects toward deriving an actionable dynamic quantity from successive observations.

## Historical Portfolio Significance

By repository chronology, this is the earliest processed repository with directly evidenced time-to-collision computation.

It is also the earliest processed repository with directly inspectable OpenCV keypoint/match reconstruction.

The repository extends the autonomous-systems portfolio toward richer perception analytics.

## Overall Project Narrative

`Camera` is an autonomous-driving perception lab collection built around the idea that raw sensor observations become useful only after they are transformed into geometric or temporal estimates.

Its clearest implementation examples are the paired TTC notebooks.

The camera path derives TTC from matched-feature geometry.

The lidar path derives TTC from changes in closest forward range.

Together they show the same physical question being solved from different data modalities.

The broader feature-tracking and lidar/object-detection workspaces place these calculations inside a wider perception-learning trajectory.

# Project Tags

- `python`
- `jupyter-notebook`
- `numpy`
- `opencv`
- `computer-vision`
- `autonomous-driving`
- `robotics-perception`
- `camera-perception`
- `lidar`
- `sensor-processing`
- `time-to-collision`
- `camera-ttc`
- `lidar-ttc`
- `keypoint-matching`
- `opencv-keypoints`
- `opencv-dmatch`
- `binary-data-parsing`
- `python-struct`
- `robust-median`
- `ego-lane-filtering`
- `reproducible-input-data`
- `feature-tracking`
- `lidar-object-detection`
- `individual-project`
- `earliest-observed-time-to-collision`
- `earliest-observed-camera-ttc`
- `earliest-observed-lidar-ttc`
- `earliest-observed-opencv-keypoint-processing`
