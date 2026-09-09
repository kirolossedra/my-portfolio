# Repository 068 — GCP

## Repository Identity

- **Repository:** `kirolossedra/GCP`
- **Repository start date:** 2024-10-22
- **Last meaningful update date:** 2024-10-22
- **Latest meaningful commit:** `181ac55375ac2691165bcf82ac5b84f4a5a9a8f9`
- **Primary technical field:** Google Cloud troubleshooting and object-storage operations
- **Primary tools:** Google Cloud Shell, Google Cloud Storage, `gcloud storage`, `gsutil`
- **Project context:** individual cloud coursework / troubleshooting record
- **Collaboration classification:** `individual-coursework`

## Evidence Basis

The repository contains one substantial README.

The README is a saved troubleshooting dialogue from a lab named:

```text
An Introduction to Cloud Composer
```

The direct evidence is therefore:

- the user's actual Cloud Shell prompt/output;
- commands attempted;
- error messages;
- troubleshooting paths.

The repository is not evidence of a deployed GCP application or a checked-in Composer DAG.

## Original Problem

The user was working in Google Cloud Shell inside a directory named after a storage bucket.

The shell showed:

```text
dags
```

but:

```bash
cd dags
```

failed with:

```text
-bash: cd: dags: Not a directory
```

This is the key technical clue.

## Filesystem vs Object Storage

The troubleshooting distinguishes two different abstractions:

### Local POSIX Filesystem

Normal commands such as:

```bash
cd
ls
```

operate on local filesystem objects.

### Google Cloud Storage

Cloud Storage uses buckets and objects referenced with URIs such as:

```text
gs://bucket-name/object-prefix/
```

A storage "folder" is commonly represented by object-name prefixes rather than a true POSIX directory.

That explains why seeing `dags` in one context does not automatically mean it is a local directory that `cd` can enter.

## Failed Copy Attempt

The recorded command was:

```bash
gcloud storage cp \
  gs://cloud-training/datawarehousing/lab_assets/hadoop_tutorial.py \
  us-west1-highcpu-59d0d12f-bucket/dags
```

The destination is written like a local path rather than an explicit Cloud Storage URI.

## Alternative Storage Command

The troubleshooting proposes:

```bash
gsutil cp \
  gs://cloud-training/datawarehousing/lab_assets/hadoop_tutorial.py \
  gs://us-west1-highcpu-59d0d12f-bucket/dags/
```

The important difference is the destination:

```text
gs://...
```

That makes the target unambiguously a Cloud Storage bucket/object prefix.

## Storage Inspection

The notes also discuss using:

```bash
gsutil ls gs://<bucket>/
```

and:

```bash
gsutil ls gs://<bucket>/dags/
```

to inspect Cloud Storage directly.

## IAM Awareness

The troubleshooting considers whether the failure might be related to permissions.

It mentions:

- IAM roles;
- Storage Object Viewer;
- Storage Object Admin;
- bucket permissions;
- IAM Policy Troubleshooter.

However, the repository does not prove that IAM was the actual root cause.

The concrete shell evidence more directly exposes a path/abstraction mismatch.

For that reason, IAM is recorded as troubleshooting awareness rather than a confirmed diagnosis.

## Cloud Composer Context

The README says the issue occurred during a lab called:

```text
An Introduction to Cloud Composer
```

This establishes Cloud Composer as learning context.

The repository does not contain:

- a Composer environment definition;
- an Airflow DAG;
- Terraform;
- deployment configuration.

Cloud Composer therefore remains a context tag rather than an implemented system capability.

## Technical Stack

### Google Cloud

- Google Cloud Platform
- Google Cloud Shell
- Google Cloud Storage
- Cloud Composer lab context

### CLI

- `gcloud storage`
- `gsutil`
- Bash shell

### Cloud Concepts

- bucket/object addressing;
- `gs://` URIs;
- object prefixes;
- IAM troubleshooting awareness.

## Testing and Verification

Verification in the repository is interactive.

The suggested checks include:

```bash
gsutil ls
```

to verify storage visibility and:

```bash
gsutil cp
```

to retry the transfer using explicit Cloud Storage paths.

There is no automated verification or infrastructure-as-code.

## Engineering Discipline

### Read the Error Literally

The key diagnostic message is:

```text
Not a directory
```

rather than simply assuming an authorization failure.

### Distinguish Abstractions

The repository captures an important cloud-operations principle:

> a cloud object-storage namespace is not the same thing as a local filesystem hierarchy.

### Use Fully Qualified Resource Identifiers

Explicit `gs://` paths reduce ambiguity about whether a command targets local disk or Cloud Storage.

### Separate Hypothesis From Root Cause

IAM is considered, but the evidence does not justify declaring it the confirmed cause.

## Product Engineering Context

This is not a product repository.

Its value is operational and conceptual.

Understanding the difference between local files and cloud object storage is foundational for:

- data pipelines;
- cloud ETL;
- model/data artifact movement;
- workflow orchestration.

## Scale and Complexity

The repository is small and contains no application code.

Its technical significance comes from the troubleshooting scenario rather than source-code volume.

The problem crosses:

- shell semantics;
- cloud storage;
- CLI syntax;
- permissions concepts;
- managed workflow context.

## Skills Demonstrated

### Google Cloud Storage

- bucket URI syntax;
- object/prefix navigation;
- object copy operations.

### Cloud Shell

- command execution;
- interpreting filesystem errors;
- differentiating local and remote namespaces.

### GCP CLI

- `gcloud storage cp`;
- `gsutil ls`;
- `gsutil cp`.

### Cloud Troubleshooting

- path diagnosis;
- resource identification;
- permission hypothesis;
- command fallback.

## Capability Developed

This repository develops a practical cloud-operations mental model.

The key lesson is that cloud resources often expose abstractions that resemble local resources without behaving identically.

Correctly distinguishing those abstractions prevents a large class of path, copy, and permissions mistakes.

## Portfolio Evolution Context

The preceding repositories focus on:

- shell scripting;
- databases;
- Airflow;
- Kafka;
- data warehouses.

`GCP` moves those data-engineering foundations into a cloud environment.

Within processed chronology, it is the earliest repository centered specifically on:

- GCP;
- Google Cloud Shell;
- Google Cloud Storage;
- `gsutil`;
- `gcloud storage`;
- Cloud Composer context.

## Historical Significance

This repository is a small but clear cloud-transition marker in the portfolio.

The user's data-engineering learning is no longer exclusively local/lab-server based; it begins to interact with managed cloud storage and workflow tooling.

## Authorship and Evidence Boundary

Most explanatory prose in the README is a saved ChatGPT conversation.

The corpus does not treat that prose as original authored documentation.

The directly attributable evidence is the user's:

- Cloud Shell context;
- failed `cd`;
- attempted `gcloud storage cp`;
- follow-up problem description.

Platform capability is therefore scoped to troubleshooting exposure and practiced commands.

## Overall Repository Narrative

`GCP` is a focused troubleshooting record from a Cloud Composer lab.

Its main engineering lesson is the difference between a local filesystem path and a Google Cloud Storage object prefix, expressed through a real failed copy/navigation workflow and corrected `gs://` storage addressing.

It is modest in size but historically important as the first dedicated GCP repository in the processed portfolio.

# Project Tags

## Project Type

- `individual-coursework`
- `cloud-lab`
- `troubleshooting-log`

## Cloud

- `gcp`
- `google-cloud-platform`
- `google-cloud-shell`
- `google-cloud-storage`
- `cloud-composer-context`

## CLI

- `gcloud-storage`
- `gsutil`
- `bash`

## Cloud Concepts

- `object-storage`
- `bucket`
- `object-prefix`
- `gs-uri`
- `iam-awareness`

## Engineering Practices

- `cloud-troubleshooting`
- `error-driven-debugging`
- `resource-path-disambiguation`
- `hypothesis-vs-evidence`

## Portfolio Significance

- `earliest-observed-gcp`
- `earliest-observed-google-cloud-shell`
- `earliest-observed-google-cloud-storage`
- `earliest-observed-gsutil`
- `earliest-observed-gcloud-storage`
- `earliest-observed-cloud-composer-context`