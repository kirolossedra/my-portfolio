# Repository 077 — NS3

## Repository Identity

- **Repository:** `kirolossedra/NS3`
- **Repository start date:** 2025-03-05
- **Last meaningful update date:** 2025-03-06
- **Latest meaningful commit:** `3bf8565ab2ab8b79d92c5bd11e2c2ca20cffbd59`
- **Primary technical field:** wireless network simulation and performance experimentation
- **Application domain:** Wi-Fi broadcast/unicast behavior and throughput scaling
- **Primary technologies:** ns-3, C++, Python, Matplotlib
- **Project context:** personal networking experiment
- **Collaboration classification:** `individual-project`

## Evidence Basis

The repository contains executable-looking ns-3 simulation source and a Python experiment driver.

The important files include:

- `broadcast.pp`,
- `Broadcast/broadcast.pp`,
- `multicast/multicast.pp`,
- `multicast/runscript.py`,
- a mostly empty `multicast/multicastbiggerwindow.pp`,
- small README material.

The `.pp` extension causes GitHub to classify the repository as Pascal.

The actual simulation source is C++ using ns-3 headers and APIs.

Therefore this corpus classifies the implementation as C++/ns-3 rather than Pascal.

## What the Project Is

This repository explores Wi-Fi traffic behavior in ns-3.

The checked-in simulations create an infrastructure WLAN with:

- one access point,
- multiple station nodes,
- IPv4 networking,
- UDP traffic,
- static station placement,
- PHY/MAC tracing.

Two important traffic configurations are represented:

1. UDP broadcast from the AP,
2. per-station UDP unicast from the AP.

The repository then adds a Python automation layer to sweep station counts and plot average per-user throughput.

That moves the project beyond a single simulation run into a small experiment pipeline.

## Repository Structure

The current tree is compact:

```text
NS3/
├── README.md
├── broadcast.pp
├── Broadcast/
│   └── broadcast.pp
└── multicast/
    ├── README.md
    ├── multicast.pp
    ├── multicastbiggerwindow.pp
    └── runscript.py
```

The `multicast` naming should be interpreted carefully.

The current `multicast.pp` source identifies itself as a Wi-Fi UDP **unicast** per-user example.

Its behavior sends a separate UDP stream from the AP to each station.

The corpus therefore describes what the code does rather than relying on the folder name.

## Broadcast Simulation

The root `broadcast.pp` configures:

- ns-3 core module,
- network module,
- internet module,
- Wi-Fi module,
- mobility module,
- applications module,
- Wi-Fi MAC-header inspection.

The default topology uses:

- 10 station nodes,
- one AP,
- 802.11g,
- infrastructure mode,
- a shared SSID,
- constant-position mobility.

Stations are placed with a grid position allocator.

The simulation installs the Internet stack and assigns addresses from:

```text
10.1.4.0/24
```

The AP sends UDP traffic to the IPv4 broadcast address.

A UDP server is installed on every station.

The default source configuration sends:

- 100 packets,
- 1024 bytes per packet,
- one packet every 0.1 seconds.

## MAC/PHY Trace Instrumentation

The broadcast experiment attaches a callback to the AP PHY transmission-end trace.

The callback:

1. copies the transmitted packet,
2. peeks at the `WifiMacHeader`,
3. checks that the frame is a data frame,
4. checks that the destination is the broadcast MAC address,
5. accumulates transmitted bytes.

This is useful because the throughput calculation is tied to observed transmitted frames rather than only to application-layer intent.

The experiment then computes average transmitted broadcast throughput over the active transmission interval.

## Per-User Unicast Experiment

`multicast/multicast.pp` implements a different workload.

The default topology uses:

- 20 stations,
- one access point,
- 802.11g,
- static grid placement,
- one UDP server per station.

The AP installs a separate UDP client for every station.

Each client targets that station's assigned IPv4 address.

This produces a per-user unicast traffic pattern.

The AP-side trace callback counts transmitted data frames and the simulation derives:

- aggregate AP throughput,
- average throughput per user.

Average per-user throughput is computed by dividing aggregate throughput by the configured station count.

## RTS/CTS Configuration

The unicast experiment explicitly configures:

```text
ArfWifiManager
RtsCtsThreshold = 500 bytes
```

With the simulation's 1024-byte UDP payloads, this setting is designed to force RTS/CTS behavior for sufficiently large frames.

This introduces a MAC-access/control-overhead dimension into the experiment.

The project therefore demonstrates awareness that throughput behavior depends on more than application packet rate.

## Packet Capture

The unicast experiment enables ns-3 PCAP tracing on the AP device.

This creates packet-level capture evidence suitable for external inspection with tools such as Wireshark.

The code comments explicitly describe capturing traffic including RTS/CTS.

PCAP generation is a stronger verification mechanism than relying only on printed aggregate numbers because it permits packet-level inspection.

## Parametric Experiment Design

The station count is exposed through ns-3 `CommandLine`.

The simulation accepts:

```text
--numStations=<value>
```

This makes station population an experiment parameter rather than a hard-coded one-off condition.

The Python driver then exploits this parameterization.

## Python Experiment Driver

`multicast/runscript.py` automates repeated simulation execution.

It generates station counts with:

```text
range(1, 65, 5)
```

For each value it:

1. constructs an ns-3 CLI command,
2. launches the simulation through `subprocess`,
3. captures standard output,
4. parses average per-user throughput with a regular expression,
5. stores the numeric result.

The script then plots:

```text
number of stations
vs.
average throughput per user
```

using Matplotlib.

This creates a complete small experiment loop:

```text
parameter sweep
→ simulator execution
→ stdout capture
→ metric extraction
→ aggregation
→ visualization
```

## Measurement Logic

The simulation reports throughput in Mbps.

The underlying calculation converts accumulated bytes to bits and divides by active transmission duration.

The unicast configuration additionally divides aggregate throughput by the number of stations.

This allows the project to examine scaling pressure as station count increases.

The Python driver is especially important because it turns a static simulation into a repeatable multi-point experiment.

## Network Concepts Demonstrated

The source directly exercises:

- wireless infrastructure mode,
- access point/station topology,
- SSIDs,
- IPv4 address assignment,
- UDP server/client applications,
- broadcast addressing,
- per-destination unicast,
- MAC frame inspection,
- RTS/CTS thresholding,
- PHY tracing,
- packet capture,
- throughput calculation.

The repository therefore connects networking theory to programmable simulation.

## Testing and Verification

The repository's verification style is simulation-driven.

Evidence includes:

- explicit simulator output,
- MAC/PHY trace callbacks,
- PCAP generation,
- repeated parameterized runs,
- regex-based metric extraction.

The Python driver handles a failed metric parse by emitting a warning and recording `0.0`.

That is a simple defensive path for experiment automation.

The checked-in evidence does not establish a dedicated unit-test suite, and this project does not need to be represented as one.

Its validation mechanism is experimental execution.

## Experimental Reproducibility

Several simulation parameters are directly encoded:

- station count,
- simulation time,
- transmission start time,
- UDP port,
- packet count,
- packet interval,
- packet size,
- Wi-Fi standard,
- station placement,
- RTS/CTS threshold.

That gives the experiment reasonable source-level reproducibility.

The Python sweep also codifies the range of station populations.

The repository would still require an appropriate ns-3 environment to reproduce outputs, but the experiment logic itself is explicit.

## Engineering Discipline

The repository demonstrates a useful progression:

1. build a base broadcast simulation,
2. create a unicast/per-user variant,
3. add tracing,
4. parameterize station count,
5. automate multi-run execution,
6. extract metrics,
7. visualize scaling.

This is a stronger engineering pattern than manually changing constants for every run.

It separates:

- simulator logic,
- experiment orchestration,
- result visualization.

## Scale and Complexity

The codebase is small, but the simulated system contains many interacting components.

Complexity comes from:

- multiple nodes,
- protocol-stack installation,
- PHY/MAC configuration,
- traffic generation,
- tracing,
- parameterized population scaling,
- external experiment orchestration.

The simulation is not evidence of a production network.

It is evidence of controlled wireless-system modeling.

## Skills Demonstrated

Directly supported skills include:

- ns-3,
- C++ simulation programming,
- Wi-Fi simulation,
- 802.11g configuration,
- UDP traffic modeling,
- IPv4 networking,
- broadcast networking,
- unicast networking,
- MAC-header inspection,
- PHY trace callbacks,
- RTS/CTS configuration,
- PCAP generation,
- throughput measurement,
- experiment parameterization,
- Python automation,
- subprocess control,
- regular expressions,
- Matplotlib visualization,
- repeatable experiment sweeps.

## Capability Developed

The project demonstrates the ability to move from a network question to an executable experiment.

That means defining:

- topology,
- protocol stack,
- traffic model,
- measurement points,
- scaling parameter,
- metric extraction,
- visualization.

It also shows the beginning of a research workflow in which simulation behavior is instrumented rather than simply observed through a GUI.

## Portfolio Evolution Context

Earlier networking work in the corpus includes protocol implementation such as Go-Back-N.

This repository shifts toward simulation-based systems analysis.

It also connects naturally to the broader wireless/research trajectory visible later in the portfolio.

The use of ns-3 establishes a reusable network-simulation capability before later real-system wireless experiments.

## Historical Significance

Within the processed corpus, this is the earliest direct evidence of:

- ns-3,
- programmable Wi-Fi network simulation,
- PCAP generation from a simulator,
- automated throughput sweeps over station population.

The repository marks a move from learning networking algorithms toward designing controlled network experiments.

## Evidence Boundaries

The folder named `multicast` currently contains code that implements per-user unicast.

The corpus follows implementation behavior rather than the folder label.

The empty `multicastbiggerwindow.pp` does not establish an additional implemented experiment.

The `.pp` extension is not treated as evidence of Pascal because the source imports and uses the C++ ns-3 API.

## Overall Narrative

`NS3` is a compact but complete wireless-network experimentation repository.

It models an 802.11g infrastructure network, compares traffic configurations, instruments MAC/PHY transmission behavior, emits PCAPs, computes throughput, and automates a station-count sweep with Python.

Its strongest portfolio value is the end-to-end experimental pattern:

```text
network hypothesis
→ parameterized simulation
→ trace instrumentation
→ repeated execution
→ metric extraction
→ visualization
```

# Project Tags

- `individual-project`
- `network-simulation`
- `ns-3`
- `cpp`
- `python`
- `wifi`
- `wifi-802-11g`
- `wireless-networking`
- `udp`
- `ipv4`
- `broadcast`
- `unicast`
- `access-point`
- `station-nodes`
- `mac-layer`
- `phy-tracing`
- `wifi-mac-header`
- `rts-cts`
- `pcap`
- `packet-capture`
- `throughput-analysis`
- `per-user-throughput`
- `parameterized-simulation`
- `experiment-automation`
- `subprocess-automation`
- `regex-parsing`
- `matplotlib`
- `performance-visualization`
