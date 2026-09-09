# RADAR-Experiement-SENSOR-FUSION-TEAM

## Repository Identity

- Repository: 019 / 134
- Name: `RADAR-Experiement-SENSOR-FUSION-TEAM`
- Repository start date: 2023-02-18
- Latest meaningful update date: 2023-02-28
- Primary type: Autonomous-driving sensor simulation repository
- Technical field: Radar simulation, ROS integration, and sensor fusion
- Application domain: Autonomous / self-driving vehicle sensing
- Project context: Sensor Fusion Team work within an autonomous vehicle project
- Collaboration type: `group-project`
- Primary environment: MATLAB / Simulink / PreScan

## Collaboration and Authorship Context

The repository explicitly identifies itself as the work of a **Sensor Fusion Team** and describes the radar experiment as a component intended to integrate with other teams in an autonomous self-driving aided vehicle project.

The visible GitHub commits are owner-attributed, including the final README update, so the repository owner clearly maintained and documented this repository.

The system-level project context is collaborative; the corpus therefore separates the repository's technical capability from any unsupported claim that one person authored the complete autonomous-vehicle stack or all generated simulation assets.

## Evidence Basis

The repository contains a substantial PreScan/Simulink simulation artifact set, including:

- `radar_final_cs.slx` and related Simulink versions/autosaves;
- `radar_final.pb`;
- `radar_final.pex`;
- `radar_final.references`;
- `radar_final.tunable`;
- `RadarSensorConfig/RadarSensorAssignments.xml`;
- Aimsun integration configuration;
- Vissim integration configuration;
- V2X plugin configuration;
- viewer/camera plugin artifacts;
- 3D world/model assets;
- simulation cache/state files;
- repository documentation of ROS topic publication and subscription.

The README documents the radar-signal model and shows publication/subscription screenshots.

## What This Project Is

This repository captures a radar-sensor simulation experiment used by a sensor-fusion team inside a larger autonomous-vehicle project.

Its explicit goal is to simulate radar measurements in PreScan and expose radar outputs through ROS topics so that other components can publish, subscribe, and integrate the measurements into a broader vehicle-sensing workflow.

The repository therefore sits at the intersection of:

- simulated vehicle environments;
- radar sensing;
- MATLAB/Simulink modeling;
- ROS messaging;
- inter-team sensor-fusion integration.

It is not merely a static signal list: the committed experiment includes complete simulation/project artifacts and documentation of live topic publication and subscription behavior.

## System Shape

```text
PreScan / simulated world
          ↓
     Radar sensor
          ↓
   radar signal outputs
          ↓
 MATLAB / Simulink model
          ↓
       ROS node
          ↓
 topic-per-signal publication
          ↓
 ROS subscribers / other teams
          ↓
 broader sensor-fusion workflow
```

The central integration idea is that simulated radar outputs become message-oriented interfaces rather than remaining isolated inside the simulator.

## Radar Signal Model

The README documents a set of radar outputs with physical meaning.

### Active Beam ID

`Active BeamID[-]` identifies the active beam in the current simulation time step and uses zero when no detection exists.

### Range

`Range[m]` reports the range at which the target object is detected.

### Doppler Velocity

`DopplerVelocity[ms-1]` expresses target velocity relative to the sensor along the radar beam.

### Cartesian Doppler Components

`DopplerVelocityXYZ[ms-1]` decomposes relative target velocity into X, Y, and Z components in the sensor coordinate system.

### Angular Measurements

The simulation documents:

- `Theta[deg]` for azimuth;
- `Phi[deg]` for elevation.

### Target Identity

`TargetID[-]` identifies the detected object type.

### Energy Loss

`EnergyLoss[dB]` represents the received/transmitted power ratio in decibels.

### Incidence Angles

The signal set also includes:

- `Alpha[deg]` for azimuthal incidence;
- `Beta[deg]` for elevation incidence.

This gives the integration layer a rich sensor observation rather than a single range measurement.

## ROS Integration

The README explicitly instructs starting a ROS node from MATLAB with:

```text
rosinit
```

The project then publishes radar signals as ROS topics.

The documentation states that each radar signal is shared in a topic associated with its signal name.

This provides a clean integration boundary between the simulation model and external consumers.

## Publication Workflow

The README includes screenshots under a `Publishing Signals` section.

These images are evidence that the model was exercised as a publisher rather than only designed as a diagram.

The topic-based interface allows downstream systems to consume individual radar measurements without direct access to the simulator's internal model state.

## Subscription Workflow

A separate `Subscriping Signals` section shows subscriber-side screenshots.

This documents the complementary read path and demonstrates that the experiment considered both sides of message exchange:

- publish simulated radar outputs;
- subscribe to those outputs from another ROS participant.

## MATLAB and Simulink

The repository includes multiple Simulink model variants and cached model state.

`radar_final_cs.slx` is the central committed Simulink artifact, with additional forms preserved for different versions and autosave/original states.

The presence of `.slxc`, `slprj`, `.mat`, and versioned `.slx` artifacts places the experiment in a real Simulink execution workflow rather than a text-only conceptual exercise.

## PreScan Simulation Artifacts

The repository contains PreScan-style experiment and world files, including:

- `.pb`;
- `.pepb`;
- `.pex`;
- `.references`;
- `.tunable`;
- `.ps3d`;
- `.osgb`.

These artifacts represent the simulated environment, configuration, references, and 3D world/model resources used by the experiment.

## Sensor Configuration

`RadarSensorConfig/RadarSensorAssignments.xml` provides explicit radar-sensor assignment configuration.

This is concrete evidence that radar behavior is configured as part of the simulation environment rather than merely described in prose.

## Simulation Ecosystem Integrations

The repository also stores configuration for:

- Aimsun;
- Vissim;
- V2X;
- remote/world viewers;
- physics-based camera tooling.

These files show that the experiment lives in a broader vehicle-simulation ecosystem with multiple optional federates/plugins and external simulation interfaces.

The corpus treats these as repository-level integration artifacts rather than claiming that every plugin was personally implemented from source.

## 3D Environment Assets

The `Models` hierarchy includes:

- road/asphalt textures;
- material data;
- a world model;
- image resources.

These assets support a physically rendered simulation scene used by the experiment.

## Engineering Practices

### Topic-Oriented Integration

Radar measurements are exposed as named ROS topics.

This turns simulator outputs into an interface that can be consumed by independently developed components.

### Signal-Level Interface Definition

The README documents the semantics and units of each radar field.

That is important in a multi-team integration context because downstream consumers need shared meaning, not only transport connectivity.

### Simulation Artifact Preservation

The repository preserves the model, world, sensor configuration, plugin configuration, and runtime artifacts together.

This creates a concrete snapshot of the simulation environment used for integration work.

### Cross-Team Boundary

The repository description explicitly says the radar experiment supports integration with other teams in the autonomous vehicle project.

The ROS topic layer acts as that cross-team technical boundary.

## Verification and Demonstration

### Published Topic Evidence

README screenshots document radar signals being published.

### Subscriber Evidence

Separate screenshots document signal subscription.

### Executable Simulation State

Committed Simulink/PreScan project files and sensor assignments provide an executable-model evidence layer beyond documentation alone.

## Scale and Complexity

### Repository Scale

This is a large artifact-heavy repository, with tens of megabytes of simulation assets rather than a small source-only exercise.

### Integration Scale

The repository spans:

- radar sensing;
- simulation world configuration;
- MATLAB/Simulink;
- ROS messaging;
- sensor assignments;
- plugin/federate configuration;
- cross-team autonomous-vehicle integration.

### Data-Model Complexity

A single radar detection exposes range, velocity, three-axis velocity decomposition, angular position, identity, power loss, and incidence-angle information.

### System Complexity

The technically important challenge is coordinating tools and interfaces across simulation and robotics ecosystems rather than implementing one isolated algorithm.

## Skills Demonstrated

### Simulation and Modeling

- **PreScan-style vehicle simulation workflow — strong repository evidence.**
- **MATLAB/Simulink model workflow — strong evidence.**
- **Radar sensor configuration — strong evidence.**
- **3D simulation environment assets — strong evidence.**

### Robotics and Messaging

- **ROS initialization from MATLAB — strong evidence.**
- **ROS topic publication — strong evidence.**
- **ROS topic subscription — strong evidence.**
- **Signal-oriented interface design — strong evidence.**

### Radar / Sensor Fusion

- **Radar range measurement integration — strong evidence.**
- **Doppler velocity signals — strong evidence.**
- **Azimuth/elevation signal handling — strong evidence.**
- **Target identity signals — strong evidence.**
- **Energy-loss signal handling — strong evidence.**
- **Sensor-fusion team integration context — strong evidence.**

### Systems Integration

- **Cross-tool integration — strong evidence.**
- **Cross-team interface thinking — strong evidence.**
- **Configuration-driven simulation — strong evidence.**

## Capability Developed

This repository introduces a very different form of engineering from the adjacent design-pattern and HDL exercises.

The core capability is **integration across engineering environments**.

A simulated physical sensor must expose measurements with clear units and semantics; MATLAB/Simulink must participate in ROS; topics must be published and consumed; the experiment must remain connected to a broader autonomous-driving simulation environment.

That requires thinking simultaneously about:

- physical signals;
- simulation configuration;
- software messaging;
- interoperability;
- team boundaries.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- autonomous-driving simulation;
- radar-sensor simulation;
- ROS;
- ROS topic publication;
- ROS topic subscription;
- MATLAB/Simulink integration;
- PreScan simulation artifacts;
- sensor-fusion team context;
- simulated Doppler/range radar outputs.

It marks a clear expansion from local software/hardware exercises into multi-tool cyber-physical simulation and team integration.

## Historical Significance

The project provides an early bridge between software engineering and intelligent-vehicle systems.

Its historical importance comes from making simulated sensing interoperable with a robotics messaging layer, allowing a radar subsystem to participate in a larger autonomous-vehicle architecture.

It also establishes an early portfolio precedent for work where the engineering result is not one executable source file, but a coordinated experiment spanning models, configuration, simulator assets, and inter-process interfaces.

## Overall Repository Narrative

`RADAR-Experiement-SENSOR-FUSION-TEAM` is a collaborative autonomous-vehicle simulation repository centered on moving radar measurements from PreScan/Simulink into ROS topics for sensor-fusion integration.

The repository preserves the radar signal definitions, Simulink models, sensor assignments, vehicle-simulation project files, world assets, plugin configuration, and screenshots of publishing and subscribing. The owner-attributed repository history establishes direct maintenance/documentation involvement, while the broader system is explicitly framed as team work.

Its strongest corpus evidence is cross-domain systems integration: simulated radar physics, MATLAB/Simulink, ROS message transport, and a team-oriented sensor-fusion boundary.

# Project Tags

## Project Type

- `autonomous-driving-simulation`
- `sensor-simulation-project`

## Collaboration and Authorship

- `group-project`

## Simulation and Modeling

- `matlab`
- `simulink`
- `prescan`
- `vehicle-simulation`
- `radar-simulation`
- `sensor-configuration`
- `3d-simulation-assets`

## Robotics and Networking

- `ros`
- `ros-node`
- `ros-topics`
- `publish-subscribe`
- `topic-publication`
- `topic-subscription`

## Sensors and Autonomous Systems

- `sensor-fusion`
- `autonomous-driving`
- `radar-range`
- `doppler-velocity`
- `azimuth-elevation`
- `target-identification`
- `energy-loss`

## Systems Engineering

- `hardware-system-integration`
- `signal-interface-definition`

## Portfolio Significance

- `earliest-observed-autonomous-driving`
- `earliest-observed-radar-simulation`
- `earliest-observed-ros`
- `earliest-observed-simulink`
- `earliest-observed-sensor-fusion`
