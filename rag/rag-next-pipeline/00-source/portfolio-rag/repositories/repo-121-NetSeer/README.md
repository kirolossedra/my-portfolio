# NetSeer

## Repository Identity

- Repository: 121 / 138
- Name: `NetSeer`
- Start Date: 2025-03-30
- Latest Meaningful Update: 2026-02-06
- Latest Meaningful Commit: `b21146f1da5114c6665b069bab8490bb98fb6315`
- Primary Language: HTML with embedded JavaScript and CSS
- Primary Type: Browser-based network-log analysis and visualization utility
- Technical Fields: network performance analysis, time-series visualization, FTP transfer analysis
- Collaboration Type: `individual-project`
- Processing Context: chronology backfill from the connected private-repository set

## What This Project Is

`NetSeer` is a lightweight, browser-executed analysis tool for turning raw network-performance logs into readable metrics, smoothed time-series plots, and portable outputs.

The repository contains two self-contained analysis surfaces:

```text
index.html -> upload/download throughput-log processor
ftp.html   -> FTP transfer-time and transfer-speed analyzer
```

Both tools accept pasted text directly in the browser.

They parse the text locally, derive numerical measurements, and present the result through interactive Chart.js visualizations.

The project therefore avoids an ingestion server or database and instead treats the browser as a small analysis workstation:

```text
raw pasted logs
      |
      v
regular-expression parsing
      |
      v
normalization / deduplication / statistics
      |
      v
Chart.js plots + numeric summaries
      |
      v
clipboard / image / CSV output
```

## Main Network Log Processor

`index.html` is titled **Network Log Processor**.

Its expected input format is represented directly in the interface:

```text
2024-01-15 10:30:45 | Download: 1234567 B/s | Upload: 987654 B/s
```

The page provides:

- a multiline log-input area;
- processing status messages;
- separate upload and download views;
- an averaging-window control;
- chart color selection;
- editable chart title;
- chart-to-clipboard output;
- PNG chart output;
- processed CSV output.

The whole pipeline runs client side.

## Log Parsing

### Regular-expression extraction

The parser matches:

- full date and time;
- `HH:MM:SS`;
- download bytes per second;
- upload bytes per second.

It iterates through all regex matches in the pasted content and turns each line into a structured JavaScript object.

### Explicit field correction

A repository-specific rule intentionally swaps the two speed fields:

```text
Download in source log -> upload in processed data
Upload in source log   -> download in processed data
```

The source comments explicitly identify this as a requirement.

This is significant because the application is not merely graphing source text verbatim; it contains domain-specific normalization logic for the format being analyzed.

## Time Normalization

The first valid entry becomes the temporal reference point.

`parseTimeToSeconds` converts `HH:MM:SS` into seconds.

For every record, the application computes:

```text
cumulativeTime = currentTimeSeconds - t0
```

The chart can therefore use experiment-relative elapsed time rather than absolute wall-clock labels.

This is well suited to comparing network runs that start at different times.

## Throughput Unit Conversion

The source speed values are parsed in bytes per second.

The application converts them to MiB-style megabytes per second using:

```text
value / (1024 * 1024)
```

The chart and CSV export therefore work with a higher-level throughput unit.

## Upload / Download Mode Separation

The results interface contains two tabs:

- Upload Speed
- Download Speed

A `currentMode` state variable determines which processed series is rendered.

Changing tabs regenerates the chart from the same parsed dataset.

This keeps ingestion separate from presentation mode.

## Moving-Average Smoothing

The application exposes an averaging window between 1 and 50 points.

When the window is greater than one, `applyMovingAverage` creates a new plotted series.

For each point it:

1. finds the bounded start of the trailing window;
2. sums values from that window;
3. divides by the number of values present;
4. copies the original point;
5. replaces the selected metric with the smoothed value.

The use of a partial window at the beginning avoids discarding the early observations.

The chart title also reflects the active moving-average window when a custom title has not replaced it.

## Chart.js Visualization

The network processor creates a Chart.js line chart.

Its visualization uses:

- elapsed seconds on the x axis;
- selected upload/download MB/s on the y axis;
- point radius zero for a continuous trace;
- configurable line/background color;
- hover tooltips with formatted throughput;
- tooltip time converted back into hours, minutes, and seconds.

The plot is rebuilt when relevant presentation state changes.

## Editable Presentation Metadata

The chart title itself is interactive.

Clicking the title exposes a text input.

On blur or Enter, the edited title is saved as `customTitle` and subsequently used when the chart is regenerated.

This makes the utility suitable for preparing plots for reports or presentations rather than only exploratory viewing.

## Chart Color Controls

The interface exposes several predefined chart palettes.

Selecting a color updates both line and fill values and rerenders the chart.

This is a small feature, but it shows that presentation customization is part of the tool's intended workflow.

## Copy-to-Clipboard Workflow

The chart can be copied directly as PNG image data.

The code:

1. creates an offscreen canvas;
2. sizes it to the rendered chart;
3. paints a white background;
4. draws the chart canvas onto it;
5. converts the result to a PNG blob;
6. writes the blob through `navigator.clipboard.write` and `ClipboardItem`.

The explicit white-background step avoids a transparent canvas becoming visually unsuitable when pasted into a document with a different background.

The code reports success or failure through the page's status component.

## PNG Export

The image-download path uses a similar offscreen-canvas approach.

The rendered chart is composited over white and converted to a PNG data URL.

A temporary anchor is assigned a mode-specific filename such as:

```text
upload-speed-chart.png
download-speed-chart.png
```

and programmatically triggered.

## Processed CSV Export

The network processor creates a CSV with:

```text
Time,CumulativeTime,Download (MB/s),Upload (MB/s)
```

Every parsed record is serialized into this normalized format.

A Blob is then handed to FileSaver.js.

The application therefore supports both visual output and machine-readable processed data.

## FTP Log Analyzer

`ftp.html` is a second, separately focused browser tool titled **FTP Log Analyzer**.

Its expected log shape is:

```text
Transfer completed=1 seconds=670.199 bytes=1000000000
```

The analyzer extracts:

- completion flag;
- transfer duration;
- transferred byte count.

It then turns repeated FTP-transfer log output into descriptive statistics and two chronological plots.

## FTP Entry Parsing

Each nonempty input line is examined for three regular-expression fields:

```text
completed=
seconds=
bytes=
```

A record is accepted when all three are present.

Numeric strings are converted into JavaScript integer/float values.

The raw source line is also retained in the structured entry.

## Duplicate Removal

The FTP analyzer creates a key from:

```text
completed + seconds + bytes
```

and stores records in a `Map`.

The resulting values form a set of unique transfer observations.

This prevents exact repeated lines from inflating the aggregate statistics.

## Completed-Transfer Filtering

Statistical calculations operate on entries with:

```text
completed === 1
```

This prevents incomplete transfer observations from being treated as successful throughput samples.

The UI separately reports the count of completed entries.

## Transfer-Time Statistics

For completed unique transfers, the tool computes:

- arithmetic mean transfer time;
- population variance;
- population standard deviation.

These values are surfaced in summary cards.

## Transfer-Speed Derivation

The FTP analyzer derives each run's throughput as:

```text
(bytes / 1,000,000) / seconds
```

The use of decimal megabytes here is distinct from the `1024 * 1024` conversion in `index.html`.

For the completed run set, the page computes:

- average MB/s;
- speed variance;
- speed standard deviation.

This turns raw duration/byte logs into directly comparable performance measurements.

## Chronological FTP Plots

Two Chart.js line charts are produced:

1. Transfer Time by run
2. Transfer Speed by run

The run order follows the order of the unique completed entries.

This preserves the observation sequence for experiment-to-experiment variation.

## Sorted FTP Result View

A separate textual result block sorts the unique observations by transfer duration.

Each completed transfer is presented as:

```text
<seconds> seconds (<size> MB) -> <speed> MB/s
```

The page therefore gives both chronological visualization and a duration-sorted comparison view.

## Evolution Across the Repository History

The repository has a longer development span than its small file count initially suggests.

### Initial logger

The first implementation appeared in March 2025 as `logger.html`.

### Stable entry point

In May 2025 it was renamed to `index.html`, turning the logger into the primary browser entry point.

### Input-format adaptation

November 2025 commits changed the expected input format.

That is consistent with the explicit field-normalization rule now preserved in the parser.

### Clipboard-centered reporting

A later November commit changed output behavior toward copying the chart to the clipboard.

The current code still also supports file and CSV export.

### FTP analysis

December 2025 introduced `ftp.html`, extending the project from upload/download rate logs to complete FTP-transfer measurements.

### Additional plots

The latest February 2026 commit is titled `Adding plots`.

The current FTP tool contains both transfer-time and transfer-speed Chart.js plots.

The repository history therefore shows a progression from one-purpose log parsing to a small suite of browser analysis views.

## Client-Side Architecture

The application architecture is deliberately direct:

```text
HTML document
  + CSS
  + embedded JavaScript
  + CDN libraries
          |
          v
     browser runtime
```

No server round trip is required for the parsing or statistics shown in the inspected source.

This has practical advantages for experiment logs:

- immediate use;
- no upload step for local data;
- easy portability as a single HTML file;
- direct access to browser canvas and clipboard APIs.

## Technical Stack

### HTML

Each analyzer is a standalone page containing layout, controls, and script.

### JavaScript

JavaScript performs:

- regex parsing;
- data shaping;
- unit conversion;
- time normalization;
- moving averages;
- deduplication;
- descriptive statistics;
- chart state;
- file generation;
- clipboard operations.

### CSS

The pages include their full visual styling without an external build pipeline.

### Chart.js

Chart.js is used for the interactive throughput and FTP line plots.

### FileSaver.js

The main network-log processor uses FileSaver.js for CSV download.

### Clipboard API

The browser Clipboard API is used for direct PNG chart copying.

### Canvas API

Offscreen canvases are used to control exported image background and rasterization.

## Data-Processing Skills Demonstrated

The project concretely demonstrates:

- extracting structured measurements from semi-structured text;
- regex-based parsing;
- handling domain-specific source-field corrections;
- timestamp normalization;
- unit conversion;
- moving-average smoothing;
- duplicate removal;
- completed-observation filtering;
- mean and standard-deviation calculation;
- derived throughput calculation;
- chronological and sorted views.

## Visualization Skills Demonstrated

The repository shows:

- time-series plotting;
- dynamic metric selection;
- dynamically computed labels;
- tooltip formatting;
- plot customization;
- report-oriented chart export;
- multiple coordinated plot types for the same experiment set.

## Network-Analysis Skills Demonstrated

The data models are tied directly to network experiments.

The application understands and transforms:

- upload speed;
- download speed;
- FTP transfer completion;
- transfer duration;
- transferred bytes;
- derived MB/s.

This makes `NetSeer` more specific than a generic CSV charting page.

## Engineering Practices Evidenced

### Single-file portability

Each analyzer packages its UI and processing logic into one transportable HTML file.

### Explicit validation feedback

Both tools validate the input before rendering results and surface useful error/status messages.

### Presentation separated from parsed data

The main processor stores `processedData` and then derives chart state from it.

Mode switching and smoothing therefore do not require reparsing the raw logs.

### Reusable derived-state functions

Moving average, chart update, export, status, and parsing are separated into named functions.

### Output reuse

The project supports taking results into another workflow through:

- clipboard image data;
- PNG file;
- CSV data.

## Portfolio Significance

`NetSeer` is evidence of building small tools around the actual friction of technical experimentation.

Instead of manually transforming network logs in a spreadsheet for each run, the repository encodes repeatable rules for parsing, normalizing, smoothing, comparing, and exporting measurements.

Its development across 2025–2026 also shows that the tool was revisited as the shape of the underlying network experiments changed.

The project combines web-development skills with network measurement analysis rather than treating those as separate domains.

# Project Tags

- `html`
- `javascript`
- `css`
- `chart-js`
- `network-log-analysis`
- `network-performance-analysis`
- `throughput-visualization`
- `ftp-log-analysis`
- `ftp-performance-analysis`
- `time-series-visualization`
- `moving-average`
- `regular-expression-parsing`
- `client-side-data-processing`
- `timestamp-normalization`
- `unit-conversion`
- `duplicate-removal`
- `descriptive-statistics`
- `standard-deviation`
- `csv-export`
- `clipboard-api`
- `canvas-api`
- `png-export`
- `filesaver-js`
- `browser-tool`
