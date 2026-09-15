# Repository 041 — Turtle-Hunter

## Repository Identity

- **Repository:** `kirolossedra/Turtle-Hunter`
- **Repository start date:** 2024-08-21
- **Last meaningful update date:** 2024-08-23
- **Primary implementation language:** Python
- **Framework:** ROS 2 / `rclpy`
- **Runtime environment:** `turtlesim`
- **Collaboration classification:** individual learning repository
- **Repository shape:** two executable ROS nodes plus concise architecture documentation

## What This Project Is

`Turtle-Hunter` is a small ROS 2 navigation exercise built around the standard `turtlesim` environment.

The repository separates the workflow into two executable responsibilities:

1. a turtle-control service that drives the primary turtle toward a requested target coordinate,
2. a random turtle spawner that periodically asks the `turtlesim` spawn service to create new turtles.

The repository README describes a broader two-stage idea in which generated turtle targets can be queued and passed to the navigator one by one.

The checked-in code positively establishes the navigator and random-spawn components.

The queue/removal orchestration described in the README is not visibly implemented in the two inspected Python files, so it is recorded as described intent rather than as completed behavior.

## Source Layout

The repository contains:

- `README.md`,
- `turtlefinder.py`,
- `turtlespawn.py`.

This is a deliberately small repository with essentially no generated workspace noise.

## Turtle Navigation Service

`turtlefinder.py` defines `TurtleControlService`, a class derived from `rclpy.node.Node`.

Its constructor creates three ROS interfaces:

- a service named `control_turtle`,
- a publisher to `/turtle1/cmd_vel`,
- a subscriber to `/turtle1/pose`.

This gives the node both observation and actuation channels.

## Pose Feedback

The node subscribes to `turtlesim.msg.Pose`.

Its pose callback stores the most recently received pose in `self.current_pose`.

The control service waits until a pose has been received before attempting navigation.

This provides current:

- x position,
- y position,
- heading angle.

The code therefore uses live middleware state instead of assuming a fixed starting position.

## Target Geometry

The service request supplies target `x` and `y` coordinates.

The navigator computes:

- `delta_x`,
- `delta_y`,
- desired heading with `math.atan2(delta_y, delta_x)`.

This is a concrete geometric transformation from Cartesian target displacement to heading.

The code then compares desired heading with the current turtle heading to choose clockwise or counter-clockwise angular motion.

## Angular Motion

A `geometry_msgs.msg.Twist` message is used for motion commands.

During orientation:

- linear velocity is set to zero,
- angular velocity is set to `+2.0`, `-2.0`, or `0.0`.

The command is published to `/turtle1/cmd_vel`.

The code estimates rotation duration using the absolute heading difference divided by angular speed.

This is open-loop timed rotation rather than continuous closed-loop heading correction.

## Linear Motion

After rotation, the node computes Euclidean target distance:

`sqrt((target_x-current_x)^2 + (target_y-current_y)^2)`.

It then commands a linear speed of `4.0`.

The code repeatedly republishes the motion command for an estimated duration of `distance / 4.0`.

Finally it publishes a zero-velocity command to stop.

This is open-loop distance traversal driven by current-pose initialization and speed/time estimation.

## Service Interface Reuse

The navigator uses `turtlesim.srv.Spawn` as the service type for `control_turtle`.

The request's `x` and `y` fields are reused as target coordinates.

The response's `name` field is repurposed to return a success string.

That is a pragmatic learning-stage reuse of an existing service definition rather than a custom semantic service contract.

## Random Turtle Spawner

`turtlespawn.py` defines `TurtleSpawner`, another `rclpy` node.

It creates a client for the standard `spawn` service.

At startup it waits until the service becomes available.

It then schedules a timer every second.

Each timer callback builds a `Spawn.Request`.

## Randomized Spawn Generation

The spawner randomizes:

- x coordinate from 0 to 11,
- y coordinate from 0 to 11,
- heading from 0 to approximately `2π`,
- turtle name using a random integer suffix.

The request is sent asynchronously with `call_async`.

This is concrete service-client behavior and timer-driven event generation.

## ROS 2 Communication Patterns

Across the two files the repository directly exercises:

- node construction,
- services,
- service clients,
- publishers,
- subscribers,
- timers,
- asynchronous service calls,
- middleware spin loops,
- typed ROS messages,
- typed ROS services.

This extends the immediately preceding `ROS` repository from isolated middleware examples into a small behavior-oriented robotics exercise.

## Control Characterization

The navigator should not be described as a full navigation stack.

It does not visibly implement:

- path planning,
- obstacle avoidance,
- feedback-controlled waypoint convergence,
- PID control,
- costmaps,
- localization,
- Nav2 integration.

Its control is intentionally direct and educational.

The architecture demonstrates coordinate reasoning and ROS command flow rather than production navigation.

## Verification Evidence

Verification is observable through runtime logging statements such as:

- received position,
- requested target,
- current position,
- calculated angle difference,
- command publication.

The repository does not contain an automated test suite.

It does not contain assertions or a formal acceptance harness.

The observable validation mechanism is running the ROS nodes with `turtlesim` and observing turtle motion and logs.

## Engineering Work Evidenced

The repository positively demonstrates work in:

- ROS 2 Python node development,
- service server construction,
- service-client construction,
- publish/subscribe integration,
- live pose feedback,
- geometry-based heading calculation,
- Euclidean distance calculation,
- velocity command generation,
- timer-based event generation,
- randomized simulation-object creation,
- asynchronous ROS service calls.

## Skills Demonstrated

### Robotics Middleware

- ROS 2
- `rclpy`
- `turtlesim`
- topics
- services
- timers
- callbacks

### Robotics Math

- Cartesian displacement
- `atan2` heading calculation
- Euclidean distance
- angular direction decisions
- speed/time motion estimation

### Python

- classes
- callbacks
- standard-library `math`
- standard-library `random`
- standard-library `time`

## Capability Developed

This repository develops the ability to turn middleware primitives into a small autonomous behavior.

The important transition is from "publish a message / call a service" exercises to composing:

- state observation,
- geometric reasoning,
- actuation,
- asynchronous environment manipulation.

## Portfolio Evolution

Historically, `Turtle-Hunter` follows the broader `ROS` practice repository by two days.

It is evidence that the learned ROS 2 primitives were immediately recombined into a task-specific behavior.

That makes it useful as a bridge between middleware syntax and later navigation/simulation repositories.

## Historical Significance

Within the processed corpus so far, this is the earliest observed repository centered on programmatic target seeking inside `turtlesim`.

It also provides an early compact example of a robot behavior being decomposed into separate navigation and environment-generation nodes.

## Limitations

The queue workflow described in the README is not visible in the inspected source files.

Navigation is time-based and open-loop after the initial pose read.

The code blocks inside a service callback during `time.sleep` and travel loops.

The service type is semantically reused rather than custom-designed.

No automated tests are checked in.

No package/workspace metadata is present in this repository itself.

## Overall Narrative

`Turtle-Hunter` is a concise ROS 2 behavior exercise that combines services, topic feedback, geometry, and motion commands.

Its value is not scale.

Its value is the composition step: live robot state is turned into a target heading and distance, commands are emitted, and a second node dynamically changes the simulation environment.

That composition makes it a clear progression from isolated ROS examples toward robotics behaviors.

# Project Tags

- `educational-project`
- `individual-project`
- `python`
- `ros`
- `ros2`
- `rclpy`
- `ros-node`
- `ros-services`
- `publish-subscribe`
- `topic-publication`
- `topic-subscription`
- `ros-timers`
- `ros-callbacks`
- `turtlesim`
- `robot-motion-control`
- `geometry-msgs`
- `twist-command`
- `pose-feedback`
- `atan2`
- `euclidean-distance`
- `open-loop-control`
- `randomized-simulation`
- `asynchronous-service-call`
- `manual-verification`
