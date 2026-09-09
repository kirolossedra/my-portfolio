# Repository 091 — RogersExperiment

## Repository Identity

- **Repository:** `kirolossedra/RogersExperiment`
- **Corpus index:** 091
- **Repository start date:** 2025-08-01
- **Last meaningful update date:** 2025-08-01
- **Latest meaningful commit:** `62c0b17ad7330334e825ba822753f44352b2c6a9`
- **Primary repository language:** C++
- **Project form:** ns-3 wireless-network simulation experiment
- **Collaboration classification:** `individual-project`
- **Substantive source:** `SingleApp.cc`

## Evidence Basis

The repository is intentionally small.

Its root README is effectively empty.

The analysis is therefore anchored to `SingleApp.cc` rather than inferred from the repository name.

The source is an ns-3 Wi-Fi simulation.

It does not connect to a Rogers cellular network or a live Rogers testbed in the retained snapshot.

The name `RogersExperiment` is therefore historical/project context, not proof of operator-network measurement.

The source explicitly configures Wi-Fi, mobility, UDP traffic, FlowMonitor, and CSV output.

Those are the supported capabilities for this corpus entry.

## What the Project Is

RogersExperiment is a focused simulation that studies how application throughput changes as a Wi-Fi station moves progressively farther from an access point.

The experiment repeatedly runs a simple AP/STA scenario.

For each run, it changes the station's distance from the AP.

The station follows waypoint mobility at a configured velocity.

UDP traffic is generated toward the AP.

FlowMonitor statistics are used to derive throughput.

The distance and throughput pair is written to a CSV file.

The result is a small measurement-generation experiment rather than a full network simulator framework.

## Project Scope

The implemented scope includes:

- ns-3 Wi-Fi node creation;
- one AP and one station;
- 802.11ac/VHT PHY/MAC configuration;
- fixed MCS selection;
- wide-channel configuration;
- waypoint mobility;
- increasing separation distance;
- UDP OnOff traffic;
- IPv4 addressing;
- FlowMonitor statistics;
- throughput computation;
- CSV export.

The repository does not establish cellular simulation, real-world modem interaction, or Rogers infrastructure access.

## Architecture / System Shape

The experiment has a simple repeated-run architecture:

```text
choose distance
     ↓
create ns-3 AP + STA
     ↓
configure 802.11ac/VHT PHY/MAC
     ↓
apply waypoint movement
     ↓
generate UDP traffic
     ↓
collect FlowMonitor statistics
     ↓
calculate throughput
     ↓
append distance/throughput sample
     ↓
write CSV
```

This shape makes the independent variable explicit: station distance.

The output variable is observed application throughput.

## Technical Stack

- C++
- ns-3
- Wi-Fi module
- mobility module
- internet stack
- applications module
- FlowMonitor
- IPv4
- UDP
- CSV output

## Wi-Fi Configuration

The source configures an 802.11ac/VHT-oriented Wi-Fi scenario.

A constant-rate Wi-Fi manager is used.

The configured data mode is `VhtMcs5`.

The control mode is `VhtMcs0`.

The source sets a 160 MHz channel width.

These are deliberate PHY/MAC assumptions in the simulation.

They should not be generalized into claims about all Wi-Fi deployments.

The use of fixed MCS is particularly important when interpreting the distance curve.

The experiment is not evaluating adaptive rate control.

## Network Topology

The network consists of two nodes:

- one access point;
- one station.

The internet stack is installed.

IPv4 addresses are assigned.

The topology is deliberately minimal so that mobility/distance remains the main manipulated condition.

This reduces topology complexity but does not isolate all wireless-channel variables in a real-world sense.

## Mobility Model

The station uses `WaypointMobilityModel`.

The experiment specifies station motion rather than teleporting between arbitrary points inside a single run.

The configured velocity is 1 m/s.

Distance is incremented by 0.01 m between the repeated experiment configurations until the defined upper range.

That gives the simulation a fine-grained distance sweep.

The resulting large number of potential distance points is computationally more demanding than a handful of manually chosen distances.

## Traffic Generation

Traffic uses an ns-3 OnOff application.

The transport is UDP.

The offered data rate is configured at 10 Mbps.

The packet size is 1024 bytes.

The application sends traffic toward the access point.

This provides a stable offered-load configuration for comparing runs.

It is not a congestion-heavy multi-flow workload.

## FlowMonitor Use

FlowMonitor is installed to retrieve per-flow packet/byte/timing statistics.

The experiment uses received-byte and timing information to derive throughput.

This is application-layer/flow-oriented simulation measurement.

It avoids estimating throughput merely from the configured sender rate.

That distinction matters because offered load and successfully received throughput are different quantities.

## Throughput Calculation

Throughput is converted to Mbps from the flow statistics.

The resulting value is paired with the distance used for that run.

These pairs form the output series.

The experiment is therefore designed around a simple explanatory relationship:

```text
distance from AP → measured simulated throughput
```

The repository does not add confidence intervals, repeated random seeds, or statistical uncertainty analysis around each distance point.

The output is best understood as a deterministic/configured simulation sweep in the retained snapshot.

## CSV Output

The experiment writes `throughput_data.csv`.

This separates simulation execution from downstream plotting or analysis.

The CSV acts as an interchange artifact.

That makes the simulation usable by external analysis scripts without coupling visualization into the ns-3 executable.

The repository itself does not retain a separate plotting script for this output.

## Major Engineering Work

### Controlled Wireless Scenario Construction

The code constructs a complete ns-3 Wi-Fi experiment from nodes through application traffic.

The configuration is compact but spans PHY/MAC assumptions, mobility, IP setup, application load, and flow measurement.

### Distance Sweep

The experiment turns distance into an explicit independent variable across repeated runs.

That is more systematic than testing one arbitrarily selected topology.

### Measurement Extraction

FlowMonitor is used to convert simulated packet delivery into throughput values.

The sender's configured rate is not simply reported as if it were achieved throughput.

### Machine-Readable Result Export

CSV output supports later analysis outside the simulator.

## Testing & Verification

The primary verification mechanism is simulation execution and FlowMonitor output.

The source prints or records the measured result for each configured distance.

The generated CSV provides a persistent experiment product.

There is no evidence of a separate automated regression suite around the simulation model.

More importantly, there is no repository evidence that the simulated curve was validated against physical Rogers-network measurements.

The corpus therefore keeps simulation and empirical experimentation distinct.

## Engineering Discipline

The experiment demonstrates:

- a clearly manipulated independent variable;
- fixed traffic parameters;
- fixed PHY/MAC assumptions;
- explicit mobility;
- measured rather than assumed throughput;
- machine-readable output.

The fixed MCS should be preserved when interpreting results.

A throughput-versus-distance curve generated under `VhtMcs5` is not the same experiment as a Wi-Fi system allowed to adapt MCS dynamically.

## Product Engineering

This is primarily an engineering experiment rather than an end-user product.

The product of the code is data.

Its interface is the source/configuration and generated CSV.

The useful design choice is that the simulation produces a consumable artifact for downstream analysis rather than embedding every analytical concern into the simulator itself.

## Scale / Complexity

The node topology is intentionally small.

The complexity lies in the cross-layer simulation configuration and repeated measurement sweep.

A two-node scenario still requires coordination of:

- wireless standard configuration;
- rate configuration;
- mobility;
- addressing;
- application traffic;
- flow instrumentation;
- experiment iteration;
- result export.

It is a narrow experiment, not a large network topology.

## Skills Demonstrated

- ns-3 experiment construction
- C++ simulation scripting
- 802.11ac/VHT configuration
- MCS configuration
- Wi-Fi channel-width configuration
- waypoint mobility
- UDP traffic generation
- FlowMonitor use
- throughput computation
- controlled-parameter sweeps
- CSV experiment output
- separation of simulation from downstream analysis

## What Was Learned / Capability Developed

The repository develops the ability to convert a wireless-performance question into a parameterized simulation.

Instead of treating “distance affects throughput” as a qualitative statement, the code turns distance into a sweep and produces measured simulated outputs.

It also reinforces that network-performance experiments depend strongly on assumptions such as MCS, offered load, channel width, and mobility.

That is useful preparation for later physical wireless experiments in the portfolio.

## Portfolio Evolution Context

Repository 077 had already established ns-3 network-simulation work.

RogersExperiment is therefore not the first ns-3 repository in the corpus.

Its relevance is the move toward a more specific wireless-performance question: throughput as a function of station displacement under explicit 802.11ac/VHT parameters.

That aligns with the later portfolio emphasis on wireless experiment methodology and mobility.

## Historical Significance

Within the processed corpus, this is an early compact example of using ns-3 specifically as a wireless measurement generator for a distance/throughput relationship.

The repository also appears close in time to later thesis-oriented wireless tooling.

The name hints at that context, but the implementation must still be described as Wi-Fi simulation rather than Rogers cellular measurement.

## Limitations & Missing Evidence

The source supports a simulated Wi-Fi result only.

It does not establish a Rogers network test, cellular radio model, or physical device measurement.

The fixed rate/MCS configuration limits how broadly the distance curve can be generalized.

The retained experiment does not establish repeated random seeds or uncertainty statistics for each point.

Those are interpretation boundaries, not reasons to disregard the simulation work.

## Overall Narrative

RogersExperiment is a focused ns-3 study that parameterizes station distance, drives a moving Wi-Fi station under explicit 802.11ac/VHT settings, measures received UDP flow throughput, and exports the resulting distance/throughput series to CSV.

Its portfolio value comes from experiment construction and measurement discipline.

The strongest description is a controlled wireless simulation—not a live Rogers-network benchmark.

# Project Tags

`individual-project`, `c++`, `ns3`, `network-simulation`, `wireless-simulation`, `wifi`, `802-11ac`, `vht`, `vht-mcs5`, `constant-rate-wifi-manager`, `160-mhz-channel`, `access-point`, `station`, `waypoint-mobility`, `mobility-model`, `udp`, `onoff-application`, `flow-monitor`, `throughput-measurement`, `distance-sweep`, `throughput-vs-distance`, `ipv4`, `csv-export`, `experiment-design`, `controlled-parameters`, `simulation-not-physical-measurement`, `earliest-observed-vht-distance-throughput-sweep`
