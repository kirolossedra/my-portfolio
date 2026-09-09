# Repository 043 — ROS-Nav2

## Repository Identity

- **Repository:** `kirolossedra/ROS-Nav2`
- **Repository start date:** 2024-08-28
- **Last meaningful update date:** 2024-08-28
- **Primary domain:** ROS 2 mobile-robot navigation learning
- **Key tools:** TurtleBot3, Gazebo, Cartographer, RViz, Nav2 map server
- **Collaboration classification:** individual learning repository
- **Repository shape:** command workflow, SLAM documentation, and saved occupancy-map artifacts

## What This Project Is

`ROS-Nav2` is a focused ROS 2 navigation/SLAM repository.

It does not contain a custom navigation planner implementation.

Instead it documents and preserves a working TurtleBot3 simulation-to-map workflow.

The repository includes commands for launching a TurtleBot3 Gazebo world, teleoperating it, running Cartographer, and saving the resulting map.

It also checks in generated occupancy-grid map files.

## Repository Structure

The repository contains:

- root `README.md`,
- `Command Cheat Sheet/README.md`,
- `SLAM/README.md`,
- `SLAM/maps/`,
- two `.pgm` occupancy-map image files,
- two corresponding `.yaml` metadata files.

This is a compact workflow/evidence repository rather than a source-code package.

## TurtleBot3 Simulation Workflow

The command sheet includes:

`ros2 launch turtlebot3_gazebo turtlebot3_world.launch.py`.

That launches the simulated TurtleBot3 world.

The workflow also includes:

`ros2 run turtlebot3_teleop teleop_keyboard`.

This allows manual robot motion during exploration.

## SLAM Workflow

The repository runs Cartographer using:

`ros2 launch turtlebot3_cartographer cartographer.launch.py`.

This establishes a LiDAR-based SLAM workflow using the standard TurtleBot3 stack.

The generated map is then saved with:

`ros2 run nav2_map_server map_saver_cli -f maps/my_map`.

This is concrete interaction with the Nav2 map server.

## Saved Mapping Artifacts

The repository checks in:

- `map_1724872442.pgm`,
- `map_1724872442.yaml`,
- `my_map.pgm`,
- `my_map.yaml`.

The `.pgm` files are occupancy-grid images.

The `.yaml` files provide the map metadata required by ROS map consumers.

These files are direct output evidence from the mapping workflow.

## Visual Documentation

`SLAM/README.md` documents two generated maps.

The descriptions identify:

- an RViz-generated map using LiDAR scanning in Turtle World,
- an RViz-generated map using LiDAR scanning in Turtle House.

Screenshots are linked in the repository documentation.

This provides visual validation that mapping was exercised in multiple simulated environments.

## Nav2 Scope

Despite the repository name, the strongest checked-in evidence is mapping and map persistence.

The repository does not visibly contain:

- custom Nav2 behavior trees,
- planner configuration,
- controller tuning,
- costmap parameter files,
- localization launch files,
- autonomous goal-navigation code.

The corpus therefore classifies it as Nav2/SLAM workflow practice rather than a custom Nav2 stack implementation.

## ROS Middleware Configuration

The command sheet also installs:

`ros-humble-rmw-cyclonedds-cpp`.

This records experimentation with Cyclone DDS as the ROS middleware implementation.

Dependency installation alone is not treated as proof of custom DDS engineering.

It is retained as environment/configuration evidence.

## Verification Evidence

The strongest verification evidence is artifact-based.

The repository contains actual generated maps and screenshot documentation.

That is stronger than a prose-only tutorial record because it demonstrates an exercised workflow.

There is no automated unit/integration test suite.

## Engineering Work Evidenced

The repository positively demonstrates:

- ROS 2 environment operation,
- TurtleBot3 simulation,
- keyboard teleoperation,
- Cartographer SLAM execution,
- LiDAR mapping workflow,
- RViz map inspection,
- Nav2 map-server usage,
- occupancy-map persistence,
- ROS map metadata handling,
- middleware-package setup.

## Skills Demonstrated

### Robotics

- SLAM
- occupancy grids
- LiDAR mapping
- robot teleoperation
- map persistence

### ROS 2

- `ros2 launch`
- `ros2 run`
- TurtleBot3 packages
- Cartographer
- Nav2 map server
- ROS middleware configuration

### Simulation and Visualization

- Gazebo
- RViz
- simulated-world exploration

## Capability Developed

This repository develops operational familiarity with the data path required to turn robot motion and LiDAR scans into a reusable map.

The workflow spans:

1. launching the robot/world,
2. controlling the robot,
3. running SLAM,
4. observing results,
5. serializing map artifacts.

That is an important navigation prerequisite even though autonomous path planning itself is not implemented here.

## Portfolio Evolution

This repository follows `RVIZ-GAZEBO-URDF`.

Together the sequence forms a coherent robotics progression:

- `ROS`: middleware primitives,
- `Turtle-Hunter`: task-specific robot behavior,
- `RVIZ-GAZEBO-URDF`: robot description and simulation integration,
- `ROS-Nav2`: environment mapping and navigation-stack tooling.

## Historical Significance

Within the processed corpus, this is the earliest observed repository with saved ROS occupancy maps generated from a SLAM workflow.

It is also the earliest observed explicit use of Cartographer and Nav2 map saving.

## Limitations

No custom SLAM algorithm is implemented.

No custom Nav2 planner/controller is implemented.

The repository mainly preserves commands, maps, and screenshots.

No automated tests are present.

The root README is nearly empty; the substantive documentation lives in subdirectories.

## Overall Narrative

`ROS-Nav2` is an evidence-rich operational learning artifact.

Its importance is that the repository preserves outputs from a real ROS 2 mapping workflow rather than merely listing commands.

The saved occupancy maps make the learning outcome concrete: simulation, LiDAR scanning, Cartographer, RViz, and Nav2 map serialization were connected into one usable pipeline.

# Project Tags

- `educational-project`
- `individual-project`
- `ros`
- `ros2`
- `turtlebot3`
- `gazebo`
- `rviz`
- `slam`
- `cartographer`
- `lidar`
- `occupancy-grid`
- `map-generation`
- `map-persistence`
- `nav2`
- `nav2-map-server`
- `teleoperation`
- `cyclonedds`
- `robotics`
- `robotics-perception`
- `localization-foundations`
- `experimental-result-documentation`
- `manual-verification`
