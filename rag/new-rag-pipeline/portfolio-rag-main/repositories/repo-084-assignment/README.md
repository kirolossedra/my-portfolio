# Repository 084 — assignment

## Repository Identity

- **Repository:** `kirolossedra/assignment`
- **Corpus index:** 084
- **Repository start date:** 2025-05-26
- **Last meaningful update date:** 2025-05-26
- **Latest meaningful commit:** `e02a15c2e703948a93a6c88af4259bd701570415`
- **Primary repository language:** Python
- **Project form:** numerical robotics / inverse-kinematics experiment
- **Collaboration classification:** `individual-project`
- **Substantive source:** `test.py`

## Evidence Basis

The repository contains one substantive Python source file and a minimal README.

The analysis is therefore based primarily on `test.py` plus repository history.

The file directly imports:

- NumPy;
- Matplotlib;
- Matplotlib 3D tooling;
- `roboticstoolbox`;
- `DHRobot`;
- `RevoluteDH`.

The code defines a spatial manipulator using Denavit-Hartenberg parameters.

It implements and compares multiple Jacobian-based inverse-kinematics methods.

The repository name `assignment` does not communicate this domain.

The code does.

## What the Project Is

This project is a numerical robotics experiment for iterative inverse kinematics of a spatial anthropomorphic manipulator.

The source models a revolute-joint serial robot.

It computes end-effector pose through forward kinematics.

It then iteratively drives the robot toward a desired pose using Jacobian-based update laws.

The implementation compares three main methods:

- Jacobian pseudoinverse using SVD;
- damped least-squares pseudoinverse;
- Jacobian transpose.

It records trajectories and errors for analysis.

It produces multiple comparative plots.

This is not a generic Python assignment.

It is a focused robotics/control/numerical-methods implementation.

## Project Scope

The implemented scope is a numerical comparison of Jacobian-based inverse-kinematics techniques on a spatial serial manipulator model.

The repository does not attempt dynamics, torque control, path planning, collision avoidance, hardware control, or a complete robotics application.

Its focus is task-space convergence and algorithm comparison.

## Manipulator Model

The source constructs a `DHRobot`.

The link model uses revolute DH joints.

The comments describe the intended physical interpretation as:

- base/shoulder yaw;
- shoulder pitch;
- elbow pitch;
- wrist joint.

The code defines:

- link lengths;
- base height offset;
- DH `d`;
- DH `a`;
- DH `alpha`.

A target pose is defined numerically.

An initial joint-angle guess is also defined.

## Pose Representations

The code provides two pose functions.

### Full Pose

`ee_pose_spatial` computes:

- x;
- y;
- z;
- roll;
- pitch;
- yaw.

It obtains position and rotation from `fkine`.

Euler angles are extracted from the rotation matrix.

The code explicitly handles a singular branch in the Euler conversion.

### Simplified Pose

`ee_pose_simplified` returns:

- x;
- y;
- z;
- summed joint angle.

This creates a reduced orientation representation for comparative iteration.

The main comparison path uses the simplified target.

## Inverse-Kinematics Algorithms

### SVD Pseudoinverse

`JacobianPseudoinverse_SVD`:

1. computes an SVD;
2. thresholds singular values;
3. reciprocates values above the threshold;
4. reconstructs a pseudoinverse.

This explicitly handles small singular values.

### Damped Least Squares

`JacobianPseudoinverse` computes a damped inverse based on:

```text
(JᵀJ + λI)^-1 Jᵀ
```

The damping term is intended to improve numerical stability.

This provides a second treatment of singular or ill-conditioned Jacobian behavior.

### Jacobian Transpose

`JacobianTranspose` returns a scaled transpose.

An additional adaptive transpose function adjusts its scaling using the current error magnitude.

The three main comparison algorithms stored in the run dictionary are:

- SVD pseudoinverse;
- damped least squares;
- Jacobian transpose.

## Iterative Solver

`IK_Jacobian_Spatial` implements the reusable iterative solve loop.

Its inputs include:

- IK algorithm;
- manipulator;
- target pose;
- initial guess;
- pose function;
- step size;
- maximum iterations;
- tolerance;
- Jacobian mode.

On every iteration, it:

1. computes current end-effector pose;
2. computes target error;
3. records pose history;
4. records error history;
5. records joint-angle history;
6. records error norm;
7. tests convergence;
8. builds the appropriate Jacobian;
9. applies the selected algorithm;
10. updates joint angles.

This design makes the numerical method swappable without duplicating the full solve loop.

## Reduced Jacobian Construction

For the simplified four-component pose, the source builds a reduced Jacobian.

The first three rows come from the translational portion of the robotics-toolbox Jacobian.

The orientation row is modeled as ones because the simplified orientation is the sum of joint angles.

This is an explicit modeling choice.

It is not equivalent to a full physical 6-DOF orientation Jacobian.

The code retains a path for the full Jacobian.

The main comparison configuration uses the simplified representation.

## Convergence Criteria

The solver computes a norm of the pose error.

It stops when the norm drops below a tolerance.

It also has a maximum-iteration cap.

The current comparison call uses:

- a small step size;
- up to 1,500 iterations;
- a tight tolerance.

The source prints whether convergence occurs or maximum iterations are reached.

## Experiment Harness

The source defines an algorithm dictionary.

The main run executes each method under the same general target and initial-guess setup.

For each algorithm it stores:

- final joint pose;
- end-effector trajectory;
- error history;
- joint trajectory;
- convergence metrics.

That shared result format supports consistent downstream comparison.

## Visualization

The project contains an extensive visualization layer.

### 3D End-Effector Trajectories

Each algorithm receives a 3D trajectory plot.

The plots include:

- path;
- start;
- target;
- approximate workspace boundary.

### Per-Dimension Error

Separate error plots show:

- X error;
- Y error;
- Z error;
- orientation error.

Each algorithm receives a dedicated column.

### Pose Trajectory

The code plots executed pose dimensions against target values.

This exposes how each state component approaches the target.

### Joint Trajectory

Joint-angle histories are plotted individually.

This makes numerical convergence visible in configuration space as well as task space.

### Convergence Comparison

A convergence plot compares error norms between algorithms.

The source also prints a comprehensive results summary.

## Architecture / System Shape

The project is a self-contained numerical experiment.

A simplified flow is:

```text
DH robot model
     |
     v
forward kinematics
     |
     v
current end-effector pose
     |
     v
target error
     |
     v
robot Jacobian
     |
     +-----------------------------+
     |              |              |
     v              v              v
SVD pinv        DLS pinv       J transpose
     |              |              |
     +--------------+--------------+
                    |
                    v
             joint update
                    |
                    v
          trajectory + metrics
                    |
                    v
               plots/report
```

There is no application server.

There is no UI product.

There is no robotics middleware in this repository.

The emphasis is algorithmic comparison.

## Technical Stack

- Python
- NumPy
- Matplotlib
- Matplotlib 3D
- Robotics Toolbox for Python
- DHRobot
- RevoluteDH
- linear algebra
- numerical optimization-style iteration

## Major Engineering Work

### 1. Spatial Robot Modeling

The repository moves beyond a planar hand-written kinematics model.

It uses a DH representation and a robotics library to model a serial manipulator.

### 2. Full / Simplified Pose Abstraction

Two pose functions allow experimentation at different output dimensions.

This makes the solver reusable.

### 3. Multiple Jacobian Methods

The same target problem is approached with multiple update rules.

That turns the script into a comparison experiment rather than a single hard-coded solver.

### 4. Numerical-Stability Handling

The SVD path thresholds singular values.

The damped path adds regularization.

These are directly relevant to inverse-kinematics stability.

### 5. Instrumentation

The solver records enough history to study behavior after execution.

It does not only return a final joint configuration.

### 6. Comparative Visualization

The project builds several views of the same experiment:

- task-space geometry;
- component-level error;
- component-level pose;
- joint trajectories;
- aggregate convergence.

This is useful engineering-analysis discipline.

## Testing & Verification Evidence

There is no formal unit-test suite.

There is no `pytest` setup.

There is no CI workflow.

There are no assertions establishing expected numerical outputs.

Verification is experiment-oriented.

Evidence of runtime-oriented verification includes:

- convergence tolerance;
- maximum iteration guard;
- convergence/error output;
- comparative plots;
- final summary printing.

This is numerical experiment instrumentation.

It is not automated regression testing.

## Engineering Discipline

Strong aspects visible in source:

- algorithms isolated as functions;
- solver parameterization;
- consistent result schema;
- explicit numerical tolerances;
- singular-value thresholding;
- damped inverse option;
- iteration cap;
- trajectory capture;
- shared comparison conditions.

Constraints:

- one large source file;
- no dependency manifest;
- no environment lock;
- no unit tests;
- no CI;
- no saved benchmark output in the repository;
- no reproducibility document beyond code constants;
- joint limits are present only as commented optional logic;
- the model description says RRR while the implementation constructs four revolute joints.

That last inconsistency matters.

The source variable is called `spatial_rrr`, but the DHRobot list contains four `RevoluteDH` entries.

The corpus should therefore describe the actual implementation as four revolute joints rather than blindly repeating the RRR label.

## Product Engineering

This repository is not a product.

It is a computational robotics assignment/experiment.

Its strongest value is technical analysis.

No evidence supports:

- end-user deployment;
- physical robot execution;
- hardware integration;
- ROS integration;
- real-time control guarantees;
- safety constraints;
- collision avoidance.

## Scale and Complexity

The repository is tiny in file count.

The source file is comparatively substantial.

Complexity comes from:

- 3D kinematics;
- coordinate transformations;
- Euler-angle extraction;
- Jacobian manipulation;
- SVD;
- damping;
- iterative control;
- multi-dimensional visualization.

This is algorithmic/numerical complexity rather than system-scale complexity.

## Skills Demonstrated

Evidence supports:

- Python;
- NumPy;
- numerical linear algebra;
- robotics kinematics;
- Denavit-Hartenberg modeling;
- forward kinematics;
- inverse kinematics;
- Jacobian methods;
- SVD pseudoinverse;
- damped least squares;
- Jacobian transpose;
- convergence analysis;
- pose-error modeling;
- Matplotlib;
- 3D visualization;
- experiment comparison.

## What Was Learned / Capability Developed

This repository demonstrates a move from using a robotics library as a black box toward reasoning about iterative IK directly.

The code explicitly controls:

- the pose representation;
- the Jacobian reduction;
- the inverse method;
- convergence threshold;
- update rate;
- error recording.

The most transferable capability is comparative numerical experimentation.

Instead of asking whether one algorithm works, the script creates an infrastructure for comparing how several methods converge.

## Portfolio Evolution Context

Earlier robotics repositories in the corpus focused on ROS, navigation, URDF, perception, and sensor processing.

This repository returns to a lower-level mathematical layer.

It emphasizes manipulator kinematics and numerical solution behavior.

It complements the broader robotics portfolio by adding explicit iterative inverse-kinematics reasoning.

## Historical Significance

Within the processed corpus, this is the clearest observed implementation of:

- Robotics Toolbox for Python;
- DHRobot modeling;
- Jacobian pseudoinverse comparison;
- damped least-squares inverse kinematics;
- inverse-kinematics convergence visualization.

## Limitations and Missing Evidence

The repository does not establish:

- execution on physical hardware;
- real-time performance;
- collision checking;
- joint-limit enforcement;
- torque control;
- dynamics;
- controller stability proof;
- automated tests;
- benchmark reproducibility across machines.

The defined positive-definite CLF-style or optimization concepts from later robotics work should not be projected backward onto this repo.

This source is a Jacobian IK comparison.

## Overall Narrative

`assignment` is poorly named but technically specific.

It is a numerical robotics study that compares several Jacobian-based inverse-kinematics methods on a spatial serial manipulator.

The code builds a common experiment harness, records rich trajectory data, and visualizes convergence from several angles.

Its portfolio significance is mathematical robotics implementation and comparative numerical reasoning rather than product scale.

# Project Tags

- `individual-project`
- `python`
- `numpy`
- `matplotlib`
- `robotics`
- `robotics-toolbox-python`
- `denavit-hartenberg`
- `dhrobot`
- `serial-manipulator`
- `forward-kinematics`
- `inverse-kinematics`
- `jacobian`
- `jacobian-pseudoinverse`
- `svd`
- `damped-least-squares`
- `jacobian-transpose`
- `numerical-methods`
- `convergence-analysis`
- `pose-estimation`
- `euler-angles`
- `3d-visualization`
- `trajectory-analysis`
- `experiment-comparison`
- `earliest-observed-robotics-toolbox-python`
- `earliest-observed-damped-least-squares-ik`
