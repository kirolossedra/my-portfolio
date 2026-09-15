# Repository 134 — Thesis

## Repository Identity

- **Repository:** `kirolossedra/Thesis`
- **Repository index:** 134
- **Start date:** 2026-06-15
- **Latest meaningful update:** 2026-07-04
- **Latest meaningful commit:** `1eda615dda92800f00c037594bf0e0e768d1a28c` — `Create plot-throughput-smartlegend.py`
- **Primary language:** Python
- **Collaboration classification:** `individual-research-project`
- **Primary scope:** thesis-specific wireless/mobile-robot measurement extraction, motion clipping, direction assignment, aggregation, statistics, and publication plotting

## What This Repository Is

`Thesis` is a dedicated processing repository for wireless-performance experiments involving a moving robot.

It turns raw experiment logs into repeatable thesis-analysis artifacts.

The scripts coordinate three different kinds of time-dependent evidence:

- robot motion intervals;
- network performance measurements such as throughput and latency;
- wireless-link measurements such as MCS and RSSI.

The repository is not the thesis manuscript itself.

It is the data-processing and plotting layer that prepares experimental results for interpretation and publication.

## Relationship to the Wider Research

The repository sits downstream of experiment acquisition.

A simplified research pipeline is:

```text
wireless/mobile-robot experiment
        |
        +--> motion logs
        +--> iperf throughput logs
        +--> hping/SYN latency logs
        +--> Wi-Fi MCS/RSSI logs
        |
        v
exact temporal clipping
        |
        v
direction assignment / special trajectory handling
        |
        v
processed per-run files
        |
        v
per-run + aggregate statistics
        |
        v
PNG / PDF / CSV / checklist outputs
        |
        v
thesis figures and tables
```

This separation is important because the repository focuses on analysis reproducibility rather than hardware control.

## Repository Structure

The substantive implementation lives under `scripts/`.

Observed files include:

```text
scripts/
├── README.md
├── extract-latency.py
├── extract-latency-allfwd.py
├── extract-mcs.py
├── extract-mcs-allfwd.py
├── extract-throughput.py
├── extract-throughput-51.py
├── extract-throughput-allfwd
├── extract-throughput-notnormalized.py
├── extract-wifi-mcs-rssi-notnormalized.py
├── mcs-plot-x.py
├── plot-latency-p50-only.py
├── plot-latency-p50-only-allfwd.py
├── plot-latency-p50-p99.py
├── plot-mcs.py
├── plot-throughput-allfwd
├── plot-throughput-smartlegend.py
└── plot-throughput.py
```

The scripts form families rather than unrelated one-off utilities.

## Directory Contract

The processing scripts assume an experiment directory structure with raw inputs such as:

```text
Performance/
Wireless Link/
motion logs/
```

Generated artifacts are written under:

```text
processed/
```

This establishes a reproducible raw-vs-derived data boundary.

## Raw / Derived Separation

The scripts do not overwrite the original experiment sources as their normal analysis path.

They create generated processed directories for clipped and aggregated artifacts.

This is important for research reproducibility because raw logs remain distinguishable from transformed outputs.

## Motion Logs as the Temporal Authority

A major design choice is that robot motion logs define the interval of interest.

Network logs are clipped against exact motion start/stop timestamps.

The motion trace therefore acts as an experimental ground-truth timeline for deciding when the robot is actually traversing the trajectory.

## Exact Motion Timestamp Handling

The scripts explicitly preserve available millisecond precision in motion timestamps.

The throughput extractor documents:

- no flooring;
- no ceiling;
- no timestamp approximation.

This is a strong methodological choice because coarse clipping can move samples across motion boundaries and distort short transient behavior.

## Throughput Processing Family

The throughput pipeline has multiple variants for different experimental conditions.

Core scripts include:

- normalized forward/back extraction;
- non-normalized extraction;
- all-forward special-case extraction;
- special-duration variants;
- aggregate plotting;
- smart-legend plotting.

## Standard Throughput Extraction

`extract-throughput.py` scans the performance data and motion logs, parses motion events, sorts those events globally by exact start time, assigns direction, and clips timestamped iperf lines into motion-specific output files.

The documented direction rule is:

```text
event 1 -> forward
event 2 -> backward
event 3 -> forward
event 4 -> backward
...
```

Direction is assigned after global timestamp sorting.

This avoids relying on file enumeration order as a proxy for experimental order.

## Global Direction Assignment

The alternating forward/backward rule is based on the globally ordered motion-event sequence.

This matters when motion events are spread across multiple files.

The logic first gathers all events, sorts them, then applies odd/even direction.

That is more defensible than resetting the direction count inside every log file.

## Throughput Log Parsing

Throughput input is timestamped iperf output.

The parser extracts the wall-clock prefix and interval fields from each line.

The script keeps raw lines associated with parsed timestamps so generated clips preserve the original measurement representation while rewriting interval columns only when normalization is requested.

## Throughput Interval Normalization

The standard extractor can normalize each clipped run so the first relevant iperf interval begins from a local zero-time origin.

Conceptually:

```text
absolute experiment time
        |
        v
motion clip
        |
        v
local elapsed time
```

This makes multiple runs comparable on the same trajectory-relative x-axis.

## Fixed Analysis Horizon

The standard throughput extractor retains normalized intervals whose start is at or before 57 seconds.

That creates a common motion-duration analysis window.

The script's comments explicitly distinguish the retained `57.00-58.00` interval from later intervals that fall outside the configured start-time threshold.

## Why Local Time Matters

Different experiment runs begin at different wall-clock times.

Normalizing to motion-relative elapsed time permits cross-run aggregation without aligning unrelated clock timestamps.

The raw source time still determines clipping; local time is introduced only after the correct motion interval is identified.

## Non-Normalized Throughput Variant

`extract-throughput-notnormalized.py` preserves original timing rather than rewriting every run to a zero origin.

This variant is useful when the analysis needs to retain direct relationship to the original experiment clock or iperf interval numbering.

The existence of both normalized and non-normalized paths shows the preprocessing choice is explicit rather than accidental.

## All-Forward Throughput Variant

`extract-throughput-allfwd` exists for a trajectory/data condition where the standard alternating direction assumption is not correct.

In this special case, motion events are interpreted as forward instead of alternating forward/backward.

The script family therefore encodes experiment-specific exceptions rather than forcing every data set through one unsuitable assumption.

## Special Trajectory Handling

The `allfwd` scripts are documented as addressing a special Trajectory 1 downlink situation.

Important behavior includes:

- all valid motion events treated as forward;
- exact timestamps retained;
- no odd/even direction split;
- deterministic input expectations;
- local normalized time where applicable.

This is evidence of adapting the pipeline to an observed experimental protocol issue instead of silently relabeling the data.

## Deterministic Motion-Log Selection

The special all-forward workflow expects a prepared motion-log input and is designed to stop rather than ambiguously select from multiple possible prepared logs.

That reduces accidental preprocessing against the wrong motion reference.

## Old Output Cleanup

Several extractors intentionally clear old generated output before writing new derived files.

This prevents stale run artifacts from being mixed into a new analysis.

For research scripts, stale generated files are a real reproducibility risk because aggregate plotters may otherwise consume results that no longer correspond to the current raw inputs.

## Throughput Aggregation

`plot-throughput.py` and related plotters consume processed throughput runs rather than reparsing raw experiment directories each time.

The plotting layer computes summary data across multiple runs and writes both visual and machine-readable outputs.

## Aggregate Time Axis

The plotter aligns runs onto a common elapsed-time axis.

This allows statistics such as mean and variability to be calculated at the same trajectory-relative time across repetitions.

## Throughput Summary Statistics

The throughput plotting family includes outputs for:

- per-time aggregate behavior;
- per-run statistics;
- mean;
- standard deviation;
- minimum;
- maximum;
- sample count.

The scripts therefore preserve both central tendency and run-to-run variability.

## Camera-Ready Throughput Plots

The specialized aggregate plotting code is designed to produce thesis-ready figures rather than only interactive exploratory graphics.

Observed outputs include:

- PNG;
- PDF;
- CSV;
- checklist/report text.

The plotting style includes grayscale-oriented publication output in relevant scripts.

## Smart Legend Variant

The latest commit adds `plot-throughput-smartlegend.py`.

That shows continued iteration on publication presentation after the main processing pipeline existed.

The latest repository update is therefore a figure/presentation refinement, not a new acquisition protocol.

## Latency Processing Family

Latency processing mirrors the throughput architecture but accounts for the fact that hping produces multiple RTT observations per second.

Core scripts include:

- standard exact-motion clipping;
- all-forward clipping;
- P50-only plotting;
- P50-only all-forward plotting;
- joint P50/P99 plotting.

## Latency Acquisition Format

The latency scripts parse timestamped SYN/hping response lines.

The analysis specifically uses response lines containing an RTT value.

Header/control lines are not treated as latency observations.

## Multiple Samples per Second

Unlike 1 Hz-style throughput summaries, latency can have multiple RTT samples inside each elapsed second.

The plotters explicitly account for this instead of pretending there is one latency datum per second.

This is one of the strongest statistical-design details in the repository.

## Per-Run Per-Second Reduction

`plot-latency-p50-p99.py` first groups a run's raw RTT samples into one-second elapsed-time bins.

Within each run/bin it computes percentile summaries.

The pipeline therefore performs:

```text
raw multi-Hz RTT samples
        |
        v
one-second bins inside each run
        |
        +--> per-run P50
        +--> per-run P99
        |
        v
cross-run aggregation
```

## Run-Weighted Aggregation

The latency plotter explicitly uses a run-weighted design.

Each run contributes one P50 and one P99 value for a time bin rather than allowing a run with more hping replies to dominate the aggregate statistic.

This is a meaningful statistical choice.

It preserves the experimental run as the unit of repetition.

## Latency P50

P50 represents median latency behavior inside the relevant sample set.

The repository uses it as a robust central latency statistic for time-dependent plots.

## Latency P99

P99 is retained to capture tail latency.

This recognizes that wireless/network performance cannot be characterized adequately by a mean or median alone when rare spikes matter.

## P50-Only Variants

Some plotters present P50 as the primary figure while retaining P99 diagnostically in CSV/checklist outputs.

This supports a publication choice to simplify the visual while preserving tail-latency evidence for analysis.

## P50/P99 Combined Variant

`plot-latency-p50-p99.py` generates both central and tail latency curves.

This is useful when the thesis figure needs to communicate typical and high-percentile behavior together.

## Midnight Crossing

The latency pipeline includes logic to unwrap seconds-of-day across midnight.

If a sequence wraps from late-day time to early-day time, the parser adds a day offset so elapsed time remains monotonic.

This is a defensive detail that prevents clock-of-day formatting from creating a negative run duration.

## hping Timestamp Variants

The parser accepts more than one bracket timestamp representation.

It handles a logging format that repeats the seconds field as well as the conventional fractional-second form.

The repeated field is normalized rather than treated as an independent time component.

## Fixed Latency Time Axis

The latency plotting configuration can use a fixed 0–57 second time axis.

This keeps figures comparable even when individual runs have missing samples in some seconds.

## Pooled Diagnostics

The latency code can also write pooled raw-sample diagnostics.

These are kept separate from the run-weighted plot statistics.

This is methodologically useful because it permits inspection of raw-sample behavior without changing the primary experimental weighting rule.

## Latency Output Artifacts

The latency analysis produces multiple evidence surfaces, including:

- PNG plots;
- PDF plots;
- time-summary CSV;
- per-run summary CSV;
- per-run/per-second statistics CSV;
- checklist text.

## MCS / RSSI Processing

The repository also processes Wi-Fi link-layer metrics.

Scripts include extraction and plotting paths for MCS and RSSI.

This links application/network performance to radio/link adaptation behavior.

## Wi-Fi MCS/RSSI Extraction

`extract-wifi-mcs-rssi-notnormalized.py` clips Wi-Fi link logs against exact motion timestamps while preserving original timing.

The script uses the same overall experimental discipline:

- identify exact motion windows;
- preserve measurement precision;
- assign direction;
- generate derived files separately from raw logs.

## MCS Aggregation

`plot-mcs.py` reduces higher-rate MCS samples into one-second summaries before cross-run plotting.

The documented statistic is a per-second P50-style summary.

This creates a time scale comparable to the normalized trajectory-analysis figures.

## Why MCS Matters

MCS is not just another throughput field.

It is a link-adaptation state that can help explain why throughput changes as the robot moves through different channel conditions.

Including MCS alongside RSSI and performance metrics gives the thesis a multi-layer view of wireless behavior.

## Exactness Versus Normalization

The repository repeatedly separates two different concerns:

1. **exact raw temporal alignment** for deciding which samples belong to the motion interval;
2. **normalized elapsed time** for comparing runs after clipping.

This is a strong research-processing design.

Normalization does not replace exact clipping.

It happens after membership in the experimental interval has been established.

## Direction as Experimental Metadata

Forward and backward are not arbitrary filenames.

They represent trajectory direction and can correspond to different RF/environmental geometry.

The standard pipeline therefore preserves direction as a first-class grouping variable.

## Special-Case Transparency

When a data set violates the normal alternating-direction protocol, the repository creates separate `allfwd` processing paths.

That is preferable to silently modifying the main rule.

It preserves traceability between:

- normal protocol;
- exceptional data condition;
- special analysis path.

## Reproducibility Checklists

Several plotters generate checklist text alongside figures and CSVs.

This gives a human-readable audit surface for what inputs/runs were included and what the analysis produced.

The checklist is part of the research workflow rather than a UI feature.

## CSV as Analysis Interchange

The scripts emit CSV files for statistics even when the final target is a thesis figure.

This provides:

- inspectable numeric evidence;
- easier validation against plots;
- reusable data for later table generation;
- separation between statistical computation and figure rendering.

## PNG and PDF Output

Generating both raster and vector/document outputs supports multiple publication contexts.

PNG is useful for quick inspection and general insertion.

PDF is suitable for high-quality publication workflows.

## Python Scientific Stack

Observed processing/plotting code uses tools such as:

- `pathlib`;
- regular expressions;
- `datetime`;
- CSV;
- NumPy;
- Matplotlib.

The implementation is largely direct Python rather than an external workflow framework.

## Regex Parsing

The scripts parse real measurement-tool text formats rather than relying only on idealized CSV sources.

Examples include:

- iperf timestamped text;
- hping output;
- motion-event logs.

This requires defensive format handling and careful timestamp extraction.

## File-System Automation

Scripts discover data from expected directory hierarchies and generate structured outputs.

This reduces manual copy/paste during repeated experimental analysis.

## Error Handling Philosophy

The processing tools generally fail loudly when key assumptions cannot be satisfied, such as missing expected input directories or absent parsed measurements.

That is important for research because an empty plot should not silently masquerade as a valid result.

## Measurement Integrity

The repository's strongest integrity practices include:

- exact motion timestamps;
- explicit direction rule;
- explicit special-case scripts;
- raw/derived separation;
- stale-output cleanup;
- common analysis horizon;
- run-weighted latency aggregation;
- P50/P99 distinction;
- CSV diagnostics;
- human-readable checklists.

## Research Engineering Skills

The repository demonstrates:

- experiment-log processing;
- temporal synchronization;
- repeated-run aggregation;
- trajectory-relative normalization;
- exception-aware preprocessing;
- percentile analysis;
- tail-latency analysis;
- publication-quality visualization;
- reproducible derived-data organization.

## Wireless Networking Skills

The project provides evidence around:

- throughput analysis;
- latency analysis;
- SYN/hping measurement processing;
- Wi-Fi MCS;
- RSSI;
- mobile wireless behavior;
- run-to-run wireless variability;
- forward/backward trajectory comparison.

## Statistical Skills

Evidence includes:

- median/P50;
- P99;
- standard deviation;
- min/max;
- per-run statistics;
- per-time-bin statistics;
- sample counts;
- run-weighted aggregation;
- pooled diagnostics kept separate from primary run weighting.

## Data-Processing Skills

Evidence includes:

- text parsing;
- timestamp parsing;
- sub-second precision;
- midnight unwrapping;
- temporal clipping;
- file discovery;
- directory normalization;
- CSV writing;
- stale-output management.

## Visualization Skills

Evidence includes:

- Matplotlib;
- shared time axes;
- camera-ready figures;
- grayscale publication styling;
- smart legend iteration;
- PNG/PDF export;
- linked CSV outputs.

## Experimental Design Awareness

The scripts preserve evidence about how the experiment was actually performed.

Examples include:

- alternating trajectory direction;
- fixed motion horizon;
- special all-forward exception;
- multiple RTT samples per second;
- run-level repetition as the statistical unit.

This is more than generic plotting code.

## Relationship to Raw Acquisition Repositories

Other portfolio repositories contain acquisition systems and broader experiment infrastructure.

`Thesis` is different: it is the thesis-specific transformation layer that takes acquired logs and produces the exact derived evidence used for analysis.

The corpus should therefore retrieve this repository when the question is about processing methodology, temporal clipping, normalized trajectories, P50/P99, or thesis figure generation.

## Maturity Assessment

This repository is a **mature research-analysis script suite for a specific thesis data pipeline**.

Its maturity is methodological rather than product/deployment oriented.

It has:

- consistent directory contracts;
- families of extractors and plotters;
- special-case handling;
- explicit statistical assumptions;
- multiple output formats;
- repeated-run aggregation;
- publication-focused refinement.

It should not be described as a production SaaS application or general-purpose analytics library.

## RAG Retrieval Guidance

Strong matches include:

- mobile-robot wireless experiments;
- thesis data processing;
- exact motion timestamp clipping;
- forward/backward trajectory analysis;
- normalized elapsed time;
- iperf log processing;
- hping RTT processing;
- P50 latency;
- P99 latency;
- tail latency;
- run-weighted aggregation;
- Wi-Fi MCS;
- RSSI;
- repeated-run statistics;
- publication-quality plots;
- experimental reproducibility;
- data-preprocessing exceptions.

This repository is particularly valuable when a question asks **how experimental raw logs became the thesis figures/statistics**.

# Project Tags

- `thesis-data-pipeline`
- `wireless-research`
- `mobile-robot-networking`
- `experimental-data-processing`
- `python`
- `iperf3-log-processing`
- `hping-latency-processing`
- `motion-log-processing`
- `exact-timestamp-clipping`
- `millisecond-precision`
- `trajectory-normalization`
- `elapsed-time-normalization`
- `forward-backward-analysis`
- `special-case-preprocessing`
- `all-forward-trajectory`
- `throughput-analysis`
- `latency-analysis`
- `p50-latency`
- `p99-latency`
- `tail-latency`
- `run-weighted-aggregation`
- `per-second-binning`
- `multi-hz-measurements`
- `midnight-timestamp-unwrapping`
- `wifi-mcs`
- `rssi`
- `link-adaptation-analysis`
- `repeated-run-statistics`
- `mean-standard-deviation`
- `min-max-statistics`
- `csv-export`
- `numpy`
- `matplotlib`
- `camera-ready-plots`
- `grayscale-publication-plots`
- `png-export`
- `pdf-export`
- `research-checklists`
- `raw-derived-data-separation`
- `stale-output-cleanup`
- `reproducible-research`
- `publication-figure-generation`
