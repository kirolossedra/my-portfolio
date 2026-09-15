# Repository 066 — Data-Warehouse

## Repository Identity

- **Repository:** `kirolossedra/Data-Warehouse`
- **Repository start date:** 2024-10-20
- **Last meaningful update date:** 2024-10-20
- **Latest meaningful commit:** `97942093d4d2f59d9103e9f6c6ee094e0691c37f`
- **Primary technical field:** data warehousing, analytical SQL, and warehouse data quality
- **Primary database:** PostgreSQL
- **Project context:** individual data-engineering coursework
- **Collaboration classification:** `individual-coursework`

## Evidence Basis

The repository contains four substantial learning artifacts:

- `Checking quality of warehouse.md`;
- `Final Project.md`;
- `final lap.md`;
- `querying the data warehouse.md`.

The content covers:

- dimensional warehouse modeling;
- PostgreSQL schema creation;
- fact and dimension tables;
- CSV loading;
- aggregation;
- grouping sets;
- rollups;
- cubes;
- materialized views;
- data-quality checks.

The source has course/lab characteristics, so the corpus treats it as completed learning and exercised SQL rather than claiming original invention of the assignments or supplied testing framework.

## Business Scenario

The final project uses a consumer-electronics retail scenario.

The target reporting questions include:

- sales revenue by year and city;
- sales revenue by month and city;
- sales revenue by quarter and city;
- sales by product category;
- category performance by city;
- category performance by store.

This is important because it gives the warehouse a decision-support purpose rather than treating dimensional schemas as abstract database exercises.

## Warehouse Design

The repository explicitly separates descriptive dimensions from measurable events.

## Date Dimension

An initial design includes:

- `dateid`;
- year;
- month;
- month name;
- day;
- weekday;
- weekday name.

A later load schema expands that to include:

- quarter;
- quarter name.

## Product Dimension

The product dimension separates product identity/type from transaction facts.

## Customer-Segment Dimension

The customer-segment dimension provides a categorical axis for slicing sales.

In the loaded version it maps segment identity to city.

## Sales Fact Table

The fact table centralizes:

- sales identity;
- date identity;
- product identity;
- segment identity;
- price per unit;
- quantity sold.

Foreign keys connect facts to dimensions.

## Star-Schema Shape

The resulting model is conceptually:

```text
           DimDate
              |
              |
DimProduct — FactSales — DimCustomerSegment
```

`FactSales` contains measures and foreign keys.

Dimension tables provide descriptive context.

This is the core dimensional-modeling pattern of the repository.

## PostgreSQL Schema Work

The repository includes SQL such as:

```sql
CREATE TABLE DimDate (
    Dateid INT PRIMARY KEY,
    date DATE NOT NULL,
    Year INT NOT NULL,
    Quarter INT NOT NULL,
    QuarterName VARCHAR(2) NOT NULL,
    Month INT NOT NULL,
    Monthname VARCHAR(255) NOT NULL,
    Day INT NOT NULL,
    Weekday INT NOT NULL,
    WeekdayName VARCHAR(255) NOT NULL
);
```

and:

```sql
CREATE TABLE FactSales (
    Salesid VARCHAR(255) PRIMARY KEY,
    Dateid INT NOT NULL,
    Productid INT NOT NULL,
    Segmentid INT NOT NULL,
    Price_PerUnit DECIMAL(10, 2) NOT NULL,
    QuantitySold INT NOT NULL,
    FOREIGN KEY (Dateid) REFERENCES DimDate(Dateid),
    FOREIGN KEY (Productid) REFERENCES DimProduct(Productid),
    FOREIGN KEY (Segmentid) REFERENCES DimCustomerSegment(Segmentid)
);
```

This demonstrates relational enforcement inside a dimensional model.

## Data Loading

The project loads dimension and fact data from CSV files through pgAdmin.

The workflow is:

```text
design tables
  ↓
create PostgreSQL schema
  ↓
import dimension CSVs
  ↓
import fact CSV
  ↓
inspect sample rows
  ↓
run analytical queries
```

## Analytical SQL

The repository moves beyond ordinary `GROUP BY`.

## Grouping Sets

A grouping-set query calculates totals across different dimensions from one statement.

This supports multiple aggregation levels without writing separate queries for every slice.

## ROLLUP

`ROLLUP` is used for hierarchical subtotal/grand-total output, such as:

```text
year
  ↓
city
  ↓
product
```

## CUBE

`CUBE` is used to generate combinations across dimensions.

The important concept is multidimensional aggregation rather than one fixed grouping.

## Materialized Views

The repository creates materialized views to persist precomputed analytical results.

Examples include:

```text
countrystats
```

and:

```text
max_sales
```

The repository also practices:

```sql
REFRESH MATERIALIZED VIEW countrystats;
```

This introduces the tradeoff between query-time computation and stored/precomputed analytical data.

## Warehouse Querying Workflow

The warehouse-querying artifact includes:

- joins from facts to dimensions;
- aggregation of billed/sales amounts;
- `GROUPING SETS`;
- `ROLLUP`;
- `CUBE`;
- materialized views;
- materialized-view refresh.

This is a recognizable OLAP-style analytical SQL workflow.

## Data Quality

A separate artifact focuses specifically on warehouse data quality.

That separation matters: building the warehouse is not treated as the final step.

The repository also checks whether the data satisfies expected properties.

## Data-Quality Framework

The lab downloads a supplied Python framework and support files.

Dependencies include:

- `psycopg2`;
- Pandas;
- `tabulate`.

The learner then configures and runs specific checks.

The framework itself is instructional/supplied and should not be claimed as original infrastructure.

## Null Checks

A test is created to ensure a target column does not contain null values.

Example target:

```text
DimMonth.year
```

## Range Checks

A min/max test validates values such as quarter:

```text
1 <= quarter <= 4
```

## Valid-Value Checks

The repository validates categorical membership, for example:

```text
Q1
Q2
Q3
Q4
```

## Duplicate Checks

A uniqueness-oriented data-quality test checks duplicate customer identifiers.

## Data-Quality System Shape

```text
PostgreSQL warehouse
  ↓
Python database connector
  ↓
test definitions
  ├─ null checks
  ├─ min/max checks
  ├─ valid-value checks
  └─ duplicate checks
  ↓
generated quality report
```

## Technical Stack

### Database

- PostgreSQL
- pgAdmin
- SQL

### Data Warehousing

- star schema
- fact tables
- dimension tables
- foreign keys
- dimensional modeling

### Analytical SQL

- joins
- aggregation
- grouping sets
- rollup
- cube
- materialized views

### Data Quality

- Python
- psycopg2
- Pandas
- tabulate
- rule-based data checks

### Data Format

- CSV

## Testing and Verification

The data-quality portion is itself a form of verification.

The repository practices explicit checks for:

- completeness;
- ranges;
- allowed categories;
- duplicates.

The course framework then generates a report of test statuses.

For the schema/query work, validation is exercise-driven through SQL execution and sample-result inspection.

## Engineering Discipline

### Separation of Fact and Dimension Concerns

Measures are separated from descriptive entities.

### Referential Integrity

Fact rows reference dimensions with foreign keys.

### Query Optimization Awareness

Materialized views are introduced for reusable analytical outputs.

### Data Quality as a Pipeline Concern

The repository explicitly treats quality checking as a repeatable process, not an informal visual inspection.

### Multiple Aggregation Levels

The analytical model supports summary views at different dimensional grains.

## Product Engineering Context

The retail scenario makes the warehouse useful for business intelligence.

Stakeholders could ask questions such as:

- which cities generate the most revenue;
- how categories perform over time;
- how sales change quarterly;
- where product performance differs.

The repository therefore connects SQL/data modeling to business reporting.

## Scale and Complexity

No production row-count or runtime scale is demonstrated.

The conceptual scale is broader than a transactional database lab because the system contains:

- multiple dimension tables;
- a central fact table;
- bulk data loading;
- analytical joins;
- multidimensional aggregations;
- precomputed views;
- automated quality rules.

## Skills Demonstrated

### Data Modeling

- dimensional modeling;
- star schema;
- facts;
- dimensions;
- surrogate/identifier keys;
- foreign-key relationships.

### PostgreSQL

- DDL;
- primary keys;
- foreign keys;
- imports;
- analytical queries;
- materialized views.

### Analytical SQL

- `GROUPING SETS`;
- `ROLLUP`;
- `CUBE`;
- aggregate functions;
- multidimensional reporting.

### Data Quality

- completeness checks;
- valid-range checks;
- valid-value checks;
- duplicate checks;
- report generation.

## Capability Developed

This repository develops the ability to design data for analysis rather than only for transactional correctness.

Earlier relational repositories focused on normalized structures and operational database use.

Here the model is deliberately denormalized around analytical dimensions and measures.

The second major lesson is that a warehouse needs explicit quality gates if analytical results are to be trustworthy.

## Portfolio Evolution Context

Repository 065 introduces data movement through Airflow and Kafka.

Repository 066 provides a destination architecture for analytical data:

```text
ingestion / orchestration
  ↓
warehouse
  ↓
quality checks
  ↓
multidimensional analysis
```

Within the processed chronology, this is the earliest strong evidence of:

- data-warehouse design;
- star schemas;
- fact and dimension tables;
- `GROUPING SETS`;
- `ROLLUP`;
- `CUBE`;
- materialized views;
- warehouse-specific data-quality checks.

## Historical Significance

This repository completes a concentrated October 2024 data-engineering arc.

The portfolio moves from:

- shell processing;
- databases;
- ETL orchestration;
- streaming;

into:

- dimensional storage;
- analytical querying;
- data quality.

That is a meaningful broadening from coding exercises to a simplified data-platform lifecycle.

## Authorship and Evidence Boundary

The lab text and testing framework are instructional.

The corpus attributes:

- executed/practiced schema design;
- SQL exercises;
- configured quality tests;
- warehouse concepts;

at coursework scope.

It does not claim authorship of the supplied Python micro-framework or source datasets.

## Overall Repository Narrative

`Data-Warehouse` is a structured data-engineering coursework repository that connects business reporting requirements to dimensional modeling, PostgreSQL, analytical SQL, materialized views, and repeatable data-quality checks.

Its strongest contribution is completeness of the warehouse lifecycle: model, load, query, optimize, and verify.

# Project Tags

## Project Type

- `individual-coursework`
- `data-engineering-coursework`
- `data-warehouse-lab`
- `business-intelligence-foundations`

## Data Warehousing

- `data-warehouse`
- `dimensional-modeling`
- `star-schema`
- `fact-table`
- `dimension-table`
- `fact-sales`
- `foreign-keys`

## Database

- `postgresql`
- `pgadmin`
- `sql`
- `csv-import`

## Analytical SQL

- `grouping-sets`
- `sql-rollup`
- `sql-cube`
- `materialized-view`
- `aggregation`
- `olap-style-querying`

## Data Quality

- `warehouse-data-quality`
- `null-check`
- `range-check`
- `valid-value-check`
- `duplicate-check`
- `quality-report`
- `psycopg2`

## Business Domain

- `retail-analytics`
- `sales-analytics`
- `business-reporting`

## Portfolio Significance

- `earliest-observed-data-warehouse`
- `earliest-observed-star-schema`
- `earliest-observed-fact-table`
- `earliest-observed-dimension-table`
- `earliest-observed-grouping-sets`
- `earliest-observed-sql-rollup`
- `earliest-observed-sql-cube`
- `earliest-observed-materialized-view`
- `earliest-observed-warehouse-data-quality`