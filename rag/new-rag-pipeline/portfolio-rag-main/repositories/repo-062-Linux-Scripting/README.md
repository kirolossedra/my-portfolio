# Repository 062 — Linux-Scripting

## Repository Identity

- **Repository:** `kirolossedra/Linux-Scripting`
- **Repository start date:** 2024-10-19
- **Last meaningful update date:** 2024-10-20
- **Latest meaningful commit:** `eb428e88a77b7b6719c256d7ed4db3a0d1b2cee8`
- **Primary technical field:** Linux shell scripting and data-engineering command-line workflows
- **Primary environment:** Bash / Unix-like shell
- **Project context:** individual coursework and hands-on command-line exercises
- **Collaboration classification:** `individual-coursework`

## Evidence Basis

The repository contains a sequence of Markdown exercise records covering:

- basic shell scripting;
- executable permissions and shebangs;
- variables and user input;
- conditional control flow;
- arithmetic;
- arrays and loops;
- CSV parsing;
- command-line text processing;
- cron scheduling;
- network inspection and connectivity checks;
- file transfer with `curl` and `wget`.

The final repository tree contains instructional Markdown rather than a packaged shell application.

The repository is therefore evidence of practiced shell workflows and completed course exercises, not evidence of a deployed automation service.

## Repository Structure

The inspected tree includes:

- `scripting.md`;
- `Advanced Scripting.md`;
- `crono.md`;
- `networking.md`;
- `text wrangling.md`;
- `Weather.md`;
- `exercise1.md`;
- `excercise2.md`;
- `practice.md`;
- root `README.md`.

Commit history also shows that `exercise1` was first created as `exercise1.bash` and later renamed to Markdown.

That history is useful because it shows the repository was used as an evolving learning workspace rather than created only as a static notes dump.

## Shell Script Construction

### User Input and Variables

The basic exercises create shell scripts that prompt for user input with:

```bash
read name
```

and interpolate variables into output:

```bash
echo "Welcome $name"
```

A later exercise separately reads first and last names:

```bash
read firstname
read lastname
echo "Hello $firstname $lastname"
```

This establishes direct practice with shell variables and interactive command-line programs.

### Shebangs

The repository explicitly introduces interpreter selection through:

```bash
#!/bin/bash
```

The exercise explains why this allows the script to be executed directly rather than only through an explicit `bash file.sh` invocation.

### File Permissions

Execution permissions are practiced through:

```bash
chmod +x greet.sh
```

and the more narrowly scoped:

```bash
chmod u+x greet.sh
```

This ties scripting to Unix permission semantics rather than treating shell code as isolated syntax.

## Conditional Logic

`Advanced Scripting.md` introduces a binary yes/no prompt and branches with:

```bash
if [[ "$answer" == "yes" ]]; then
    ...
elif [[ "$answer" == "no" ]]; then
    ...
else
    ...
fi
```

The exercise therefore covers:

- string comparisons;
- `if`;
- `elif`;
- `else`;
- user-input validation.

## Arithmetic in Bash

A calculator exercise reads two integers and computes:

```bash
sum=$((first_num + second_num))
product=$((first_num * second_num))
```

It then compares the results with numeric shell operators:

```bash
-gt
-lt
```

The value here is not mathematical complexity; it is using Bash as a small programming language with typed-by-convention numeric expressions and control flow.

## Arrays and Looping

The repository includes a CSV-processing exercise that initializes Bash arrays:

```bash
declare -a column1
declare -a column2
declare -a column3
```

Rows are parsed with:

```bash
while IFS=, read -r col1 col2 col3; do
    ...
done
```

The exercise then iterates array indices:

```bash
for i in "${!column2[@]}"; do
    ...
done
```

and derives a new column from two source columns.

## Shell-Based CSV Transformation

The CSV exercise implements a small data transformation pipeline:

```text
source CSV
  ↓
skip header
  ↓
parse columns
  ↓
store columns in arrays
  ↓
calculate derived difference
  ↓
write report.csv
  ↓
inspect output
```

This is a useful bridge between shell scripting and the data-engineering repositories immediately surrounding it chronologically.

## Text Wrangling

`text wrangling.md` covers a broad Unix text-processing toolbox.

### Inspection

- `cat`
- `more`
- `less`
- `head`
- `tail`

### Statistics

- `wc`
- `wc -l`
- `wc -w`
- `wc -c`

### Ordering and Deduplication

- `sort`
- `sort -r`
- `uniq`

### Search and Filtering

- `grep`

### Column and Character Extraction

- `cut`

Examples include:

```bash
cut -d "," -f2 names_and_numbers.csv
```

and:

```bash
cut -c -2 zoo.txt
```

### Horizontal Combination

The repository practices line-wise combination with:

```bash
paste zoo.txt zoo_ages.txt
```

and CSV-style delimiters with:

```bash
paste -d "," zoo.txt zoo_ages.txt
```

## Cron Scheduling

`crono.md` introduces cron as scheduled command execution.

It explains the five-field crontab structure:

```text
minute hour day-of-month month day-of-week command
```

Examples include daily, hourly, weekly, and monthly jobs.

### Crontab Lifecycle

The repository practices:

```bash
crontab -l
crontab -e
crontab -r
```

That covers inspection, modification, and removal.

### Scheduled Disk-Usage Script

A concrete exercise creates:

```bash
#!/bin/bash
date
df -h
```

and schedules it at midnight:

```bash
0 0 * * * /home/project/diskusage.sh >> /home/project/diskusage.log
```

This adds:

- periodic automation;
- timestamping;
- disk monitoring;
- output redirection;
- append-only logging.

## Networking Commands

`networking.md` exercises operational network inspection.

### Host Identity

```bash
hostname
hostname -i
```

### Interface Inspection

```bash
ifconfig
ifconfig eth0
```

### Connectivity

```bash
ping www.google.com
ping -c 5 www.google.com
```

### HTTP / Remote File Retrieval

```bash
curl <url>
curl -O <url>
wget <url>
```

This demonstrates practical use of shell tools for remote data acquisition.

## System Shape

The repository is best understood as a command-line operations learning workspace:

```text
Linux shell
 ├─ script authoring
 ├─ permissions
 ├─ variables and control flow
 ├─ arrays and loops
 ├─ text processing
 ├─ CSV transformation
 ├─ cron automation
 └─ networking / downloads
```

It is not a single application architecture.

Its architectural value is breadth across the shell environment that later data-engineering and cloud workflows depend on.

## Technical Stack

### Shell and Operating System

- Bash
- Linux / Unix-like command line
- executable permission model
- cron / crontab

### Text Processing

- `grep`
- `cut`
- `paste`
- `sort`
- `uniq`
- `wc`
- `head`
- `tail`

### Networking and Transfer

- `hostname`
- `ifconfig`
- `ping`
- `curl`
- `wget`

### Data Formats

- CSV
- line-oriented text

## Testing and Verification

The repository's verification model is manual and exercise-driven.

Examples instruct the learner to:

- execute scripts;
- inspect terminal output;
- verify permissions with `ls -l`;
- inspect generated CSVs with `cat`;
- verify crontab state with `crontab -l`;
- test network reachability with `ping`.

There is no evidence of an automated shell-test framework in the checked-in tree.

That does not reduce the value of the repository as shell practice, but it defines the verification boundary accurately.

## Engineering Discipline

### Reproducible Command Sequences

The exercises preserve commands in an ordered form that can be replayed.

### Small Feedback Loops

Many workflows follow:

```text
write
  ↓
execute
  ↓
inspect
  ↓
modify
  ↓
execute again
```

### Operational Awareness

The repository connects script code to:

- filesystem permissions;
- process scheduling;
- networking;
- remote resources;
- output files.

### Data Transformation Thinking

Even basic shell exercises are framed as pipelines rather than isolated commands.

## Product Engineering Context

This repository is not a product.

Its value is infrastructural: it strengthens the command-line layer required to operate data pipelines, databases, cloud environments, and automation systems.

That becomes particularly relevant in the next repositories, which move directly into database administration, Airflow, Kafka, and warehousing.

## Scale and Complexity

The source tree is small, but the conceptual breadth is significant.

It covers multiple classes of shell work within approximately one day of repository activity.

The most complex exercise is the CSV transformation script because it combines:

- file reading;
- header handling;
- delimiters;
- arrays;
- iteration;
- arithmetic;
- report generation.

## Skills Demonstrated

### Bash Programming

- shebangs;
- variables;
- input;
- conditional logic;
- arithmetic;
- loops;
- arrays.

### Linux Operations

- executable permissions;
- shell execution;
- redirection;
- filesystem inspection.

### Automation

- cron syntax;
- scheduling;
- periodic logging.

### Text and Data Processing

- filtering;
- field extraction;
- sorting;
- deduplication;
- merging;
- CSV manipulation.

### Networking

- host and interface inspection;
- connectivity testing;
- HTTP retrieval.

## Capability Developed

This repository develops the ability to use Linux as a programmable engineering environment.

The important shift is from "knowing Linux commands" to composing them into repeatable workflows.

That is visible in:

- generated reports;
- scheduled scripts;
- multi-step text processing;
- remote data retrieval.

## Portfolio Evolution Context

Earlier repository 039 `Linux` captured broad Linux command-reference knowledge.

`Linux-Scripting` goes further by concentrating on scripting and automation behavior.

Within the processed chronology, this is the earliest repository dedicated specifically to:

- Bash scripting as a programming workflow;
- cron scheduling;
- shell-based CSV transformation.

This makes it a useful precursor to repository 065, where shell commands become units inside orchestrated Airflow ETL pipelines.

## Historical Significance

The October 2024 sequence shows a clear data-engineering learning arc:

```text
Python / SQL foundations
  ↓
PostgreSQL and database operations
  ↓
Linux scripting and automation
  ↓
Kafka + Airflow ETL
  ↓
data warehousing
```

Repository 062 is the shell/automation bridge in that progression.

## Authorship and Evidence Boundary

The documents have explicit IBM Skills Network instructional language.

The corpus therefore attributes:

- practiced commands;
- completed exercises;
- demonstrated concepts;

but does not claim original authorship of the instructional prose or every supplied code example.

The final tree also stores most code examples inside Markdown rather than as executable `.sh` artifacts.

## Overall Repository Narrative

`Linux-Scripting` is a focused shell-automation learning repository.

It demonstrates moving beyond one-off Linux commands into scripts, conditions, arithmetic, arrays, loops, CSV processing, cron scheduling, text wrangling, and network operations.

Its strongest portfolio value is chronological: it establishes the command-line automation foundation that immediately feeds into the following Kafka, Airflow, and data-warehouse work.

# Project Tags

## Project Type

- `individual-coursework`
- `technical-lab`
- `linux-learning`
- `data-engineering-foundations`

## Languages and Shell

- `bash`
- `shell-scripting`
- `linux`

## Programming Concepts

- `variables`
- `user-input`
- `conditional-statements`
- `arithmetic`
- `arrays`
- `loops`

## Automation

- `cron`
- `crontab`
- `scheduled-tasks`
- `output-redirection`

## Text Processing

- `grep`
- `cut`
- `paste`
- `sort`
- `uniq`
- `wc`
- `head`
- `tail`
- `csv-processing`

## Networking

- `hostname`
- `ifconfig`
- `ping`
- `curl`
- `wget`

## Engineering Practices

- `command-line-workflows`
- `manual-verification`
- `operational-automation`
- `reproducible-command-sequences`

## Portfolio Significance

- `earliest-observed-shell-scripting`
- `earliest-observed-cron`
- `earliest-observed-crontab`