# Repository 038 — Kalman-Filters

## Repository Identity

- **Repository:** `kirolossedra/Kalman-Filters`
- **Repository start date:** 2024-08-17
- **Last meaningful update date:** 2024-08-17
- **Primary implementation languages:** C++, Python
- **Build system:** CMake
- **Numerical library:** Eigen
- **Learning scope:** Kalman filter, EKF, UKF
- **Authorship context:** student-completed regions inside instructional scaffolding

## What This Project Is

`Kalman-Filters` is a structured state-estimation learning repository.

It contains a Python/Jupyter Kalman-filter preface, Extended Kalman Filter exercises, Jacobian work, lidar exercises, RMSE exercises, and a staged Unscented Kalman Filter implementation in C++/Eigen.

The UKF code explicitly surrounds learner work with `Student part begin` and `Student part end`, while expected numeric results are embedded beside the exercises.

That provides unusually strong provenance boundaries between student-completed logic and supplied scaffolding.

## Learning Progression

The repository progresses through:

1. scalar Gaussian update and prediction,
2. matrix Kalman filtering,
3. estimation-error metrics,
4. nonlinear-model preparation,
5. Jacobians,
6. lidar-oriented EKF exercises,
7. sigma-point generation,
8. augmented sigma points,
9. nonlinear sigma-point prediction,
10. weighted mean/covariance reconstruction,
11. radar measurement prediction,
12. state update.

## Kalman Preface Notebook

`Kalman_Preface.ipynb` begins with one-dimensional Gaussian fusion.

`update()` combines two means and variances.

`predict()` adds motion mean and uncertainty.

Executed notebook output demonstrates the equations. Updating `(10, 8)` with `(13, 2)` yields `[12.4, 1.6]`; predicting `(10, 4)` with motion `(12, 4)` yields `[22.0, 8.0]`.

The notebook then iterates update/predict cycles over a sequence of measurements and motions.

## Matrix Kalman Foundations

The notebook also includes a matrix abstraction with addition, subtraction, multiplication, transpose, identity, Cholesky decomposition, Cholesky-based inversion, and matrix inversion.

A later exercise defines state `x`, covariance `P`, transition `F`, measurement `H`, measurement uncertainty `R`, control `u`, and identity `I`.

This moves the work from scalar intuition to explicit matrix state estimation.

The notebook itself includes an external credit for the Cholesky helper material, so that infrastructure is not treated as original learner-authored numerical-library design.

## Extended Kalman Filter Scope

The EKF tree is organized into:

- `Initial Quiz`,
- `Jacobians`,
- `Lidar Quiz`,
- `RMSE`.

The structure demonstrates explicit study of nonlinear estimation subproblems rather than only a final opaque implementation.

Jacobians and sensor-specific exercises support the transition from linear filtering to nonlinear measurement reasoning.

## Unscented Kalman Filter

The C++ UKF source uses Eigen `MatrixXd` and `VectorXd`.

### Sigma-Point Generation

`GenerateSigmaPoints()` uses a five-dimensional state and covariance matrix.

The student region computes the covariance Cholesky factor and constructs the central, positive, and negative sigma points using the UKF spreading term.

An expected sigma-point matrix is preserved for comparison.

### Augmented Sigma Points

`AugmentedSigmaPoints()` expands the state from five to seven dimensions.

The two additional components model longitudinal-acceleration noise and yaw-acceleration noise.

The student region builds the augmented state, process-noise covariance, block covariance matrix, Cholesky factor, and positive/negative augmented points.

### Sigma-Point Prediction

`SigmaPointPrediction()` propagates each augmented sigma point through a nonlinear planar vehicle-motion model over `delta_t = 0.1`.

State components correspond to position, speed, yaw, and yaw rate.

Process-noise terms are added during propagation.

This is a nonlinear prediction step rather than linear `F*x` state transition.

### Mean and Covariance Reconstruction

`PredictMeanAndCovariance()` assigns UKF weights, computes the weighted predicted state, and accumulates covariance from sigma-point residuals.

Yaw residuals are normalized into the `[-π, π]` range before covariance accumulation.

That is concrete handling of periodic angular state.

### Radar Measurement Prediction

`PredictRadarMeasurement()` maps state-space sigma points into radar measurement space.

The resulting measurement dimensions are range, bearing, and radial velocity.

The source computes range with Euclidean norm, angle with `atan2`, and projected velocity for range rate.

It then calculates measurement mean/covariance and injects explicit radar measurement noise.

### State Update

The source proceeds to `UpdateState()` after radar-measurement prediction.

This completes the conceptual UKF cycle from uncertain state, through nonlinear propagation, into sensor-space correction.

## Numerical Verification

Expected vectors and matrices are embedded beside major UKF stages.

They cover generated sigma points, augmented points, predicted points, predicted state/covariance, radar measurement mean, and radar measurement covariance.

These expected values serve as concrete numerical correctness targets for the learner-completed sections.

The repository also commits CMake build artifacts, showing that the native exercises were configured and compiled.

## Engineering Skills Demonstrated

### Probabilistic State Estimation

The repository progresses from scalar fusion to nonlinear multi-dimensional state estimation.

### Linear Algebra

It uses covariance matrices, matrix multiplication, Cholesky decomposition, weighted outer products, and inversion.

### Nonlinear Motion Modeling

Sigma points are propagated through a vehicle-style nonlinear dynamic model.

### Sensor Modeling

Predicted state is transformed into radar range, bearing, and range-rate observations.

### Numerical Detail

Angle normalization prevents invalid covariance behavior around angular wrap-around.

### Native Build Workflow

CMake and Eigen establish a conventional C++ numerical-development environment.

## Authorship Boundary

The UKF source explicitly separates student-completed regions from fixed exercise structure.

The corpus therefore attributes the filled student logic while treating fixed example data, function skeletons, expected answers, and framework structure as instructional scaffolding.

That prevents completed coursework from being misrepresented as a fully original UKF library.

## Capability Developed

The major capability is reasoning about uncertain hidden state rather than only direct sensor measurements.

The repository develops covariance reasoning, prediction/correction cycles, nonlinear motion, sensor-space transforms, and validation against expected numerical outputs.

## Portfolio Evolution

This is the first processed repository dedicated to Kalman filtering.

It builds naturally on the earlier radar, lidar, camera, and sensor repositories.

The portfolio trajectory moves from generating and processing measurements toward estimating latent system state under uncertainty.

## Overall Project Narrative

`Kalman-Filters` is an executable estimation curriculum.

It begins with scalar Gaussian fusion, moves into matrix Kalman filtering and EKF preparation, then implements the major UKF stages in C++/Eigen.

The student work constructs and augments sigma points, predicts them through nonlinear vehicle motion, reconstructs weighted state/covariance, maps state into radar measurements, and advances into update logic.

Because scaffolding and expected outputs are explicit, the repository provides strong evidence of learned estimation skills without overstating ownership of the instructional framework.

# Project Tags

## Project Type
- `state-estimation-coursework`
- `educational-project`
- `course-assignment-repository`

## Languages
- `cpp`
- `python`

## Numerical Computing
- `kalman-filter`
- `extended-kalman-filter`
- `unscented-kalman-filter`
- `sigma-points`
- `augmented-sigma-points`
- `covariance-propagation`
- `cholesky-decomposition`
- `matrix-inversion`
- `jacobians`
- `rmse`
- `angle-normalization`
- `nonlinear-state-estimation`
- `eigen`

## Sensors and Autonomous Systems
- `lidar`
- `radar`
- `radar-measurement-model`
- `sensor-fusion`
- `vehicle-motion-model`

## Build and Verification
- `cmake`
- `build-artifact-evidence`
- `expected-output-verification`
- `executed-notebook-output`

## Collaboration and Authorship
- `course-supplied-infrastructure`
- `instructional-scaffold`
- `student-completed-exercises`

## Portfolio Significance
- `earliest-observed-kalman-filter`
- `earliest-observed-extended-kalman-filter`
- `earliest-observed-unscented-kalman-filter`
