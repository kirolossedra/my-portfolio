# Service-Tools

## Repository Identity

- **Repository:** `kirolossedra/Service-Tools`
- **Corpus index:** 101
- **Repository start date:** 2025-12-18
- **Last meaningful update date:** 2025-12-18
- **Latest meaningful commit:** `f629eaa56d606da394a4fe9b2fb832bce750af08`
- **Primary repository language:** Python
- **Project form:** desktop content-retrieval and PowerPoint-generation utility
- **Collaboration classification:** `individual-project`

## Evidence Basis

The repository contains three substantive Python implementations:

- `scrapTheSong.py`;
- `scrappingPpptx.py`;
- `GUI_BASED.py`.

The commit sequence shows a clear same-day evolution:

```text
lyrics retrieval
      ↓
lyrics retrieval + PowerPoint generation
      ↓
fetching/title fixes
      ↓
batch desktop GUI
```

The latest commit is attributed to the repository owner and adds the 383-line GUI implementation.

The external song lyrics retrieved from Genius are input content.

The portfolio engineering evidence is the software that:

- searches;
- retrieves;
- parses;
- cleans;
- structures;
- lays out;
- exports;
- batches;
- presents progress to the user.

## What This Project Is

`Service-Tools` automates a practical content-production workflow.

A user supplies a song search query.

The program finds the corresponding result through Genius, retrieves the lyrics page, extracts structured lyric content, separates bracketed sections, and generates a PowerPoint presentation.

The final version wraps that pipeline in a Tkinter desktop interface capable of processing multiple songs in one run.

The tool therefore converts a repetitive manual workflow into an automated local application.

## Product Workflow

The final GUI exposes this flow:

```text
user enters multiple song queries
            ↓
background worker thread
            ↓
Genius search endpoint
            ↓
selected song result
            ↓
lyrics-page HTTP request
            ↓
BeautifulSoup extraction
            ↓
section parser
            ↓
font-size / layout logic
            ↓
python-pptx presentation generation
            ↓
one .pptx file per song
            ↓
success/failure progress log
```

## Technical Stack

### Python

Python is the implementation language for all three source files.

It coordinates:

- HTTP requests;
- HTML parsing;
- regular expressions;
- presentation generation;
- filesystem output;
- desktop GUI state;
- background threading.

### Requests

The program uses `requests` to retrieve:

- Genius search results;
- song lyric pages.

HTTP errors are caught through `requests.RequestException`.

### Beautiful Soup

`BeautifulSoup` parses HTML and locates lyric containers.

The code supports:

- the `data-lyrics-container="true"` attribute;
- a fallback class pattern matching `Lyrics__Container`.

### Regular Expressions

Regular expressions are used for:

- fallback lyric-container class matching;
- splitting lyrics by bracketed section labels.

### python-pptx

The presentation generator uses:

- `Presentation`;
- `Inches`;
- `Pt`;
- paragraph alignment;
- RGB colors.

This is true programmatic PowerPoint construction rather than static template copying.

### Tkinter

The final interface is implemented with Tkinter.

It includes:

- multi-line song input;
- output-folder configuration;
- generate button;
- scrollable progress log;
- warning dialog;
- completion dialog;
- error dialog.

### Threading

The GUI starts processing in a daemon background thread.

This keeps the long-running retrieval/generation workflow separate from the button event that starts it.

## Search and Retrieval Evolution

### Initial Search-Page Scraping

`scrapTheSong.py` begins with a browser-style search URL.

It URL-encodes the song query, downloads the search page, and scans links until it finds a Genius URL ending in `-lyrics`.

This is direct HTML search-result scraping.

### Structured Genius Search Endpoint

`scrappingPpptx.py` and `GUI_BASED.py` move to:

```text
https://genius.com/api/search/multi
```

The response is parsed as JSON.

The code walks response sections until it finds a song result.

From that result it extracts:

- URL;
- title;
- primary artist in the GUI version.

This is a cleaner structured discovery stage than the initial link scan.

### Lyrics Page Retrieval

After locating the selected song, the program fetches the lyric page separately.

This creates a two-stage retrieval architecture:

```text
structured search
      ↓
song URL
      ↓
HTML lyrics page
```

## HTML Lyrics Extraction

The parser looks for Genius lyric containers.

Primary selector:

```text
div[data-lyrics-container="true"]
```

Fallback selector:

```text
div class matching Lyrics__Container
```

Before extracting text, `<br>` elements are replaced with newline characters.

Multiple containers are joined into one lyrics string.

This preserves line boundaries more effectively than flattening the entire page into plain text.

## Section Parsing

`parse_lyrics_sections()` splits the lyrics using bracketed section markers.

Examples of the structural pattern are:

```text
[Verse]
[Chorus]
[Bridge]
```

The regular expression captures the section name and associates it with the following text.

Only sections with actual content are retained.

The result is a list of:

```text
(section_name, section_text)
```

This intermediate structure is what drives slide generation.

## Text Normalization

The GUI version introduces `clean_text()` for song-title metadata.

It converts text to plain ASCII while dropping characters that cannot be encoded.

The cleaned title and artist are combined into a presentation title.

This is an explicit formatting-normalization decision for downstream PowerPoint output.

## Dynamic Font Sizing

The presentation generator chooses lyric font size according to content length.

The final GUI version uses a more granular range than the earlier script.

Short sections receive larger fonts.

Longer sections progressively receive smaller fonts.

This is a simple layout heuristic intended to make automatically generated slides more usable without manual resizing.

## PowerPoint Generation

### Presentation Geometry

The program creates a new `Presentation` and explicitly configures slide dimensions.

It uses the blank layout for generated slides.

### Title Slide

The first slide contains the song title.

The code configures:

- textbox dimensions;
- centered alignment;
- large bold type;
- text color;
- background fill.

### Lyric Slides

Each parsed section becomes a slide.

The final GUI version uses the parsed section body as the main slide content.

Instead, it uses the section text as the main centered content.

The text frame enables word wrapping.

### Programmatic Styling

The program controls:

- position;
- size;
- alignment;
- font size;
- font color;
- background color.

The generated deck is therefore assembled and styled entirely from code.

### PPTX Persistence

`python-pptx` saves the presentation to disk as `.pptx`.

The standalone script accepts a specified output filename.

The GUI creates one output file per query.

## Safe Output Filenames

For batch generation, the GUI derives filenames from the user's song query.

It keeps:

- alphanumeric characters;
- spaces;
- hyphens;
- underscores.

Spaces are then converted to underscores.

This reduces the chance that arbitrary query punctuation becomes problematic in local filenames.

## Batch Processing

The GUI accepts one song query per line.

It converts the input into a list and processes each song sequentially.

For each query it records either:

- success;
- failure.

At the end it reports aggregate success/failure counts.

This turns the earlier one-song script into a multi-item production utility.

## Output Directory Management

The user can provide an output folder.

If the field is empty, the program falls back to a default directory name.

The application creates the directory when it does not exist.

Each generated presentation is placed inside that folder.

## Desktop User Interface

### Input Surface

The main window contains a scrollable text area pre-populated with example song queries.

The expected interaction is simple: one search phrase per line.

### Processing State

When generation begins:

- the button is disabled;
- its label changes to `Processing...`;
- the existing log area is cleared.

When processing finishes, the button is restored.

### Progress Log

The GUI writes detailed progress messages into a scrollable log.

Messages include:

- which song is being processed;
- whether lyrics were found;
- section count;
- generated output path;
- errors;
- final success/failure totals.

### Dialog Feedback

Tkinter message boxes provide:

- no-input warning;
- completion summary;
- error notification.

This makes the final version meaningfully more productized than the earlier command-line scripts.

## Background Processing

The GUI creates a daemon thread for the batch operation.

The thread runs `process_songs()`.

The reason is visible in the workflow: network requests and PPTX generation can take enough time that doing them directly in the button callback would block the interaction path.

The code therefore separates user-triggered startup from the long-running workload.

## Error Handling

The retrieval functions catch HTTP request errors and return `None`.

`process_single_song()` wraps one song's pipeline in its own exception handling.

This permits the batch to continue after a per-song failure.

The outer batch function also has a top-level exception handler for application-level failures.

This is useful in a multi-item automation tool because one failed retrieval does not need to erase all prior successful work.

## External Content Boundary

The retrieved lyric text comes from Genius pages and is external content.

The repository's software contribution is the retrieval and transformation pipeline around that external content.

The engineered behavior is:

- finding the content;
- extracting it;
- structuring it;
- transforming it;
- generating presentation files from it.

This distinction is important for accurate portfolio attribution.

## Major Engineering Work

### Web Retrieval Pipeline

The project implements a two-stage retrieval flow combining structured search data with HTML-page parsing.

### Resilient Lyrics Extraction

Primary and fallback selectors support more than one observed Genius page structure.

### Structured Text Transformation

Bracketed lyric metadata is converted into a section list suitable for slide generation.

### Automated Presentation Layout

The program converts section length into typography choices and writes styled PowerPoint slides.

### Batch Desktop Workflow

The final version exposes multi-song processing through a desktop UI with background execution and progress reporting.

## Verification and Runtime Feedback

The scripts print or log concrete pipeline milestones.

The final GUI reports:

- retrieval result;
- parsed section count;
- saved filename;
- per-song failure;
- aggregate success count;
- aggregate failure count.

The user can therefore identify where a batch succeeded or failed.

## Engineering Practices

### Incremental Productization

The commit sequence shows a progression from a one-off scraper to a batch desktop tool.

### Functional Decomposition

The final source separates:

- text cleaning;
- song search;
- lyric parsing;
- font sizing;
- presentation generation;
- single-song processing;
- GUI orchestration.

### Failure Isolation

Each song is processed through a function that returns success/failure.

This supports continued batch execution.

### Output Hygiene

The program creates output folders and sanitizes filenames before persistence.

### Responsive Workflow Intent

Long-running batch processing is moved onto a background thread rather than being launched inline from the button handler.

## Product Engineering

The final GUI converts the automation into a direct user workflow.

The GUI replaces per-song source editing with direct multi-query input.

Instead they can:

1. paste multiple queries;
2. choose an output directory;
3. start generation;
4. watch progress;
5. receive a final completion summary.

That is a clear movement from script utility toward a small desktop productivity application.

## Scale and Complexity

The repository is small in file count but integrates several domains:

- HTTP;
- JSON;
- HTML;
- web scraping;
- text parsing;
- presentation generation;
- filesystem management;
- GUI state;
- threading;
- error handling;
- batch processing.

The final GUI source is substantially larger than the initial retrieval script because it owns the complete user workflow.

## Skills Demonstrated

### Python

- functions and decomposition
- exception handling
- filesystem operations
- string normalization
- list processing

### Web Integration

- HTTP GET requests
- query encoding
- JSON search responses
- HTML page parsing
- Beautiful Soup
- DOM selectors

### Text Processing

- regular expressions
- bracketed-section parsing
- newline preservation
- ASCII normalization
- filename sanitization

### Document Automation

- python-pptx
- presentation construction
- slide creation
- text boxes
- font sizing
- alignment
- colors
- background fills
- PPTX export

### Desktop Application Development

- Tkinter
- scrolled text widgets
- buttons
- entry fields
- dialogs
- progress logging
- processing-state UI changes

### Concurrency

- background threads
- daemon worker thread
- long-running GUI task separation

### Workflow Automation

- multi-song batch processing
- output-directory creation
- per-item success/failure handling
- aggregate completion reporting

## Capability Developed

The repository shows a compact productization arc within a single day.

The starting point is a focused scraper.

The middle version connects retrieval to generated PowerPoint output.

The final version wraps the pipeline in a multi-item desktop application.

This demonstrates the ability to recognize a repetitive content-preparation task and successively move it through:

```text
manual coding utility
      ↓
automated output generator
      ↓
user-facing batch tool
```

## Portfolio Evolution Context

Earlier processed repositories include data scraping, document tooling, and desktop interfaces in different contexts.

`Service-Tools` combines those ideas into a concrete productivity workflow: external web content becomes a structured local presentation artifact.

It is also the earliest processed repository so far centered specifically on programmatic PowerPoint generation through `python-pptx`.

## Historical Significance

Within the processed corpus so far, this is the earliest observed repository centered on:

- `python-pptx`;
- automated PowerPoint generation;
- web-retrieved lyric section parsing;
- batch generation through a Tkinter GUI.

The historical significance is the conversion of web content into a reusable presentation-generation product workflow.

## Overall Repository Narrative

`Service-Tools` automates song-lyrics presentation preparation from end to end.

It searches Genius, retrieves the selected lyrics page, extracts lyric containers, parses bracketed sections, chooses typography based on section length, and creates styled PowerPoint slides.

The final version adds a Tkinter desktop UI that accepts multiple song queries, processes them in a background thread, creates one `.pptx` per song, sanitizes output filenames, and reports success or failure through a progress log and dialogs.

The repository's strongest portfolio signal is the workflow engineering around external content: retrieval, parsing, structured transformation, document automation, batching, concurrency, and a usable desktop interaction surface.

# Project Tags

`individual-project`, `python`, `desktop-utility`, `workflow-automation`, `content-automation`, `web-retrieval`, `web-scraping`, `requests`, `beautifulsoup`, `html-parsing`, `json-api-consumption`, `genius-integration`, `lyrics-processing`, `regex-parsing`, `section-parsing`, `text-normalization`, `ascii-normalization`, `filename-sanitization`, `python-pptx`, `powerpoint-generation`, `document-automation`, `pptx-export`, `dynamic-font-sizing`, `programmatic-layout`, `tkinter`, `desktop-gui`, `batch-processing`, `background-threading`, `threading`, `progress-logging`, `error-handling`, `failure-isolation`, `filesystem-output`, `output-directory-management`, `external-content-boundary`, `incremental-productization`, `earliest-observed-python-pptx-workflow`, `earliest-observed-automated-powerpoint-generation`, `earliest-observed-lyrics-to-pptx-desktop-tool`
