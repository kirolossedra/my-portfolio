# Repository 040 — ROS

## Repository Identity

- **Repository:** `kirolossedra/ROS`
- **Repository start date:** 2024-08-19
- **Last meaningful update date:** 2024-08-22
- **Primary implementation language:** Python
- **Framework:** ROS 2 / `rclpy`
- **Workspace type:** ROS 2 learning and experimentation workspace
- **Build/package tooling:** ROS workspace artifacts, Python package metadata, CMake interface package
- **Collaboration classification:** individual learning repository

## What This Project Is

`ROS` is a working ROS 2 learning repository combining executable nodes with a command and error notebook.

It contains ROS command cheat sheets, a maintained error log, publishers, subscribers, parameters, services, service clients, custom messages, custom service definitions, package metadata, and generated workspace build output.

The repository therefore contains concrete middleware implementation rather than notes alone.

## Workspace Structure

`Robotics/src` contains multiple packages, including:

- `custom_interfaces`,
- `kiro_custom_interfaces`,
- `last`,
- `realpkg`.

The repository also preserves `Robotics/build`, providing evidence that the workspace was passed through the ROS build toolchain.

## ROS 2 Python Runtime

Executable examples import `rclpy` and derive classes from `rclpy.node.Node`.

They use `rclpy.init`, node construction, `rclpy.spin`, and `rclpy.shutdown`.

This is direct ROS 2 Python node development.

## Publisher/Subscriber Communication

### Publisher

`testpublisher.py` creates a publisher on `Greeting_topic`.

It declares two parameters, reads them, creates a `String` publisher, schedules periodic publication with a timer, and publishes generated greeting content.

### Subscriber

`testsubscriber.py` subscribes to `Greeting_topic`.

Its callback logs received message content.

Together the files establish a complete ROS publish/subscribe path.

## ROS Parameters

The publisher declares:

- `Str_to_publish`,
- `freq_setting`.

It retrieves parameter values from the node.

That is concrete runtime configuration rather than constants only.

## Custom Sensor Message

The repository defines:

`custom_interfaces/msg/SensorState.msg`

with fields:

- `string sensor_name`,
- `bool new_readings_ready`,
- `int64 reading_id`.

`SensorPublisher.py` imports the generated type, creates a publisher on `Sensor_Readings`, fills the custom fields, and publishes every 0.5 seconds.

The example identifies the sensor as `"Radar"`.

This demonstrates the full custom-message flow from interface schema to generated Python type to topic publication.

## Custom Service

The repository defines:

`CalculateTriangleArea.srv`

with request values `a`, `b`, and `c`, plus an `area` response.

`TriangleService.py` creates a ROS service named `Triangle_Area`.

Its callback calculates semiperimeter and applies Heron's formula before writing the result to the response.

The repository therefore implements a custom request/response contract rather than only built-in message types.

## ROS Communication Models

The repository exercises both major communication patterns:

- asynchronous topic publish/subscribe,
- service request/response.

Commit history also contains explicit service- and interface-focused development steps.

## Interface Package

`custom_interfaces` includes:

- `CMakeLists.txt`,
- `package.xml`,
- `msg/`,
- `srv/`.

Its visible custom definitions include `ColorState.msg`, `SensorState.msg`, and `CalculateTriangleArea.srv`.

This is a dedicated ROS interface package.

## Build Evidence

The committed build tree contains generated output for `custom_interfaces`, including CMake cache/compiler metadata and ROS interface type-support exports.

That demonstrates actual interface generation through the ROS toolchain.

## Operational Documentation

`Command Cheat Sheet` contains material for nodes, topics, packages, visualization, and errors.

The repository therefore keeps both executable examples and operational commands needed to inspect and manage them.

## Error Log

A dedicated `Error Log.md` is maintained through several commits.

That is useful engineering evidence because development failures are retained as reusable operational knowledge rather than discarded after a successful run.

## Visualization Context

`Visual Ros.md` received repeated updates through the repository's final meaningful commit on 2024-08-22.

The adjacent Linux repository explicitly records `rviz2` and software-rendering troubleshooting, tying this period to hands-on ROS visualization work.

## Engineering Skills Demonstrated

### ROS 2 Node Development

Python node classes participate in ROS initialization, spinning, callbacks, and shutdown.

### Publish/Subscribe Messaging

The repository contains both producer and consumer implementations.

### Service Development

A custom service schema and server implement request/response middleware communication.

### Custom Interface Definition

`.msg` and `.srv` definitions create user-defined ROS types.

### Parameters

Node behavior reads ROS parameters.

### Timers and Callbacks

Periodic publication and callback-driven execution demonstrate event-oriented middleware programming.

### Workspace Packaging

Python package setup, ROS package manifests, interface CMake files, and generated build outputs show package-level workflow.

### Debugging

Command notes and an error log capture operational learning alongside code.

## Capability Developed

This repository demonstrates a transition from using ROS as integration infrastructure to creating ROS 2 middleware primitives directly.

The developer creates nodes, topics, publishers, subscribers, services, custom messages, custom service definitions, parameters, timers, and workspace packages.

## Portfolio Evolution

ROS appeared earlier in the collaborative autonomous-driving work as existing integration infrastructure.

This is the first processed repository dedicated specifically to implementing and learning ROS 2 primitives.

The chronological progression is coherent:

**sensors → perception → estimation → Linux robotics environment → ROS middleware development**

## Overall Project Narrative

`ROS` is a compact but real ROS 2 workspace.

It progresses from command experiments into Python nodes, publisher/subscriber communication, parameters, services, and custom interfaces.

A radar-oriented `SensorState` message and triangle-area service provide concrete custom data contracts. Build outputs show interface generation, while command sheets and error logs preserve the troubleshooting knowledge developed alongside the code.

# Project Tags

## Project Type
- `robotics-learning-workspace`
- `middleware-exercises`
- `educational-project`
- `individual-project`

## Languages
- `python`

## Robotics and Autonomous Systems
- `ros`
- `ros2`
- `rclpy`
- `ros-node`
- `ros-topics`
- `publish-subscribe`
- `topic-publication`
- `topic-subscription`
- `ros-services`
- `custom-ros-message`
- `custom-ros-service`
- `ros-parameters`
- `ros-timers`
- `ros-callbacks`
- `sensor-message`

## Build and Tooling
- `ros-workspace`
- `ament`
- `colcon`
- `rosidl`
- `cmake`
- `build-artifact-evidence`

## Software Engineering Practices
- `event-driven-programming`
- `interface-definition`
- `troubleshooting-notes`
- `error-log`
- `package-structure`

## Portfolio Significance
- `earliest-observed-ros2`
- `earliest-observed-rclpy`
- `earliest-observed-custom-ros-message`
- `earliest-observed-custom-ros-service`
- `earliest-observed-ros-parameters`
