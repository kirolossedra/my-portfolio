# Repository 065 — ETL-with-shell-kafka-airflow

## Repository Identity

- **Repository:** `kirolossedra/ETL-with-shell-kafka-airflow`
- **Repository start date:** 2024-10-20
- **Last meaningful update date:** 2024-10-20
- **Latest meaningful commit:** `44b2e3c385f10fa968c3d52322716470f86648f1`
- **Primary technical field:** data engineering, workflow orchestration, and event streaming
- **Primary technologies:** Apache Airflow, Apache Kafka, Bash, Python, MySQL
- **Project context:** individual data-engineering coursework and lab documentation
- **Collaboration classification:** `individual-coursework`

## Evidence Basis

The repository contains a relatively broad set of Markdown lab artifacts:

- `Airflow Project/README.md`;
- `Airflow Project/python operator.md`;
- `create dag using bash operator.md`;
- `create_airflow_dag.md`;
- `airflow_examples.md`;
- `airflow_installation_log.md`;
- `starting with kafka.md`;
- `kafka with keys and offsets.md`;
- `kafka with python.md`;
- `KAFKA- Python - msql`;
- `shell.md`.

The final tree does not contain the actual `.py` DAG or producer/consumer files described by the labs.

Capability claims are therefore scoped to practiced coursework, embedded code, and documented execution workflows rather than a checked-in deployable Airflow/Kafka application.

## What the Repository Is

This repository is a compact data-engineering learning system spanning three related areas:

1. shell-oriented ETL;
2. Airflow orchestration;
3. Kafka streaming and database ingestion.

The common theme is moving data through staged, ordered processing rather than manipulating data in isolated scripts.

## Data-Engineering System Shape

The repository contains two major pipeline patterns.

### Batch ETL

```text
remote toll dataset
  ↓
download
  ↓
untar
  ↓
extract CSV ─┐
extract TSV ─┼─> consolidate
fixed width ─┘
  ↓
transform
  ↓
transformed CSV
```

### Streaming Pipeline

```text
toll traffic generator
  ↓
Kafka topic
  ↓
consumer / streaming reader
  ↓
MySQL livetolldata table
```

Airflow supplies orchestration for the batch pipeline; Kafka supplies ordered event transport for the streaming pipeline.

## Shell-Based ETL

The Airflow final-assignment notes define a staging directory:

```text
/home/project/airflow/dags/finalassignment/staging
```

The workflow downloads a compressed toll dataset and then performs extraction with standard Unix tools.

### Archive Extraction

```bash
tar -xvzf .../tolldata.tgz -C .../staging
```

### CSV Field Extraction

```bash
cut -d, -f1,2,3,4 vehicle-data.csv > csv_data.csv
```

### TSV Field Extraction

```bash
cut -f1,2,3 tollplaza-data.tsv > tsv_data.csv
```

### Fixed-Width Extraction

```bash
cut -c1-20,21-40 payment-data.txt > fixed_width_data.csv
```

### Consolidation

```bash
paste -d, csv_data.csv tsv_data.csv fixed_width_data.csv > extracted_data.csv
```

### Transformation

The vehicle-type field is uppercased with:

```bash
tr '[:lower:]' '[:upper:]'
```

This demonstrates classical command-line ETL:

- extract from heterogeneous formats;
- normalize;
- combine;
- transform;
- emit a staged artifact.

## Apache Airflow

The repository introduces Airflow as the workflow controller rather than manually executing each stage.

## DAG Definition

The documented DAG is:

```text
ETL_toll_data
```

with daily scheduling.

Default arguments include:

- owner;
- start date;
- email;
- retries;
- retry delay.

A retry count of one and a five-minute delay are explicitly documented in the PythonOperator version.

## Bash-Oriented DAG

The Bash-based final assignment models tasks for:

- untar;
- CSV extraction;
- TSV extraction;
- fixed-width extraction;
- consolidation;
- transformation.

The intended dependency order is explicit rather than accidental.

## PythonOperator DAG

The Python version goes further by embedding Python functions for:

- downloading the dataset with `requests`;
- extracting the tar archive;
- reading CSV;
- reading TSV;
- parsing fixed-width input;
- consolidating multiple inputs;
- uppercasing vehicle type.

The DAG then maps each function to a `PythonOperator`.

## Parallelizable Extraction Stage

The documented dependency expression is:

```python
download_task >> untar_task >> [
    extract_csv_task,
    extract_tsv_task,
    extract_fixed_width_task
] >> consolidate_task >> transform_task
```

That graph is important.

It models:

```text
download
  ↓
untar
  ↓
 ┌─────────┬─────────┬─────────────┐
 CSV       TSV       fixed-width
 └─────────┴─────────┴─────────────┘
             ↓
         consolidate
             ↓
          transform
```

The extraction tasks can conceptually run independently before convergence.

## Airflow Operational Workflow

The repository documents:

- submitting a DAG;
- listing import errors;
- unpausing;
- manually triggering;
- inspecting tasks;
- inspecting DAG runs.

This is evidence of orchestration lifecycle awareness, not merely knowing the `DAG` class exists.

## Apache Kafka

The second major section introduces Kafka as an event-streaming platform.

## Topic Administration

`kafka with python.md` uses:

```python
KafkaAdminClient
NewTopic
```

to create:

```text
bankbranch
```

with:

- 2 partitions;
- replication factor 1.

The command-line workflow also creates and describes the topic.

## Producers

A Python producer serializes JSON values and sends ATM transaction messages:

```python
producer.send(
    "bankbranch",
    {"atmid": 1, "transid": 100}
)
```

A later interactive producer:

- asks whether another transaction should be added;
- asks for ATM 1 or 2;
- emits transaction IDs incrementally;
- flushes the producer.

## Consumers

A Python consumer subscribes to:

```text
bankbranch
```

with:

```text
auto_offset_reset='earliest'
```

and prints decoded messages.

## Kafka Partitions

The repository explicitly explores message distribution across two partitions.

Without keys, messages are distributed across partitions and global publication order is not guaranteed at consumption.

That becomes the motivation for keyed messages.

## Message Keys

The ATM ID is used as a key.

The repository documents the consequence:

> messages with the same key are routed to the same partition and maintain order within that partition.

This is a meaningful distributed-systems concept, not just Kafka CLI syntax.

## Consumer Groups

A consumer group named:

```text
atm-app
```

is introduced.

The repository practices inspecting group state with:

```bash
kafka-consumer-groups.sh ... --describe --group atm-app
```

## Offsets

Offsets are treated as the consumer's position in a partition's ordered log.

The exercises include:

- inspecting offsets;
- resetting to earliest;
- shifting offsets backward.

### Replay From Beginning

```bash
--reset-offsets --to-earliest --execute
```

### Relative Replay

```bash
--reset-offsets --shift-by -2 --execute
```

That introduces event replay as an operational capability.

## Kafka with KRaft

`KAFKA- Python - msql` documents Kafka 3.7 setup using KRaft.

It generates a cluster UUID:

```bash
KAFKA_CLUSTER_ID="$(bin/kafka-storage.sh random-uuid)"
```

formats storage, and starts the server from KRaft configuration.

This provides exposure to Kafka without ZooKeeper in that lab context.

## Kafka-to-MySQL Streaming Pipeline

The same artifact creates a MySQL database:

```sql
CREATE DATABASE tolldata;
```

with a live table:

```sql
CREATE TABLE livetolldata(
    timestamp datetime,
    vehicle_id int,
    vehicle_type char(15),
    toll_plaza_id smallint
);
```

The workflow then connects:

```text
toll traffic generator
  ↓
Kafka `toll` topic
  ↓
streaming-data-reader.py
  ↓
MySQL `tolldata.livetolldata`
```

The generator and streaming reader are downloaded course assets, so the corpus does not attribute their implementation as original code.

The system integration concepts remain demonstrated coursework.

## Technical Stack

### Orchestration

- Apache Airflow
- DAGs
- BashOperator
- PythonOperator
- scheduling
- retries
- task dependencies

### Streaming

- Apache Kafka
- KRaft
- topics
- partitions
- producers
- consumers
- message keys
- consumer groups
- offsets
- replay

### Programming

- Python
- Bash
- SQL

### Data and Storage

- CSV
- TSV
- fixed-width text
- tar/gzip
- MySQL

### Python Libraries

- `requests`
- `tarfile`
- `csv`
- `kafka-python`
- `mysql-connector-python`

## Testing and Verification

Verification is lab-driven and operational.

### Airflow

The instructions check:

- DAG import errors;
- DAG presence;
- unpaused state;
- triggered runs;
- task visibility;
- run status.

### Kafka

The exercises validate:

- topic creation;
- topic descriptions;
- visible produced/consumed messages;
- partition behavior;
- consumer-group offsets;
- replay behavior.

### MySQL

The streaming exercise expects records to be written to the live toll table.

No repository-level automated test suite is checked in.

## Engineering Discipline

### Explicit Dependency Modeling

Airflow expresses ordering constraints as a graph rather than procedural guesswork.

### Retry Awareness

The DAG configuration includes retry behavior.

### Staging Areas

Intermediate files are written to a dedicated staging directory.

### Format-Specific Extraction

CSV, TSV, and fixed-width formats are treated differently instead of forcing one parser onto all input.

### Event Ordering Awareness

Kafka message keys are introduced specifically to preserve ordering where business semantics need it.

### Replayability

Offset resets show awareness that event streams can be reprocessed.

## Business and Product Context

The labs use two business-flavored domains.

### Toll Operations

The batch and streaming pipelines process vehicle/toll data.

### ATM Transactions

Kafka ordering examples use ATM and transaction identifiers.

These domains make orchestration and ordering requirements concrete.

## Scale and Complexity

This is one of the broader data-engineering learning repositories in the October 2024 sequence.

It spans:

- batch processing;
- event streaming;
- multiple file formats;
- scheduling;
- retries;
- parallel task branches;
- persistent database sinks.

The repository does not prove production scale, but its system topology is materially more distributed than the immediately preceding SQL labs.

## Skills Demonstrated

### Airflow

- DAG construction;
- operator selection;
- dependencies;
- scheduling;
- retries;
- run inspection.

### Kafka

- topic lifecycle;
- partitioning;
- keyed messages;
- producer/consumer model;
- consumer groups;
- offsets;
- replay.

### ETL

- extract heterogeneous formats;
- stage;
- consolidate;
- transform;
- load.

### Streaming Integration

- event generator;
- Kafka broker/topic;
- streaming reader;
- MySQL sink.

### Shell

- `tar`;
- `cut`;
- `paste`;
- `tr`;
- filesystem staging.

## Capability Developed

This repository develops a core systems idea:

> data processing is not just transformation logic; it is also orchestration, ordering, failure handling, state progression, and transport.

The Airflow portion turns scripts into a dependency graph.

The Kafka portion turns messages into a partitioned ordered log with consumer state.

Together they represent a significant jump from isolated data manipulation toward data-platform thinking.

## Portfolio Evolution Context

Repository 062 builds shell automation.

Repository 063 adds failure-safe database transactions.

Repository 065 then combines shell, Python, databases, and orchestration into pipeline systems.

Within processed chronology, this is the earliest strong repository evidence of:

- Apache Airflow;
- Airflow DAGs;
- BashOperator;
- PythonOperator;
- Apache Kafka;
- Kafka partitions;
- Kafka message keys;
- Kafka consumer groups;
- Kafka offsets and replay;
- a Kafka-to-MySQL streaming sink.

## Historical Significance

This repository marks a clear expansion from "data analysis" and "database use" into data infrastructure concepts.

It introduces graph-based workflow orchestration and log-based event streaming in the same repository.

Those ideas are foundational for later backend, fintech, and distributed-system engineering.

## Authorship and Evidence Boundary

The repository has strong IBM/course-lab characteristics.

Several files explicitly present instructions such as "create this file" and provide code to paste.

The final Git tree stores those examples in Markdown and does not retain the runtime `.py` files described by the lab.

The corpus therefore attributes:

- completed/practiced workflow concepts;
- technical understanding represented by the saved exercises;
- system-integration experience at coursework scope;

but not authorship of the supplied toll generator, streaming reader, or instructional scaffold.

## Overall Repository Narrative

`ETL-with-shell-kafka-airflow` is a concentrated data-engineering systems repository.

It moves from shell ETL to Airflow DAGs and then to Kafka topics, partitions, keys, consumer groups, offsets, replay, and MySQL streaming ingestion.

Its strongest portfolio significance is architectural: it is where the portfolio first clearly treats data movement as a system with dependencies and state, not merely as a script that transforms a file.

# Project Tags

## Project Type

- `individual-coursework`
- `data-engineering-coursework`
- `etl-lab`
- `streaming-lab`

## Orchestration

- `apache-airflow`
- `airflow-dag`
- `bashoperator`
- `pythonoperator`
- `task-dependencies`
- `workflow-orchestration`
- `scheduled-workflow`
- `retries`

## Streaming

- `apache-kafka`
- `kraft`
- `kafka-topic`
- `kafka-partitions`
- `kafka-producer`
- `kafka-consumer`
- `kafka-message-keys`
- `kafka-consumer-groups`
- `kafka-offsets`
- `event-replay`

## Data Engineering

- `etl`
- `staging-area`
- `csv`
- `tsv`
- `fixed-width-data`
- `batch-processing`
- `stream-processing`
- `streaming-database-sink`

## Languages

- `python`
- `bash`
- `sql`

## Database

- `mysql`
- `database-ingestion`

## Engineering Practices

- `dependency-graph`
- `failure-retry-awareness`
- `event-ordering`
- `replayability`
- `heterogeneous-data-formats`

## Portfolio Significance

- `earliest-observed-apache-airflow`
- `earliest-observed-airflow-dag`
- `earliest-observed-bashoperator`
- `earliest-observed-pythonoperator`
- `earliest-observed-apache-kafka`
- `earliest-observed-kafka-partitions`
- `earliest-observed-kafka-message-keys`
- `earliest-observed-kafka-consumer-groups`
- `earliest-observed-kafka-offsets`
- `earliest-observed-streaming-database-sink`