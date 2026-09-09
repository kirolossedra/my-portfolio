# Repository 059 — RDBMS-For-Data-Engineering

## Repository Identity

- **Repository:** `kirolossedra/RDBMS-For-Data-Engineering`
- **Repository start date:** 2024-10-18
- **Last meaningful update date:** 2024-10-19
- **Primary technical field:** relational database design and data engineering
- **Primary implementation language:** SQL
- **Project context:** structured database-learning repository
- **Collaboration classification:** individual learning repository

## Evidence Basis

The current repository contains practical artifacts around:

- relational schema normalization;
- primary keys;
- foreign keys;
- domain/entity/referential integrity;
- `ALTER TABLE`;
- duplicate/key experiments;
- a small Datasette setup note.

The strongest evidence is the SQL itself and the commit sequence, which explicitly records steps such as `2NF`, adding primary keys, trying duplicates, and foreign-key work.

## Repository Structure

```text
RDBMS-For-Data-Engineering/
├── Getting Started with datasette/
│   └── README.md
├── Normalization/
│   ├── BookShop-CREATE-INSERT.sql
│   ├── Alter.sql
│   ├── Key.sql
│   ├── key2.sql
│   ├── TestPK.sql
│   ├── FK.sql
│   └── constraints.md
└── Stored Procedures/
    └── README.md
```

## Relational Schema Construction

`BookShop-CREATE-INSERT.sql` creates a `BookShop` relation containing:

- book ID;
- title;
- author name;
- author biography;
- author ID;
- publication date;
- price.

The script uses explicit relational data types and constraints such as:

```sql
VARCHAR(...)
INTEGER
DATE
DECIMAL(6,2)
CHECK(PRICE_USD > 0)
NOT NULL
```

It then inserts several sample books and executes `SELECT *`.

## Normalization Work

The repository commit history explicitly includes a `2NF` step.

The BookShop exercise separates author-related data from book-related data through author identifiers and related tables.

The corpus therefore treats normalization as implemented learning work rather than a title-only topic.

## Primary Keys

The SQL evolves the schema to add a primary key on `BOOK_ID`.

The repository also contains key-specific exercises and a duplicate-insertion experiment, showing that key semantics were tested rather than only described.

## Referential Integrity

`constraints.md` explains how `AUTHOR_ID` links the book relation to author details.

The document explicitly connects the foreign-key relationship with referential integrity.

## Entity Integrity

The same document explains how primary keys enforce unique, non-null row identity.

## Domain Integrity

The repository connects domain integrity with:

- SQL types;
- length limits;
- date formats;
- `CHECK` constraints;
- `NOT NULL` constraints.

This mapping is grounded in the concrete `CREATE TABLE` definitions.

## DDL and Schema Evolution

Separate SQL artifacts demonstrate schema creation and alteration.

The repository therefore covers both initial DDL and changes applied to an existing relational design.

## Data Population

Sample `INSERT` statements create a realistic small dataset around computer-science books and authors.

This allows the constraints and normalization changes to operate against concrete rows instead of an abstract schema only.

## Datasette Exposure

A dedicated `Getting Started with datasette` section records experimentation with Datasette as a lightweight way to expose/query relational data.

The repository evidence here is narrower than the normalization SQL, so it is treated as tooling exposure rather than a large application.

## Engineering Practices

### Incremental Schema Evolution

Commit messages record stepwise movement from an unnormalized schema toward stronger key and normalization rules.

### Constraint-Oriented Reasoning

The work links schema design to entity, referential, and domain integrity.

### Concrete Validation through Data

Sample data and duplicate/key exercises allow integrity behavior to be observed against actual rows.

### Separation of Concerns

The normalization exercise separates author information from repeated book-level records through identifiers and relational structure.

## Scale and Complexity

The repository is compact, but it covers several core relational concepts through executable SQL:

- DDL;
- DML;
- keys;
- constraints;
- normalization;
- integrity rules;
- schema alteration.

The complexity is conceptual and relational rather than application-scale.

## Skills Demonstrated

### SQL

- `CREATE TABLE`;
- `DROP TABLE IF EXISTS`;
- `INSERT`;
- `SELECT`;
- constraints;
- keys;
- schema alteration.

### Relational Modeling

- primary keys;
- foreign keys;
- normalization;
- entity integrity;
- referential integrity;
- domain integrity.

### Data Engineering Foundations

- schema design;
- data-quality enforcement at database level;
- relational structure refinement.

## Capability Developed

This repository makes database correctness part of the data model itself.

Compared with earlier SQL challenge repositories, the emphasis shifts from answering relational queries toward designing relational structures that prevent invalid states.

## Portfolio Evolution Context

This is the earliest processed repository centered specifically on:

- relational normalization;
- explicit entity/referential/domain integrity reasoning;
- schema design through primary and foreign keys as the central learning objective.

## Overall Repository Narrative

`RDBMS-For-Data-Engineering` is a hands-on relational-modeling repository.

It starts from a BookShop schema, populates it with sample data, then exercises normalization, key constraints, duplicate behavior, schema changes, and written integrity reasoning.

The repository's strongest evidence is not query complexity but disciplined data modeling: making identity, relationships, and valid domains explicit in the database schema.

# Project Tags

## Project Type

- `database-learning-repository`
- `data-engineering-coursework`
- `technical-lab`

## Languages

- `sql`

## Database and Data

- `relational-database`
- `database-normalization`
- `second-normal-form`
- `primary-key`
- `foreign-key`
- `entity-integrity`
- `referential-integrity`
- `domain-integrity`
- `sql-constraints`
- `ddl`
- `dml`
- `schema-evolution`
- `datasette`

## Software Engineering Practices

- `data-integrity`
- `constraint-driven-design`
- `incremental-schema-design`

## Portfolio Significance

- `earliest-observed-database-normalization`
- `earliest-observed-referential-integrity`
- `earliest-observed-domain-integrity`
