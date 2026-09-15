# Sensors

## Repository Identity

- Repository: 026 / 134
- Name: `Sensors`
- Repository start date: 2024-04-27
- Last meaningful update date: 2024-07-13
- Primary type: Sensor-processing coursework and experiment archive
- Technical field: Autonomous vehicles, LIDAR point clouds, radar signal calculations
- Application domain: Self-driving vehicle perception
- Project context: Course-derived sensor-fusion study repository
- Collaboration type: `individual-project` with `course-supplied-infrastructure`
- Primary implementation environments: C++, Jupyter Notebook / Python
- Core external library: Point Cloud Library (PCL)

## Collaboration and Authorship Context

This repository requires explicit attribution boundaries.

The LIDAR project README identifies the material as the **Sensor Fusion Self-Driving Car Course** and links directly to Udacity's `SFND_Lidar_Obstacle_Detection` repository.

`LIDAR/Project/CODEOWNERS` assigns the project tree to:

`@udacity/active-public-content`

The LIDAR environment source also carries an `\author Aaron Brown` comment.

Accordingly, the repository-level architecture, scaffolding, README, rendering helpers, and supplied course structure should not be treated as wholly original personal engineering.

At the same time, the checked-in files contain filled TODO regions, task comments, parameter experimentation, simulation-result documentation, and notebook calculations that provide positive evidence of hands-on coursework execution.

The corpus therefore credits the exercised capabilities while explicitly marking the supplied infrastructure.

## Evidence Basis

The repository contains two major technical strands:

1. `Radar_.ipynb`;
2. a `LIDAR` directory containing a PCL-based C++ project.

The LIDAR tree includes:

- `CMakeLists.txt`;
- `CODEOWNERS`;
- course README;
- `environment.cpp`;
- `processPointClouds.cpp`;
- `processPointClouds.h`;
- rendering helpers;
- `lidar.h`;
- LIDAR result screenshots.

The radar notebook contains executed Python/NumPy cells, mathematical notes, numerical outputs, and plotted signal-processing exercises.

## What This Project Is

`Sensors` is a study repository for autonomous-vehicle sensing.

The radar notebook explores how automotive radar range and velocity are derived from physical and signal-processing relationships.

The LIDAR project processes point clouds into road/obstacle representations and object clusters using PCL.

Together these strands expose two complementary perception modalities:

- radar for range, beat-frequency, Doppler, and frequency-domain reasoning;
- LIDAR for dense 3D point-cloud filtering, segmentation, clustering, and bounding-box generation.

The repository is not simply conceptual notes: it contains executable calculations, executed notebook outputs, C++ processing functions, streamed PCD playback, and documented simulation images.

## Project Scope

### Radar Study

`Radar_.ipynb` covers:

- carrier frequency;
- wavelength;
- transmitted power;
- antenna gain;
- minimum detectable power;
- radar cross section;
- maximum radar range;
- range resolution;
- chirp bandwidth;
- chirp sweep time;
- beat frequency;
- target range estimation;
- Doppler frequency shift;
- radial velocity estimation;
- synthetic time-domain signals;
- injected noise;
- FFT-based frequency analysis.

### LIDAR Study

The C++ project covers:

- simulated LIDAR scanning;
- point-cloud visualization;
- voxel-grid downsampling;
- region-of-interest cropping;
- ego-vehicle roof removal;
- plane/obstacle separation;
- RANSAC plane segmentation through PCL;
- KD-tree-backed Euclidean clustering;
- 3D bounding boxes;
- PCD save/load;
- chronological PCD streaming;
- repeated frame playback;
- parameter tuning for city-block data.

## Architecture and System Shape

### Radar Path

```text
Radar physical parameters
      ↓
wavelength / range equations
      ↓
chirp bandwidth + sweep time
      ↓
beat-frequency range estimates
      ↓
Doppler frequency
      ↓
radial velocity estimates
      ↓
synthetic sampled signal
      ↓
noise injection
      ↓
FFT / frequency-domain analysis
```

### LIDAR Path

```text
LIDAR / PCD frame
      ↓
FilterCloud
  ├─ voxel grid
  ├─ ROI crop
  └─ roof-point removal
      ↓
SegmentPlane
  └─ PCL RANSAC plane model
      ↓
SeparateClouds
  ├─ road plane
  └─ obstacle cloud
      ↓
Clustering
  ├─ KD tree
  └─ Euclidean clusters
      ↓
BoundingBox
      ↓
PCL visualization
```

For streamed city data, the main loop repeatedly loads the next PCD frame, clears the viewer, runs the obstacle-detection pipeline, renders the result, and wraps back to the first frame at the end of the dataset.

## Technical Stack

### Python

The radar notebook uses Python for executable engineering calculations.

### NumPy

NumPy is used for:

- arrays;
- synthetic signals;
- random noise;
- numerical operations;
- FFT-related computation.

### Matplotlib

Matplotlib is used to visualize sampled/noisy signals and frequency-domain results in the notebook.

### Jupyter / Colab-Style Notebook

The notebook preserves:

- Markdown equations;
- executable code;
- numerical outputs;
- plotted figures.

### C++

C++ implements the point-cloud pipeline.

### Point Cloud Library (PCL)

PCL is used for:

- voxel-grid filtering;
- crop boxes;
- index extraction;
- SAC/RANSAC plane segmentation;
- KD-tree search;
- Euclidean cluster extraction;
- min/max 3D bounding-box calculation;
- PCD I/O;
- 3D visualization.

### Eigen

Eigen vector types define crop-box boundaries.

### Boost Filesystem

Boost filesystem iteration is used to enumerate and sort PCD files for chronological playback.

### CMake

The supplied project includes CMake configuration for the PCL-based executable.

## Radar Engineering Work

### Radar Wavelength

The notebook sets an automotive radar carrier frequency of 77 GHz and computes wavelength using:

```text
lambda = c / fc
```

The executed result is approximately 0.003896 m.

### Radar Maximum Range

The notebook defines:

- transmitted power;
- antenna gain;
- minimum detectable power;
- car radar cross-section;
- wavelength.

It then evaluates a radar-equation-style fourth-root expression.

The preserved output reports a maximum range of approximately **218.87 meters** for the selected parameters.

### Range Resolution and Chirp Design

The notebook computes chirp bandwidth from:

```text
B_sweep = c / (2 * range_resolution)
```

For 1-meter range resolution, the executed value is 150 MHz.

It computes chirp sweep time from maximum range and propagation speed.

### Beat-Frequency Range Estimation

The notebook evaluates several beat frequencies and converts them into ranges.

Preserved outputs include:

- 0 MHz → 0 m;
- 1.1 MHz → 12.1 m;
- 13 MHz → 143 m;
- 24 MHz → 264 m.

This is direct hands-on evidence of FMCW-style beat-frequency/range reasoning.

### Doppler Velocity Estimation

The notebook uses wavelength and Doppler frequency shift to calculate radial velocity.

Executed examples include both positive and negative shifts, preserving direction-sensitive velocity results.

### Synthetic Signal and Noise

A sampled signal is built from two sinusoids at distinct frequencies and then corrupted with random noise.

This creates a concrete input for frequency-domain inspection rather than discussing FFT only conceptually.

### FFT Analysis

The notebook explicitly transitions to FFT-based frequency analysis of the sampled signal.

## LIDAR Engineering Work

### Simulated Highway Scanning

`simpleHighway` initializes an ego vehicle and other cars.

The code creates a `Lidar` object, performs a scan, obtains a PCL point cloud, segments the road plane, clusters obstacle points, and renders clusters/bounding boxes.

Task comments in the file document the exercised sequence.

### Voxel-Grid Filtering

`FilterCloud` applies `pcl::VoxelGrid` with a configurable leaf size.

This reduces point density before later processing stages.

### Region-of-Interest Cropping

A `pcl::CropBox` keeps points inside configured spatial boundaries.

This focuses processing on the road region relevant to the vehicle.

### Ego-Vehicle Roof Removal

A second crop box identifies the roof region.

Those indices are passed to `pcl::ExtractIndices` with negative extraction so points belonging to the sensing vehicle are removed from the working cloud.

### Plane Segmentation

`SegmentPlane` configures `pcl::SACSegmentation` for:

- coefficient optimization;
- `SACMODEL_PLANE`;
- `SAC_RANSAC`;
- configured maximum iterations;
- configured distance threshold.

The inlier set is then separated from obstacle points.

### Road / Obstacle Separation

`SeparateClouds` constructs:

- a point cloud containing plane inliers;
- an obstacle cloud containing the remaining points.

### Euclidean Clustering

`Clustering` builds a PCL KD tree and configures `pcl::EuclideanClusterExtraction`.

Parameters control:

- spatial cluster tolerance;
- minimum cluster size;
- maximum cluster size.

Each cluster is copied into its own point cloud.

### Bounding Boxes

`BoundingBox` uses `pcl::getMinMax3D` to construct an axis-aligned bounding box around each cluster.

### PCD Storage and Playback

The processing class supports:

- ASCII PCD save;
- PCD load;
- directory streaming;
- chronological filename sorting.

The main loop repeatedly loads frames and runs the processing pipeline.

### Parameter Tuning

The city-block code uses different clustering tolerances and point-count limits for denser real PCD data.

Comments explicitly note that the parameters were changed because the real point cloud contains many more points than the earlier test cloud.

## Experimental Documentation

`LIDAR/readme.md` preserves screenshots from different simulations.

The documented comparisons include:

- initial LIDAR with one horizontal parameter;
- higher horizontal parameter;
- more LIDAR layers;
- higher radial setting;
- increased error.

This is direct evidence of varying sensor-model parameters and recording visual outcomes.

## Verification

### Executed Notebook Outputs

The radar notebook contains persisted numerical outputs for wavelength, maximum range, beat-frequency/range examples, and Doppler-derived velocities.

### Runtime Performance Instrumentation

The point-cloud processing functions time filtering, plane segmentation, and clustering using `std::chrono`.

They print elapsed milliseconds and, for clustering, the number of clusters found.

### Visual Simulation Inspection

The repository preserves LIDAR simulation screenshots and a PCL viewer workflow.

### Streamed Playback

Chronological PCD playback repeatedly runs the full detection pipeline over successive sensor frames, enabling observation across a sequence rather than only one static cloud.

## Engineering Practices

### Pipeline Decomposition

Point-cloud processing is separated into named operations:

- filtering;
- separation;
- segmentation;
- clustering;
- bounding boxes;
- persistence/streaming.

### Parameterization

Filter resolution, crop boundaries, RANSAC thresholds, clustering tolerance, and cluster sizes are configurable arguments.

### Performance Measurement

Filtering, segmentation, and clustering are explicitly timed.

### Real-vs-Simulated Parameter Adaptation

The code uses different settings for the simple simulated highway and denser city-block PCD data.

### Attribution Discipline

The repository itself preserves Udacity ownership/scaffolding evidence, so the corpus separates hands-on exercised skills from supplied project infrastructure.

## Scale and Complexity

### Data Scale

The LIDAR pipeline operates on 3D point clouds and streamed PCD sequences.

### Processing Scale

Each frame passes through several computational stages before rendering.

### Experimental Scale

The repository includes multiple LIDAR parameter variants plus a radar notebook with several physical/signal-processing exercises.

### Conceptual Complexity

The repository connects:

- radar physics;
- sampled signals;
- frequency-domain processing;
- 3D geometry;
- point-cloud filtering;
- robust plane estimation;
- spatial clustering;
- autonomous-vehicle perception.

## Skills Demonstrated

### Radar and Signal Processing

- **Radar range equation exercises — strong coursework evidence.**
- **FMCW beat-frequency range calculation — strong coursework evidence.**
- **Doppler velocity calculation — strong coursework evidence.**
- **Sampling and synthetic-signal generation — strong evidence.**
- **Noise injection — strong evidence.**
- **FFT/frequency-domain analysis — strong evidence.**

### LIDAR / Point Clouds

- **PCL point-cloud processing — strong coursework evidence.**
- **Voxel-grid downsampling — strong evidence.**
- **ROI cropping — strong evidence.**
- **RANSAC plane segmentation — strong evidence.**
- **KD-tree spatial search — strong evidence.**
- **Euclidean clustering — strong evidence.**
- **3D bounding boxes — strong evidence.**
- **PCD loading/streaming — strong evidence.**
- **3D visualization — strong evidence.**

### Languages and Tools

- **C++ — strong evidence.**
- **Python — strong evidence.**
- **NumPy — strong evidence.**
- **Matplotlib — strong evidence.**
- **Jupyter Notebook — strong evidence.**
- **CMake — repository-level course infrastructure evidence.**

### Engineering Practices

- **Processing-pipeline decomposition — strong evidence.**
- **Parameter tuning — strong evidence.**
- **Runtime timing — strong evidence.**
- **Experiment result documentation — strong evidence.**

## Capability Developed

`Sensors` broadens the portfolio from software and digital systems into autonomous-vehicle perception.

The repository exercises two different sensing philosophies:

- radar reduces electromagnetic/sampled-signal behavior into range and velocity estimates;
- LIDAR turns spatial point returns into filtered road geometry and clustered obstacles.

Even with the course-infrastructure boundary, the hands-on technical surface is substantial and introduces several perception and signal-processing capabilities not previously present together.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- Point Cloud Library;
- voxel-grid point-cloud filtering;
- crop-box ROI filtering;
- PCL RANSAC plane segmentation;
- KD-tree-backed Euclidean point-cloud clustering;
- PCD streaming;
- LIDAR 3D obstacle bounding boxes;
- radar maximum-range calculation;
- beat-frequency-to-range calculation;
- Doppler-frequency-to-velocity calculation;
- notebook-based FFT signal analysis in a sensor context.

The earlier RADAR team repository already establishes radar/autonomous-vehicle collaboration; this repository adds concrete radar math exercises and detailed LIDAR point-cloud processing.

## Historical Significance

`Sensors` marks a major expansion of the autonomous-systems thread.

It records practical engagement with both radar signal concepts and LIDAR obstacle-processing pipelines, while also providing unusually explicit evidence of course-supplied infrastructure.

That makes it useful for later RAG queries about both technical capability and how coursework-based evidence should be weighted.

## Overall Repository Narrative

`Sensors` is a course-derived autonomous-vehicle sensing repository combining a radar notebook with a PCL-based LIDAR obstacle-detection project.

The radar work computes wavelength, radar range, chirp bandwidth, sweep time, beat-frequency range, Doppler velocity, and frequency-domain behavior of noisy sampled signals.

The LIDAR work filters point clouds through voxel grids and spatial crops, removes ego-vehicle points, segments road planes with PCL RANSAC, clusters obstacles with KD-tree-backed Euclidean extraction, generates bounding boxes, streams PCD frames, and records simulation results under changing sensor parameters.

The repository's strongest analytical interpretation is hands-on sensor-processing coursework built on explicitly supplied Udacity infrastructure.

# Project Tags

## Project Type

- `sensor-processing-coursework`
- `autonomous-vehicle-coursework`
- `course-assignment-repository`

## Collaboration and Authorship

- `individual-project`
- `course-supplied-infrastructure`
- `instructional-scaffold`

## Languages

- `cpp`
- `python`

## Machine Learning and Numerical Computing

- `numpy`
- `jupyter-notebook`
- `matplotlib`
- `fft`

## Sensors and Signal Processing

- `radar`
- `lidar`
- `radar-range-equation`
- `fmcw-radar`
- `beat-frequency`
- `doppler-velocity`
- `signal-sampling`
- `noise-injection`
- `frequency-domain-analysis`

## Point Clouds and Perception

- `pcl`
- `point-cloud-processing`
- `voxel-grid-filtering`
- `crop-box-filtering`
- `ransac-plane-segmentation`
- `kd-tree`
- `euclidean-clustering`
- `bounding-boxes`
- `pcd-io`
- `pcd-streaming`
- `obstacle-detection`

## Build and Tooling

- `cmake`
- `boost-filesystem`
- `eigen`

## Testing and Verification

- `executed-notebook-output`
- `runtime-performance-timing`
- `visual-simulation-verification`
- `experimental-result-documentation`

## Portfolio Significance

- `earliest-observed-pcl`
- `earliest-observed-point-cloud-processing`
- `earliest-observed-lidar-obstacle-pipeline`
- `earliest-observed-radar-range-equation`
- `earliest-observed-doppler-velocity-calculation`
- `earliest-observed-sensor-fft`
