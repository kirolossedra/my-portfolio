# Tag Ontology Extensions — Repositories 062–068

This file extends the corpus tag vocabulary for concepts first evidenced in repositories 062–068.

The existing ontology and all previous extension/addendum files remain authoritative.

## Shell and Automation

### `shell-scripting`

Evidence that shell commands are composed into executable/programmatic workflows using variables, control flow, loops, arrays, or generated outputs.

First observed in this processed chronology: repository 062 `Linux-Scripting`.

### `cron`

Evidence of Unix cron as a recurring job scheduler.

First observed: repository 062.

### `crontab`

Evidence of creating, listing, editing, or removing user cron schedules.

First observed: repository 062.

### `scheduled-tasks`

Evidence that a command or script is configured to execute according to a time schedule.

### `csv-processing`

Evidence of programmatic or command-line transformation of comma-separated data.

## Transactional SQL

### `stored-procedure`

Evidence of a database-side named procedural routine created with SQL.

First observed in this processed chronology: repository 063 `phpmyadmin`.

### `sql-transaction`

Evidence of an explicit SQL transaction boundary such as `START TRANSACTION`.

First observed: repository 063.

### `rollback`

Evidence of explicit transactional rollback behavior.

First observed: repository 063.

### `sql-exception-handler`

Evidence of database-side exception handling around SQL statements.

First observed: repository 063.

### `transaction-atomicity`

Evidence that several dependent state changes are intentionally treated as one all-or-nothing transaction.

### `schema-level-invariants`

Evidence that domain/state rules are enforced through database constraints such as `CHECK`, `NOT NULL`, or referential constraints rather than only application convention.

## Airflow and Workflow Orchestration

### `apache-airflow`

Evidence of Apache Airflow workflow concepts or implementation.

First observed in this processed chronology: repository 065 `ETL-with-shell-kafka-airflow`.

### `airflow-dag`

Evidence of defining an Airflow Directed Acyclic Graph and its task relationships.

First observed: repository 065.

### `bashoperator`

Evidence of Airflow `BashOperator`-style task orchestration.

First observed: repository 065.

### `pythonoperator`

Evidence of Airflow `PythonOperator` tasks.

First observed: repository 065.

### `workflow-orchestration`

Evidence that independent processing steps are modeled as managed tasks with explicit dependencies, scheduling, or retries.

### `dependency-graph`

Evidence of explicit graph-style execution dependencies rather than only linear ad-hoc script order.

### `retries`

Evidence of configured retry policy for workflow execution.

## Kafka and Streaming

### `apache-kafka`

Evidence of Apache Kafka concepts, commands, or integration.

First observed in this processed chronology: repository 065.

### `kafka-topic`

Evidence of creating, describing, producing to, or consuming from a Kafka topic.

### `kafka-partitions`

Evidence of partitioned Kafka topics and reasoning about partition behavior.

First observed: repository 065.

### `kafka-message-keys`

Evidence of Kafka message keys used for partition routing/order semantics.

First observed: repository 065.

### `kafka-consumer-groups`

Evidence of Kafka consumer groups and group state.

First observed: repository 065.

### `kafka-offsets`

Evidence of inspecting or manipulating Kafka consumer offsets.

First observed: repository 065.

### `event-replay`

Evidence of intentionally re-consuming earlier stream records by changing consumer position.

### `streaming-database-sink`

Evidence of a streaming/event source being consumed and persisted into a database.

First observed: repository 065.

### `event-ordering`

Evidence of reasoning about message ordering guarantees and partition/key effects.

### `kraft`

Evidence of Kafka's KRaft metadata/controller mode.

## Data Warehousing

### `data-warehouse`

Evidence of designing or working with a warehouse intended for analytical/reporting workloads.

First observed in this processed chronology: repository 066 `Data-Warehouse`.

### `dimensional-modeling`

Evidence of organizing analytical data around facts and dimensions.

### `star-schema`

Evidence of a central fact table connected to surrounding dimension tables.

First observed: repository 066.

### `fact-table`

Evidence of an analytical fact table containing measures and dimensional references.

First observed: repository 066.

### `dimension-table`

Evidence of descriptive dimension tables used to slice analytical measures.

First observed: repository 066.

### `grouping-sets`

Evidence of SQL `GROUPING SETS`.

First observed: repository 066.

### `sql-rollup`

Evidence of SQL `ROLLUP` analytical grouping.

First observed: repository 066.

### `sql-cube`

Evidence of SQL `CUBE` analytical grouping.

First observed: repository 066.

### `materialized-view`

Evidence of creating or refreshing a materialized database view.

First observed: repository 066.

### `warehouse-data-quality`

Evidence of explicit repeatable data-quality checks against warehouse data.

First observed: repository 066.

### `null-check`

Evidence of a data-quality rule checking for missing/null values.

### `range-check`

Evidence of a data-quality rule enforcing numeric bounds.

### `valid-value-check`

Evidence of validating categorical values against an allowed set.

### `duplicate-check`

Evidence of detecting duplicate identifiers/values as a data-quality rule.

### `olap-style-querying`

Evidence of multidimensional analytical SQL patterns such as grouping sets, rollups, or cubes.

## Google Cloud

### `gcp`

Evidence of direct interaction with Google Cloud Platform.

First observed in this processed chronology: repository 068 `GCP`.

### `google-cloud-shell`

Evidence of commands executed in Google Cloud Shell.

First observed: repository 068.

### `google-cloud-storage`

Evidence of interacting with Google Cloud Storage buckets or objects.

First observed: repository 068.

### `gsutil`

Evidence of Google Cloud Storage operations through `gsutil`.

First observed: repository 068.

### `gcloud-storage`

Evidence of the `gcloud storage` command family.

First observed: repository 068.

### `object-storage`

Evidence of cloud object storage semantics distinct from a local POSIX filesystem.

### `object-prefix`

Evidence of path-like object-name prefixes in object storage.

### `gs-uri`

Evidence of `gs://bucket/object` resource addressing.

### `cloud-composer-context`

The repository records work occurring in a Google Cloud Composer learning context, but does not itself contain enough implementation evidence to claim a deployed Composer environment or DAG.

First observed: repository 068.

### `iam-awareness`

Evidence that IAM roles/policies are considered as part of cloud troubleshooting. This tag does not itself mean IAM was the confirmed root cause.

## Placeholder / Topic Tags

### `relational-database-administration-topic`

A title/topic marker only. It must not be interpreted as evidence of implemented database-administration work.

### `business-intelligence-topic`

A title/topic marker only.

### `ibm-cognos-topic`

IBM Cognos is named as an intended topic, without sufficient repository evidence to claim hands-on implementation.

### `google-looker-topic`

Google Looker is named as an intended topic, without sufficient repository evidence to claim hands-on implementation.

## Evidence Rule for This Batch

Repositories 064 and 067 are title-only repositories. Their topic tags are intentionally separated from demonstrated-capability tags.

Repositories 062, 065, and 066 contain instructional/course material. Their skills are attributed at coursework/practice scope unless the repository contains direct standalone implementation evidence.

Repository 068 contains a saved troubleshooting conversation. Platform claims are anchored to the user's recorded shell commands and errors, not to the assistant-generated explanatory prose.
