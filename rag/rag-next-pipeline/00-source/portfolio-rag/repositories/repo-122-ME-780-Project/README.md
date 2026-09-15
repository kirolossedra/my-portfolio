# ME-780-Project

## Repository Identity

- Repository: 122 / 138
- Name: `ME-780-Project`
- Start Date: 2025-05-20
- Latest Meaningful Update: 2025-05-25
- Latest Meaningful Commit: `e8ce6ead6e398cd60dc476b6e356ab328beb4899`
- Primary Language: Python
- Primary Type: Mobile-robot control and safety simulation experiment
- Technical Fields: nonlinear control, robot navigation, obstacle avoidance, constrained optimization
- Collaboration Type: `individual-project`
- Processing Context: chronology backfill from the connected private-repository set

## What This Project Is

`ME-780-Project` is a focused control-engineering repository that explores how a simulated mobile manipulator can move between task locations while progressively incorporating stability, obstacle safety, constrained optimization, and explicit escape behavior.

The repository preserves several control variants:

```text
CLF.py
    |
    | goal-seeking controller
    v
CBF.py
    |
    | CLF + CBF + QP obstacle constraints
    v
CLF-CBF-No QP - Inefficient
    |
    | alternative combined safety logic
    v
CLF-CBF-QPwithLinearBackup
    |
    | QP normal motion + explicit linear escape backup
    v
safety-constrained pickup/drop-off navigation
```

The project's value is not merely that control-theory terms appear in filenames.

The inspected source contains concrete mathematical control laws, barrier constraints, QP construction, geometric path checks, fallback logic, and a pickup/drop-off mission executed against a mobile-manipulator unicycle simulator.

## Authorship and External Simulation Boundary

The repository's controller source imports:

```python
MobileManipulatorUnicycleSim
```

from `mobile_manipulator_unicycle_sim`.

That simulator implementation is not part of the inspected repository tree.

The corpus therefore attributes the controller and experiment logic present here to this repository while treating the simulator as an external execution dependency.

This boundary matters because the repository demonstrates control-policy engineering against a simulator API, rather than evidence of authoring the simulator itself.

## Repository Structure

The source tree is compact:

```text
ME-780-Project/
├── CBF.py
├── CLF.py
├── CLF-CBF-No QP - Inefficient
├── CLF-CBF-QPwithLinearBackup
└── README.md
```

Despite the small file count, the control files contain substantial experiment logic.

The commit history also preserves a clear evolution from an initial simulation file toward progressively richer combined CLF/CBF strategies.

## Simulation Interface

The controllers deliberately operate through a narrow simulator surface.

The source repeatedly uses:

```text
get_poses()
set_mobile_base_speed_and_gripper_power()
```

The control code therefore computes action externally and sends:

- linear base speed;
- angular base speed;
- gripper power.

This creates a useful separation:

```text
simulator state
     |
     v
controller calculations
     |
     v
(v, w, gripper power)
     |
     v
simulator actuation
```

## Control Lyapunov Function Goal Seeking

`CLF.py` implements the simplest repository variant.

### Pose and goal geometry

The controller reads:

```text
x, y, theta
```

from the robot base pose.

For goal position `(gx, gy)`, it computes:

- `dx`;
- `dy`;
- Euclidean distance `rho`;
- goal bearing;
- heading error `alpha`.

The heading error is normalized through a `wrap` helper into the conventional angular interval.

### Linear control command

The desired forward velocity is:

```text
v = k_rho * rho * cos(alpha)
```

This scales translation with goal distance while suppressing forward motion when the robot is badly misaligned with the goal.

### Angular control command

The rotational command is:

```text
w = k_alpha * alpha
```

which drives heading error toward zero.

### Control saturation

Both commands are clipped to configured bounds:

```text
v_max = 0.08
w_max = 6.0
```

This gives the control law explicit actuator-like limits.

## CLF Pickup and Drop-Off Mission

The `CLF.py` main routine creates a mission containing:

- initial robot pose;
- pickup location;
- drop-off location;
- obstacle locations;
- robot geometry parameters.

The pure CLF variant drives toward pickup until a configured stop distance is reached.

It then actuates the gripper positively for approximately one second.

After that it drives toward drop-off and actuates the gripper negatively to release.

This makes the control law part of a complete simulated manipulation sequence:

```text
navigate -> grip -> navigate -> release
```

rather than only an isolated formula.

## Control Barrier Function Integration

`CBF.py` extends the goal-seeking behavior with obstacle constraints.

### Obstacle state

Obstacle locations are obtained from the simulator state.

The controller repeatedly evaluates distance from the robot to each obstacle.

### Barrier value

For an obstacle distance `d` and safety radius `r`, the source forms a squared-distance barrier of the form:

```text
h(x) = d^2 - r^2
```

Positive values correspond to state outside the safety boundary.

### Adaptive safety handling

The controller adjusts effective safety behavior when:

- an obstacle lies near the goal;
- the robot is near the goal;
- the robot approaches the configured safety radius.

This is evidence that the barrier implementation is shaped around the geometric task rather than simply applying one fixed threshold everywhere.

## CLF-CBF Quadratic Program

The main combined controller uses CVXOPT to solve a quadratic program.

### Desired control as optimization reference

The CLF produces nominal commands:

```text
v_des
w_des
```

The QP is then structured to remain near these desired commands while respecting safety constraints.

### Decision variables

The `CBF.py` QP includes:

- linear velocity `v`;
- angular velocity `w`;
- slack variable.

The later `CLF-CBF-QPwithLinearBackup` variant also constructs a decision vector around `v`, `w`, and optionally slack.

### Objective

The optimization penalizes deviation from desired CLF behavior and weights slack.

In the linear-backup variant, the documented objective is effectively:

```text
minimize || [v, w] - [v*, w*] ||^2
         + slack_weight * slack^2
```

This captures the central architecture:

```text
CLF -> preferred motion
CBF -> admissible safe region
QP  -> closest safe motion
```

## Velocity Constraints

The QP explicitly adds bounds for:

- `v <= v_max`;
- `v >= -v_max`;
- `w <= w_max`;
- `w >= -w_max`.

The solver therefore cannot choose arbitrary unbounded control values merely to satisfy obstacle constraints.

## Soft Safety Constraints

`CBF.py` includes a weighted slack variable.

When the QP returns meaningful positive slack, the source logs a constraint-violation warning.

It can then reduce linear velocity based on obstacle proximity.

This shows awareness that a constrained control problem may become difficult or infeasible and that solver output needs interpretation beyond simply reading the first two decision variables.

## QP Failure Fallback

The `CBF.py` controller catches solver exceptions.

Its fallback behavior does not merely stop execution.

When the nearest obstacle is close, it computes:

- direction away from the obstacle;
- direction toward the goal;
- proximity-dependent weighting;
- a blended target direction;
- angular correction;
- reduced linear velocity.

In some close-obstacle conditions it can command a small reverse velocity.

This is positive evidence of defensive control behavior around numerical optimization failure.

## Geometric Waypoint Logic

`CBF.py` also performs an up-front check for obstacles lying in the direct path toward a target.

It projects obstacle position onto the goal direction and checks perpendicular distance.

When a blocking obstacle is identified, the code can create an offset waypoint beside the obstacle.

The waypoint is clipped to the simulator environment boundary.

The resulting path becomes:

```text
current pose
    |
    v
temporary obstacle-offset waypoint
    |
    v
original target
```

This supplements the continuous CBF controller with a simple geometric path-planning heuristic.

## Stuck Detection

The navigation loop keeps track of recent pose changes.

It evaluates whether the robot is making translational or angular progress.

A `stuck_counter` and last-progress timestamp are used to detect prolonged lack of movement.

This demonstrates that controller execution is monitored for behavioral failure, not only mathematical solver success.

## Linear Evasion Backup

The final `CLF-CBF-QPwithLinearBackup` variant introduces a more explicit emergency strategy.

Normal motion uses the QP-integrated CLF-CBF controller.

When the robot enters a defined danger zone, normal goal pursuit is interrupted and a separate safety escape is selected.

## Danger-Zone Detection

The final variant checks obstacle distance against both:

- robot base position;
- gripper position.

This broadens collision reasoning beyond a point robot centered only at `(x, y)`.

The gripper position is estimated using a front offset from the robot heading.

## Rotation-Arc Safety

Before committing to a candidate escape heading, `rotation_arc_is_safe` samples the gripper path through the rotation.

For each intermediate orientation it computes the projected gripper position and rejects the rotation if that swept path approaches an obstacle more closely than the safe margin.

This is a materially different safety check from evaluating only the robot's start and end headings.

## Linear Escape-Path Safety

`obstacle_in_path` samples multiple points along a candidate linear escape segment.

Each sample is compared with all obstacles.

A candidate is marked blocked when the sampled trajectory violates the path tolerance.

The emergency planner therefore checks both:

```text
rotation to candidate heading
+
forward motion along candidate heading
```

## Candidate Escape Search

`linear_evasion_direction` scans candidate heading offsets across a configurable field of view.

The inspected final variant defaults to a full `2*pi` scan with 91 angular candidates.

For each candidate it evaluates:

- rotation-arc safety;
- forward-path clearance;
- distance from the candidate endpoint to the target;
- obstacle-proximity cost.

Only candidates passing both safety checks are eligible for selection.

## Obstacle Cost

The final variant computes an inverse-distance obstacle cost at the candidate endpoint.

Nearby obstacles contribute more cost than distant obstacles.

The candidate objective combines:

```text
distance-to-target cost
+
lambda * obstacle cost
```

This prevents escape selection from considering only immediate collision freedom while ignoring the relative quality of the resulting state.

## Escape Execution

Once a safe candidate angle is selected, `escape_to_safety`:

1. rotates toward the selected heading;
2. continually rechecks rotation safety;
3. stops rotation when the heading error is small;
4. drives forward along the escape heading;
5. repeatedly rechecks the forward path;
6. halts if an unexpected obstacle invalidates the route.

The safety plan is therefore revalidated during execution rather than trusted blindly after one initial check.

## Fail-Closed Emergency Behavior

If no safe escape direction is found, the code sends zero base and gripper command and returns failure.

If a newly observed obstacle invalidates the chosen rotation or linear path, the controller similarly halts.

This is concrete fail-closed behavior in the simulated safety-control workflow.

## QP and Backup Separation

The final controller uses two modes with different purposes:

### Normal region

Use CLF-CBF QP to progress toward the target while satisfying barrier constraints.

### Danger region

Suspend ordinary progress optimization and execute a geometric escape routine.

This hybrid strategy is one of the repository's most distinctive engineering decisions.

It recognizes that a controller optimized for normal progress can benefit from a separately understandable recovery mode near unsafe geometry.

## Gripper-Aware Goal Checking

The final navigation routine calculates gripper position from base pose and front offset.

Goal distance is measured from the gripper to the target.

This aligns navigation termination with the manipulation endpoint rather than only the base center.

## Numerical Optimization Stack

### NumPy

NumPy supports:

- vector/matrix construction;
- angle-scan generation;
- distance calculations;
- QP matrix preparation.

### CVXOPT

CVXOPT provides the quadratic-programming solver.

The code converts objective and constraint arrays into CVXOPT matrices and invokes:

```python
solvers.qp(...)
```

Solver progress output is disabled to keep the experiment log focused on application diagnostics.

## Control-System Diagnostics

The source contains extensive runtime logging.

The final variant reports:

- candidate escape angles;
- blocked rotation arcs;
- blocked paths;
- target cost;
- obstacle cost;
- combined cost;
- selected escape angle;
- QP desired versus optimized controls;
- slack.

These diagnostics make the controller's decision process inspectable during simulation.

## Evolution of the Control Strategy

The commit history provides a useful conceptual progression.

### Stage 1: simulation / CBF experiment

The initial simulation source was created and then renamed to `CBF.py`.

### Stage 2: explicit CLF baseline

`CLF.py` was added as a pure goal-seeking baseline.

This isolates what the navigation behavior looks like without obstacle handling.

### Stage 3: revised safety controller

`CBF.py` was updated with soft constrained optimization, geometric waypoint logic, fallback behavior, and progress monitoring.

### Stage 4: combined CLF-CBF without QP

The repository preserved an explicitly named alternative:

```text
CLF-CBF-No QP - Inefficient
```

This records experimentation with a non-QP integration path.

### Stage 5: QP plus linear backup

The final commit adds `CLF-CBF-QPwithLinearBackup`.

The architecture combines optimization-driven normal motion with explicit sampled geometric escape behavior.

The repository therefore documents reasoning through multiple controller organizations rather than presenting one unexplained final algorithm.

## Engineering Practices Evidenced

### Baseline before complexity

A pure CLF implementation is retained separately from obstacle-aware variants.

That allows behavior to be reasoned about incrementally.

### Safety constraints as first-class behavior

Obstacle handling appears in the controller mathematics, geometric checks, fallback path, and emergency mode.

### Defensive solver handling

The code anticipates QP solver failure and has explicit alternate control behavior.

### Runtime decision diagnostics

The final controller exposes intermediate costs and safety decisions in logs.

### Parameterized control behavior

Important values such as gains, safety radius, margins, velocity bounds, scan count, slack weight, and sample counts are parameters rather than hidden constants throughout the implementation.

### Geometric reasoning

The repository uses:

- vector projection;
- perpendicular distance;
- inverse-distance cost;
- path samples;
- rotation samples;
- heading normalization.

## Skills Demonstrated

### Control theory

Concrete concepts include:

- control Lyapunov functions;
- control barrier functions;
- goal convergence;
- barrier safety;
- constrained control.

### Optimization

The repository builds and solves quadratic programs with:

- quadratic objective matrix;
- linear objective vector;
- inequality matrix;
- inequality bounds;
- slack penalty.

### Robotics

The controllers reason about:

- unicycle-like base motion;
- pickup/drop-off navigation;
- gripper geometry;
- obstacles;
- robot pose;
- target position.

### Safety-oriented algorithm design

The project implements:

- danger-zone detection;
- obstacle constraints;
- safety margins;
- fail-closed halting;
- sampled path checking;
- sampled swept-arc checking;
- emergency escape search.

### Python numerical programming

Python is used with NumPy and CVXOPT to express both geometric and optimization logic.

### Simulation experimentation

Several control variants are preserved and exercised against the same simulator-style interface.

## Portfolio Significance

`ME-780-Project` is strong evidence of control-oriented robotics reasoning in the portfolio.

Its code moves beyond invoking an existing path planner.

The repository explicitly constructs goal-seeking laws, safety constraints, numerical optimization, geometric escape criteria, and fallback behavior.

It also shows a useful engineering progression: begin with a simple controller, isolate safety behavior, experiment with alternative integration strategies, and then add a recovery mode where the nominal optimizer is least trustworthy.

# Project Tags

- `python`
- `numpy`
- `cvxopt`
- `robotics`
- `mobile-robot-control`
- `unicycle-control`
- `control-lyapunov-function`
- `control-barrier-function`
- `quadratic-programming`
- `clf-cbf-qp`
- `constrained-optimization`
- `obstacle-avoidance`
- `safety-constrained-control`
- `soft-constraints`
- `slack-variable`
- `solver-fallback`
- `geometric-waypoint`
- `stuck-detection`
- `line-of-sight-evasion`
- `rotation-arc-safety`
- `sampled-path-checking`
- `gripper-aware-navigation`
- `pickup-dropoff-simulation`
- `robot-simulation`
