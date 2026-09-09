# Repository 089 — Robotics-Project

## Repository Identity

- **Repository:** `kirolossedra/Robotics-Project`
- **Corpus index:** 089
- **Repository start date:** 2025-07-09
- **Last meaningful update date:** 2025-07-09
- **Latest meaningful commit:** `8980cce61274faca32179b4f9fa39cfb25965c8d`
- **Primary repository language:** Python
- **Project form:** mobile-robot control experiment
- **Collaboration classification:** `individual-project`
- **Substantive source:** `CLF-ONLY.py`

## Evidence Basis

The repository contains one short Python script plus a minimal README.

The script imports an external/local module:

`mobile_manipulator_unicycle_sim`

That simulator implementation is not checked into this repository.

The analysis can therefore evaluate the controller integration code.

It cannot independently validate the simulator internals.

The filename `CLF-ONLY.py` describes the intended control approach.

The comments also describe a simple CLF-based control law.

However, the positive-definite matrix `P` defined as the “CLF Matrix” is not used in the visible control update.

There is no explicit Lyapunov-function evaluation or derivative constraint in the checked-in loop.

Therefore this corpus should not overstate the implementation as a formal CLF-QP controller.

## What the Project Is

Robotics-Project is a compact mobile-manipulator/unicycle navigation controller experiment.

It initializes a simulation with:

- initial robot pose;
- pickup location;
- drop-off location;
- multiple obstacle coordinates.

The active controller drives the mobile base toward the pickup location.

It computes position and heading error.

It converts those errors into:

- linear velocity `v`;
- angular velocity `omega`.

It clips both controls to configured limits.

The loop stops when the robot is sufficiently close to the goal or after a timeout.

## Project Scope

The implemented scope is a small goal-reaching control loop for a unicycle-style mobile base inside an external simulator.

It does not include the simulator implementation, formal CLF optimization, obstacle avoidance, manipulation logic, path planning, or physical-robot control.

## Simulation Setup

`MobileManipulatorUnicycleSim` is instantiated with:

- `robot_id`;
- no backend server IP;
- robot pose;
- pickup location;
- drop-off location;
- obstacle locations.

The script reads robot state through `get_poses`.

It commands the base through `set_mobile_base_speed_and_gripper_power`.

Gripper power remains zero during the visible controller.

The script is therefore focused on base motion rather than manipulation.

## Goal Selection

The target pose is set from `robot.pickup_location`.

The controller extracts:

- `x_goal`;
- `y_goal`;
- `theta_goal`.

In the visible loop, `theta_goal` is not directly used as the final orientation target.

Instead, heading target is recalculated toward the current goal position.

This means the controller's effective objective is reaching the pickup position.

It is not enforcing the pickup location's stored final orientation.

## Error Model

Each iteration computes:

```text
e_pos = [x_goal - x, y_goal - y]
```

The Euclidean position error becomes `distance_error`.

A desired heading is computed using `atan2`.

Heading error is:

```text
theta_target - theta
```

It is normalized using sine/cosine through `atan2`.

This prevents discontinuities from raw angle wraparound.

## Control Law

The visible controller uses proportional relationships:

```text
v = k_v * distance_error
omega = k_omega * theta_error
```

This is a simple feedback controller.

It is CLF-inspired in repository naming/comments.

It is not a solved quadratic program.

There is no QP dependency.

There is no inequality constraint solved from a Lyapunov derivative.

This evidence boundary is important.

## Velocity Limits

Linear velocity is clipped to:

```text
[-v_max, v_max]
```

Angular velocity is clipped similarly.

That ensures the controller command stays within explicit configured bounds.

The bounds are software limits in the experiment.

They are not evidence of hardware limits.

## Termination Logic

The main loop continues while planar position error exceeds a threshold.

The threshold is 0.05 in the source coordinate units.

A second guard stops the experiment after 60 seconds.

On either completion path, the robot receives a zero-motion command.

The final pose is printed.

This gives the experiment a deterministic cleanup path.

## Obstacle Data Boundary

Obstacle coordinates are passed into the simulator.

However, the visible controller does not query obstacle distances.

It does not calculate collision constraints.

It does not alter commands based on obstacles.

The presence of obstacle coordinates therefore does not prove obstacle avoidance in this controller.

Any collision handling inside the external simulator is outside repository evidence.

Do not tag this repository as obstacle-avoidance implementation.

## CLF Evidence Boundary

The source defines:

```text
P = diag([1.0, 1.0, 0.5])
```

and comments label it a positive-definite CLF matrix.

But `P` is unused afterward.

A formal quadratic Lyapunov candidate such as `eᵀPe` is not evaluated in the checked-in code.

No `Vdot` is computed.

No stability inequality is enforced.

The safest retrieval description is:

**CLF-labeled / CLF-inspired proportional unicycle control experiment.**

It should not be represented as proof of formal Control Lyapunov Function synthesis.

## Architecture / System Shape

```text
mobile_manipulator_unicycle_sim
          |
          v
      robot pose
          |
          v
position + heading error
          |
          v
 proportional control
   v = kv * distance
   w = kw * heading_error
          |
          v
 velocity saturation
          |
          v
simulator command
          |
          +------> repeat until threshold/timeout
```

## Technical Stack

- Python
- NumPy
- simulation integration
- unicycle mobile-robot control
- feedback control
- angle normalization
- velocity saturation

## Major Engineering Work

### 1. Simulator Integration

The script configures and controls a mobile-manipulator simulation through a small API.

### 2. Goal-Directed Unicycle Control

Planar error is translated into linear and angular motion.

### 3. Heading Normalization

Angular difference is normalized robustly.

### 4. Command Saturation

Motion commands are clipped before being sent.

### 5. Safe Stop Path

The script sends zero velocity after termination.

### 6. Timeout Guard

A runtime limit prevents an endless loop when the goal is not reached.

## Testing & Verification Evidence

No automated tests exist.

No saved simulation output is checked in.

No trajectory plot is present.

No benchmark comparison is present.

No assertion confirms reaching the goal.

Runtime verification consists of:

- loop distance criterion;
- timeout message;
- final pose print.

The code appears designed for direct simulator execution.

Execution success is not stored in the repository.

## Engineering Discipline

Positive evidence:

- explicit tunable gains;
- explicit command limits;
- angle normalization;
- convergence threshold;
- timeout;
- final stop command;
- clear state/control loop.

Constraints:

- single script;
- external simulator missing from repo;
- no requirements file;
- no tests;
- no CI;
- unused `P` matrix;
- unused `theta_goal`;
- no obstacle-aware feedback despite obstacle coordinates;
- fixed time sleep rather than measured loop period;
- no logged trajectory.

## Product Engineering

This is not a product.

It is a control experiment.

No UI, API, deployment, or end-user workflow is present.

The code is useful as a small robotics-controller test artifact.

## Scale and Complexity

The codebase is tiny.

The algorithm is intentionally simple.

Its portfolio value lies in control-loop reasoning and evidence discipline rather than complexity.

It demonstrates that even a short script contains important distinctions:

- simulation environment vs controller;
- obstacle configuration vs avoidance;
- CLF naming vs formal CLF implementation;
- goal position vs goal orientation.

## Skills Demonstrated

Evidence supports:

- Python;
- NumPy;
- robotics simulation integration;
- unicycle kinematics/control;
- feedback control;
- position-error calculation;
- heading control;
- angle wrapping;
- velocity saturation;
- convergence threshold;
- runtime timeout handling.

## What Was Learned / Capability Developed

This repository shows a direct controller loop rather than relying on a full robotics navigation framework.

The developer computes the state error and the command explicitly.

It also highlights an important engineering lesson:

naming a control approach is not the same as implementing its mathematical conditions.

The unused CLF matrix makes that distinction visible.

## Portfolio Evolution Context

The corpus already contains richer robotics work.

This repo is not more complex than those earlier projects.

Its role is narrower.

It captures a focused control-law experiment around a mobile base.

Chronologically it appears after the inverse-kinematics assignment, giving this period both manipulator and mobile-base control work.

## Historical Significance

Within the processed corpus, this is an early explicit unicycle feedback-control script tied to a mobile-manipulator simulator.

It also provides a useful evidence case for distinguishing intended control theory from implemented mathematics.

## Limitations and Missing Evidence

No evidence supports:

- formal CLF stability proof;
- CLF-QP;
- CBF;
- obstacle avoidance;
- trajectory optimization;
- physical robot execution;
- sensor feedback;
- ROS;
- path planning;
- gripper operation;
- multi-robot coordination.

## Overall Narrative

Robotics-Project is a concise mobile-robot control experiment.

It drives a simulated unicycle-style base toward a pickup point using proportional distance and heading feedback.

Its strongest corpus value comes from precise interpretation: the code is CLF-labeled, but the checked-in implementation is a simple saturated feedback law rather than a formal CLF optimization controller.

# Project Tags

- `individual-project`
- `python`
- `numpy`
- `robotics`
- `mobile-robot`
- `mobile-manipulator`
- `unicycle-model`
- `feedback-control`
- `proportional-control`
- `position-control`
- `heading-control`
- `angle-normalization`
- `velocity-saturation`
- `simulation-integration`
- `goal-reaching`
- `timeout-guard`
- `clf-inspired`
- `not-formal-clf-qp`
- `known-external-simulator-dependency`
- `earliest-observed-unicycle-feedback-control`
