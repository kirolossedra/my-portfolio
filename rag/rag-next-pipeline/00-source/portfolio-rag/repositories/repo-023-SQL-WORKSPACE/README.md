# SQL-WORKSPACE

## Repository Identity

- Repository: 023 / 134
- Name: `SQL-WORKSPACE`
- Repository start date: 2023-11-30
- Last meaningful update date: 2023-11-30
- Primary type: SQL metadata-query utility
- Technical field: Relational database inspection
- Collaboration type: `individual-project`
- Primary implementation language: T-SQL

## Collaboration and Authorship Context

The repository contains one commit and one SQL script. The commit is directly attributed to `kirolossedra`, supporting personal attribution of the query artifact.

## Evidence Basis

The repository contains one source file:

- `FIND_COLUMN_DATABASE.sql`.

The commit that adds the file is dated 2023-11-30 and contains the complete query.

## What This Project Is

`SQL-WORKSPACE` is a focused T-SQL workspace containing a schema-discovery query for Microsoft SQL Server.

The script searches SQL Server's system catalog to identify columns and their owning tables according to name patterns.

The artifact is small, but it is concrete database-engineering evidence because it works against metadata tables rather than application-domain rows.

## Query Purpose

The script selects:

- table name;
- column name.

It reads from:

- `sys.tables`;
- `sys.columns`.

The tables are joined through the shared `object_id`.

The query then filters:

- column names containing `Fulfill`;
- table names containing `SME`.

Results are ordered by table and column name.

## Architecture and Query Shape

```text
SQL Server database
      ↓
sys.tables
      ├── object_id ──┐
      ↓               │
table metadata        │
                      │ JOIN
sys.columns           │
      ├── object_id ──┘
      ↓
column metadata
      ↓
LIKE filters
      ↓
table-name + column-name result set
```

This is schema introspection rather than business-row querying.

## Technical Stack

### T-SQL

The file uses SQL Server-specific conventions including:

- `USE <database>`;
- `GO`;
- `sys.tables`;
- `sys.columns`.

### SQL Server System Catalog

The query directly inspects metadata exposed by SQL Server system views.

### Relational Join

`sys.tables` and `sys.columns` are joined through `object_id`, connecting each column to its owning table.

## Major Engineering Work

### Schema Discovery

The script answers a practical metadata question: find database columns matching one naming pattern while restricting results to tables matching another naming pattern.

This is useful in a large or unfamiliar schema where manually opening every table would be inefficient.

### Pattern-Based Metadata Filtering

`LIKE '%Fulfill%'` and `LIKE '%SME%'` provide partial-name discovery rather than requiring exact identifiers.

### Ordered Inspection Output

The result set is ordered by table and column names so discovery output is easier to inspect.

## Engineering Practices

### Metadata-First Database Inspection

The script uses SQL Server's own catalog views instead of hard-coded lists of table/column names.

### Narrow Query Scope

The query isolates exactly the metadata fields needed for inspection.

### Reusable Search Pattern

The database name and `LIKE` patterns can be changed to reuse the script for other schema-discovery tasks.

## Scale and Complexity

The repository is one 16-line SQL utility.

Its value is not implementation volume but the evidence of working directly with database schema metadata and SQL Server catalog structure.

## Skills Demonstrated

### SQL

- **T-SQL — strong direct evidence.**
- **SELECT queries — strong evidence.**
- **INNER JOIN — strong evidence.**
- **LIKE pattern matching — strong evidence.**
- **ORDER BY — strong evidence.**

### Database Engineering

- **SQL Server system catalog inspection — strong evidence.**
- **Schema introspection — strong evidence.**
- **Table/column metadata discovery — strong evidence.**

## Capability Developed

This repository introduces direct database-schema introspection into the processed corpus.

The engineering focus is not CRUD behavior; it is learning how to ask the database engine about its own structure.

## Portfolio Evolution Context

This is the earliest observed occurrence in the processed corpus so far of:

- T-SQL;
- Microsoft SQL Server system catalog access;
- schema introspection through `sys.tables` and `sys.columns`;
- database metadata discovery.

## Historical Significance

`SQL-WORKSPACE` is small but historically important because it marks the first direct SQL/database-engineering artifact in the processed chronology.

It establishes a baseline for later relational-database work where SQL becomes part of larger backend systems.

## Overall Repository Narrative

`SQL-WORKSPACE` is a single-purpose T-SQL metadata tool.

It switches to a target SQL Server database, joins the system table and column catalogs, filters table and column names by partial patterns, and returns an ordered schema-discovery result.

The repository provides concise but direct evidence of SQL Server catalog querying and schema inspection.

# Project Tags

## Project Type

- `sql-utility`
- `database-tooling`
- `developer-tooling`

## Collaboration and Authorship

- `individual-project`

## Languages

- `tsql`
- `sql`

## Database and Data

- `sql-server`
- `schema-introspection`
- `system-catalog-query`
- `metadata-query`
- `relational-join`
- `like-pattern-matching`

## Portfolio Significance

- `earliest-observed-tsql`
- `earliest-observed-sql-server`
- `earliest-observed-schema-introspection`
