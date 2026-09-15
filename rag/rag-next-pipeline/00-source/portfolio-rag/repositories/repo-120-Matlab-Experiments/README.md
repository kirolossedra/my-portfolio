# Matlab-Experiments

## Repository Identity

- Repository: 120 / 138
- Name: `Matlab-Experiments`
- Start Date: 2025-02-13
- Latest Meaningful Update: 2025-02-20
- Latest Meaningful Commit: `865e79f12922d1e687496c602ae252284d39fcff`
- Primary Language: MATLAB
- Primary Type: Networking and communications experiment repository
- Technical Fields: UDP networking, packet instrumentation, communications-channel simulation, throughput observation
- Collaboration Type: `individual-project`
- Processing Context: chronology backfill from the connected private-repository set

## What This Project Is

`Matlab-Experiments` is a compact experimental workspace for exercising packet transmission, reception, broadcast delivery, timing, packet indexing, throughput observation, and simulated channel impairment directly from MATLAB.

The repository is organized around a small family of sender and receiver programs rather than a single monolithic script.

Its central experimental shape is:

```text
MATLAB broadcast sender
        |
        | UDP / IPv4 broadcast
        | destination 255.255.255.255:55555
        v
shared UDP port 55555
   |        |        |
receiver 1 receiver 2 receiver 3
   |        |        |
packet indices / timing / loss observations
```

A second branch of the repository introduces additive white Gaussian noise into the receiver-side experiment and converts the resulting byte-level corruption rate into a probabilistic packet-drop decision.

The repository therefore preserves two related kinds of engineering evidence:

1. controlled local-network traffic generation and measurement;
2. simulation of communications degradation over that packet stream.

## Repository Structure

The inspected tree contains several experiment variants:

```text
Matlab-Experiments/
├── ReceiverBroadcastParallel.m
├── SenderBroadcast_Throughput.m
├── AGWN/
│   ├── README.md
│   └── receiver.m
├── AWGN With Improved Readability/
│   ├── README.md
│   └── receiver.m
└── VersionALL/
    ├── README.md
    ├── receiver.m
    └── sender.m
```

The naming and commit history show iterative refinement around the same broadcast-receiver experiment.

`SenderBroadcast_Throughput.m` is also reused as `VersionALL/sender.m`, preserving the same blob identity.

The receiver variants carry progressively richer instrumentation and impairment behavior.

## UDP Broadcast Traffic Generation

### Sender configuration

`SenderBroadcast_Throughput.m` creates an IPv4 datagram endpoint through MATLAB's `udpport` API.

The sender uses:

- destination port `55555`;
- local ephemeral port `0`;
- `EnablePortSharing = true`;
- broadcast enabled on the UDP endpoint;
- destination IP `255.255.255.255`.

This directly demonstrates creation and configuration of a UDP broadcast socket from MATLAB.

### Controlled message count

The experiment sends exactly:

```text
numMessages = 1000
```

This provides a bounded traffic population that can later be compared against receiver-side counts and lost packet indices.

### Controlled payload size

Each packet is normalized to:

```text
payloadSize = 1000 bytes
```

The script creates a textual packet body containing the packet number and then pads or truncates the message so that the transmitted payload has the requested size.

That makes packet size an explicit experiment parameter rather than an incidental property of the message string.

### Packet indexing

Each message contains a marker of the form:

```text
Packet #<index>
```

The receiver code later locates `#` and extracts the suffix as the packet index.

This creates a simple application-level sequence identifier that can support:

- receive counts;
- loss identification;
- per-packet logging;
- comparison across receiver instances.

### Send-rate control

The sender defines:

```text
sendInterval = 0.001
```

and pauses after each datagram.

The intended offered-load schedule is therefore one packet attempt per millisecond within MATLAB's execution and scheduling limits.

The code makes the pacing parameter explicit and easily adjustable.

## Parallel Shared-Port Reception

### Multiple MATLAB receiver sessions

`ReceiverBroadcastParallel.m` is documented to be launched in three separate MATLAB sessions.

Each receiver binds the same UDP port:

```text
55555
```

with port sharing enabled.

That experiment shape tests how multiple receiver processes can observe a common broadcast traffic stream.

### Callback-driven packet handling

The receiver installs:

```matlab
u.DatagramReceivedFcn = @(udpObj, event) onDataReceived(...)
```

rather than continuously busy-polling for traffic in the main function.

The main function then remains alive with `pause(inf)` while the callback handles incoming datagrams.

This is direct evidence of event-driven network I/O in MATLAB.

### Datagram draining

Inside the callback, the receiver processes buffered traffic while:

```text
NumDatagramsAvailable > 0
```

and reads one datagram at a time as `uint8`.

The byte data is converted to character form for packet-index extraction and diagnostic output.

### Receiver identity

Each receiver instance accepts a `receiverID`.

The ID is carried into logging and, in later variants, determines which counter and loss-index collection is updated.

This enables parallel instances to produce receiver-specific observations while using the same experiment logic.

## Packet Timing and Rate Instrumentation

The baseline receiver captures timestamps with millisecond formatting:

```text
HH:MM:SS.FFF
```

It records an initial reference time and computes elapsed wall-clock duration from MATLAB serial-date values.

The code reports packet count divided by elapsed time, giving a running packet-arrival rate estimate.

The receiver also prints:

- receiver ID;
- timestamp;
- message body;
- packet length;
- extracted packet index.

This makes the packet path observable while the experiment is executing.

## Arrival Logging

The receiver maintains an `arrivalLog`.

Rows are intended to associate:

- arrival timestamp;
- packet size;
- packet index.

The baseline source also includes a `summarizeResults` helper that derives:

- start time;
- end time;
- elapsed seconds;
- total packet count;
- total bytes;
- approximate throughput in bits per second.

The presence of both streaming diagnostics and a summary function shows an experiment pattern that combines immediate inspection with post-run aggregate metrics.

## Packet Index Extraction

The packet parser does not rely on a complex serialization format.

It scans the message for the first `#` and extracts everything after that marker.

This is intentionally lightweight, but it gives the experiment a deterministic way to associate received messages with sender sequence numbers.

Later receiver variants use the parsed sequence number when recording simulated packet losses.

## AWGN Receiver Experiment

### Noise injection

`AGWN/receiver.m` and the improved-readability AWGN variant convert each received datagram from `uint8` to `double` and invoke MATLAB's:

```matlab
awgn(dataDouble, snr, 'measured')
```

The code therefore uses MATLAB communications tooling to perturb the received byte values with additive white Gaussian noise.

### Randomized SNR

For each processed datagram, the receiver samples:

```text
SNR = 20 + 2 * randn
```

so the impairment condition varies around a 20 dB mean with a 2 dB standard-deviation term.

This produces packet-by-packet variation rather than one constant channel condition.

### Re-quantization

After noise is applied, the altered values are:

1. rounded;
2. clipped to the valid byte interval `0..255`;
3. converted back to `uint8`.

The receiver can therefore compare the noisy quantized payload against the original datagram bytes.

### Byte error-rate calculation

The code counts positions where:

```text
noisyDataRounded ~= originalData
```

and divides by the total number of bytes.

The resulting `errorRate` is a byte-level corruption proportion for that simulated noise realization.

### Error rate to packet-drop probability

The AGWN version scales the measured error rate and compares it with a random sample to decide whether to drop the packet from later processing.

This creates a stochastic packet-loss layer driven by the observed corruption level.

The improved-readability variant retains this mechanism while using a smaller scaling factor.

That is evidence of iterative calibration of the synthetic impairment model.

## Receiver-Specific Loss Tracking

The AWGN variants maintain separate lost-packet arrays for receiver instances.

When a simulated drop occurs, the code:

1. parses the original packet index;
2. associates the loss with the current receiver ID;
3. appends the index to that receiver's loss list;
4. logs SNR and error rate;
5. skips normal packet processing for that datagram.

This preserves which sequence numbers were considered lost rather than recording only an aggregate count.

## Cleanup-Time Experiment Reporting

The AWGN receivers register an `onCleanup` callback.

This means termination of the long-running receiver triggers final experiment reporting.

The improved-readability version reports, for the active receiver:

- total packets processed;
- total packets lost;
- packet error rate as a percentage;
- elapsed time;
- explicit lost packet indices.

Using cleanup behavior for final statistics is useful in this particular experiment because the receiver's main lifetime is intentionally indefinite until manually interrupted.

## Packet Error Rate

The improved AWGN variant computes:

```text
totalPackets = receivedCount + lostCount
PER = lostCount / totalPackets * 100
```

This adds a direct packet-level reliability metric on top of the byte-level corruption calculation used to trigger synthetic losses.

The repository therefore distinguishes between:

- byte disagreement after AWGN and quantization;
- simulated packet loss;
- packet error-rate summary.

## Experiment Evolution

The commit sequence records a short but concrete development progression.

### Initial broadcast experiment

The repository began with the broadcast receiver and throughput sender.

This establishes the core transport experiment first:

```text
controlled sender -> UDP broadcast -> shared receiver port
```

### Versioned combined sender/receiver

`VersionALL` then collected sender and receiver variants under a common directory.

That provides a snapshot-style experiment grouping.

### Noise-model experiment

Subsequent commits introduced the AGWN/AWGN receiver.

The packet stream became a substrate for simulated channel degradation rather than only a transport-throughput exercise.

### Readability refinement

The final repository state contains a separate `AWGN With Improved Readability` variant.

Its code organizes final receiver reporting around the current receiver instance and exposes packet-loss statistics more directly.

This shows refinement not merely of the experiment's numerical behavior but also of how results are surfaced to the experimenter.

## Technical Stack

### MATLAB

MATLAB is the implementation and experiment runtime.

It is used for:

- UDP socket configuration;
- callback registration;
- packet generation;
- packet parsing;
- timing;
- random-variable generation;
- AWGN simulation;
- byte-array transformation;
- experiment logging.

### `udpport`

MATLAB's `udpport` API provides both transmission and reception.

The code exercises:

- IPv4 datagram mode;
- broadcast transmission;
- shared local-port reception;
- datagram callbacks;
- reading buffered datagrams.

### Communications Toolbox `awgn`

The AWGN variants use MATLAB's `awgn` function with measured signal power.

Its role is specifically to perturb received byte-valued data for the impairment experiment.

## Engineering Practices Evidenced

### Explicit experiment parameters

The sender exposes packet count, payload size, send interval, destination port, and destination address as named values.

The AWGN receiver similarly exposes the SNR model and drop scaling in source.

This keeps the important experiment conditions inspectable.

### Sequence-aware instrumentation

Packet indexes survive from sender generation into receiver logging and loss tracking.

That makes individual packet outcomes traceable.

### Variant preservation

Rather than replacing every prior experiment, the repository preserves multiple receiver variants.

For a learning/experimental repository, this helps retain how the test logic changed across iterations.

### Termination hooks

`onCleanup` is used to surface final reliability statistics when a receiver is interrupted.

This is a practical lifecycle mechanism for an otherwise indefinite callback-driven process.

## Skills Demonstrated

### MATLAB programming

The repository demonstrates MATLAB functions, nested helper logic, global experiment state, arrays, string/character manipulation, timing functions, and callback use.

### Network programming

Concrete networking skills include:

- UDP datagrams;
- IPv4 broadcast;
- shared local ports;
- broadcast enablement;
- asynchronous receive callbacks;
- packet payload handling.

### Communications experimentation

The repository materially uses:

- SNR;
- AWGN;
- byte corruption comparison;
- stochastic drop modeling;
- packet error rate.

### Performance instrumentation

The source computes or prepares:

- packet rate;
- elapsed time;
- packet counts;
- byte totals;
- approximate throughput;
- packet-loss indices;
- PER.

### Experiment design

The sender controls offered traffic characteristics while receiver variants control observation and impairment behavior.

This separation supports repeatable changes to one side of the experiment without rewriting the other.

## Portfolio Significance

Within the portfolio, `Matlab-Experiments` is evidence of using MATLAB outside purely offline numerical analysis.

The repository applies MATLAB to live socket behavior, packet timing, multiple listener instances, and communications impairment simulation.

It connects networking concepts with quantitative experiment instrumentation.

It also demonstrates a recurring engineering pattern in the portfolio: build a small traffic/control mechanism, observe its behavior with explicit metrics, then add controlled adverse conditions to study reliability.

# Project Tags

- `matlab`
- `udp`
- `udp-broadcast`
- `ipv4`
- `datagram-networking`
- `shared-port-reception`
- `callback-driven-networking`
- `packet-indexing`
- `packet-instrumentation`
- `throughput-measurement`
- `packet-rate-measurement`
- `fixed-payload-traffic`
- `traffic-generation`
- `awgn`
- `snr`
- `communications-simulation`
- `byte-error-measurement`
- `packet-loss-simulation`
- `packet-error-rate`
- `network-experiment`
