# Repository 060 — IBM-Cloud

## Repository Identity

- **Repository:** `kirolossedra/IBM-Cloud`
- **Repository start date:** 2024-10-19
- **Last meaningful update date:** 2024-10-19
- **Primary technical field:** cloud database / IBM Cloud lab work
- **Primary platforms:** IBM Cloud, Db2, IBM Watson ML
- **Project context:** cloud/data-engineering learning repository
- **Collaboration classification:** individual learning repository

## Evidence Basis

The repository contains documented lab artifacts for:

- creating a Db2 service instance;
- creating tables and loading data in Db2;
- exporting Db2 data to CSV;
- saving SQL in the cloud;
- IBM Watson ML exposure.

Most evidence is preserved as screenshots embedded in README files, with supporting text explaining the actions and one checked-in CSV export.

The corpus therefore treats this as cloud-lab execution evidence, not as a production cloud architecture.

## Repository Structure

```text
IBM-Cloud/
├── Create DB2 service instance/
│   └── README.md
├── Create Tables and Load Data in Db2/
│   ├── README.md
│   └── data.csv
└── IBM Watson ML/
    └── README.md
```

## IBM Db2 Service Provisioning

A dedicated section records the creation of a Db2 service instance through IBM Cloud.

The README preserves a sequence of screenshots from the provisioning workflow.

This is direct evidence of navigating the IBM Cloud service lifecycle rather than merely listing Db2 as a technology.

## Table Creation and Data Loading

The larger Db2 README documents a sequence of database operations through screenshots and notes.

The workflow includes creating database tables and working with uploaded or manually entered data.

## SQL Fallback when UI Data Loading Failed

The repository explicitly records that the graphical "load data" option did not work as intended.

The response was to enter the fields using SQL instead.

That is meaningful engineering evidence because the lab did not stop at a UI failure; the workflow fell back to a lower-level database mechanism.

## Creating Additional Tables

The README documents creation of another table as the exercise progressed.

## Saving SQL in the Cloud

The repository notes:

```text
I SAVE THE SQL ON THE CLOUD FOR ROLLBACK
```

This indicates awareness of preserving database work for recovery/reuse rather than treating SQL as disposable session input.

## CSV Export

A CSV produced from Db2 is checked into the repository.

This gives a concrete data artifact alongside the screenshot-based lab record.

## IBM Watson ML

A separate directory records IBM Watson Machine Learning exposure through a preserved screenshot.

The evidence supports platform interaction, but not a larger model-deployment claim because executable deployment code is not present in this repository.

## Engineering Practices

### Operational Fallback

When the data-loading UI failed, SQL was used to continue the task.

### Persistence of Work

SQL was saved in the cloud for rollback/recovery.

### Exported Data Artifact

The resulting CSV is preserved in version control.

### Stepwise Cloud Documentation

The repository acts as an operational notebook, documenting cloud-console actions with screenshots.

## Scale and Complexity

The repository is small in code terms because the work occurs primarily through a managed cloud console.

Its technical value lies in executing a cloud database workflow:

```text
provision service
  ↓
create tables
  ↓
load/enter data
  ↓
use SQL when UI path fails
  ↓
preserve SQL
  ↓
export data
```

## Skills Demonstrated

### Cloud

- IBM Cloud navigation;
- managed database service provisioning;
- cloud-console workflow.

### Databases

- IBM Db2;
- table creation;
- SQL-based data entry;
- database-to-CSV export.

### Operations

- fallback from GUI tooling to SQL;
- preservation of SQL for rollback;
- evidence-oriented lab documentation.

### ML Platform Exposure

- IBM Watson Machine Learning console exposure.

## Capability Developed

This repository adds managed-cloud database operations to the portfolio chronology.

Earlier repositories interact with local SQL engines and SQLite; here the work moves into a hosted database service where provisioning, console tooling, persistence, and export are part of the workflow.

## Portfolio Evolution Context

This is the earliest processed repository with direct evidence of:

- IBM Cloud;
- managed IBM Db2 provisioning;
- cloud-hosted relational database lab work;
- IBM Watson ML platform exposure.

## Overall Repository Narrative

`IBM-Cloud` is a compact operational lab repository documenting hands-on IBM Cloud work.

It shows Db2 service creation, table/data workflows, SQL fallback after a UI import problem, preservation of cloud SQL for rollback, CSV export, and exposure to Watson ML.

Its portfolio value is cloud operations and managed-database experience, not application-scale software engineering.

# Project Tags

## Project Type

- `cloud-lab`
- `data-engineering-coursework`
- `technical-lab`

## Cloud and Infrastructure

- `ibm-cloud`
- `managed-database`
- `cloud-service-provisioning`
- `cloud-console`

## Database and Data

- `ibm-db2`
- `relational-database`
- `sql`
- `table-creation`
- `csv-export`

## Machine Learning Platforms

- `ibm-watson-ml`

## Software Engineering Practices

- `operational-fallback`
- `rollback-awareness`
- `lab-documentation`

## Portfolio Significance

- `earliest-observed-ibm-cloud`
- `earliest-observed-ibm-db2`
- `earliest-observed-watson-ml`
