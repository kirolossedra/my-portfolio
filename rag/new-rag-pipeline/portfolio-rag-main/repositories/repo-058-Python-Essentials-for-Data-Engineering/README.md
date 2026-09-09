# Repository 058 — Python-Essentials-for-Data-Engineering

## Repository Identity

- **Repository:** `kirolossedra/Python-Essentials-for-Data-Engineering`
- **Repository start date:** 2024-10-18
- **Last meaningful update date:** 2024-10-18
- **Primary environment:** Python / Jupyter Notebook / Google Colab
- **Primary technical field:** Python data engineering foundations
- **Project context:** structured learning / coursework repository
- **Collaboration classification:** `individual-coursework`
- **Authorship boundary:** instructional assets and IBM-hosted course datasets are separated from the executed exercises and code written in the notebooks

## Evidence Basis

The repository contains separate learning units for:

- accessing databases using Python;
- static code analysis;
- unit testing;
- web scraping and API/data extraction.

It also checks in:

- CSV datasets;
- SQLite `.db` files;
- small Python modules used by the testing/static-analysis exercises.

Several notebook outputs are preserved, which makes execution evidence directly inspectable.

## Repository Structure

```text
Python-Essentials-for-Data-Engineering/
├── Accessing Databases using Python/
│   ├── Accessing_Databases_using_Python.ipynb
│   ├── INSTRUCTOR.csv
│   ├── Departments.csv
│   └── STAFF.db
├── Static Code Analysis/
│   ├── Static_Code_Analysis.ipynb
│   └── sample1.py
├── Unit Testing/
│   ├── Unit_Testing.ipynb
│   └── mymodule.py
└── Web scraping and Extracting Data using APIs/
    ├── Web_scraping_and_Extracting_Data_using_APIs.ipynb
    ├── Movies.db
    └── CSV/top_50_films.csv
```

## Database Access with Python

### SQLite Connection

The database notebook imports `sqlite3` and opens:

```python
sqlite3.connect('STAFF.db')
```

This gives direct evidence of embedded relational-database access from Python.

### CSV-to-DataFrame Loading

The instructor dataset is loaded through `pandas.read_csv` with an explicit attribute list.

### DataFrame-to-SQL Loading

The notebook writes the DataFrame into SQLite through:

```python
df.to_sql(table_name, conn, if_exists='replace', index=False)
```

The saved notebook output confirms:

```text
Table is ready
```

### SQL Queries from Pandas

Executed examples include:

```sql
SELECT * FROM INSTRUCTOR
SELECT FNAME FROM INSTRUCTOR
SELECT COUNT(*) FROM INSTRUCTOR
```

The notebook preserves returned tabular results, including a count of fourteen instructor records before the later append exercise.

### Database Append Workflow

A one-row DataFrame for `John Doe` is constructed and appended with `if_exists='append'`.

The notebook stores the runtime confirmation:

```text
Data appended successfully
```

### Connection Cleanup

The SQLite connection is explicitly closed after the operations.

## Web Scraping and Data Extraction

The extraction notebook imports:

- `requests`;
- `sqlite3`;
- `pandas`;
- `BeautifulSoup`.

### HTTP Retrieval

A preserved Web Archive page is fetched using:

```python
requests.get(url).text
```

### HTML Parsing

BeautifulSoup parses the returned HTML and the workflow locates the table body and row elements.

### Top-50 Extraction

The notebook loops over table rows, extracts rank, film title, and year, and builds a DataFrame containing fifty films.

The executed output visibly contains records such as:

- The Godfather;
- Citizen Kane;
- Casablanca;
- Seven Samurai;
- Parasite;
- The Matrix.

### Multi-Destination Persistence

The extracted DataFrame is persisted in two forms:

1. CSV through `df.to_csv`;
2. SQLite through `df.to_sql`.

This is a compact ETL-style workflow:

```text
web page
  ↓
HTTP request
  ↓
HTML parse
  ↓
structured row extraction
  ↓
pandas DataFrame
  ├─→ CSV
  └─→ SQLite
```

## Unit Testing

### Test Target Module

`mymodule.py` defines:

- `square(number)`;
- `double(number)`.

### `unittest`

The notebook constructs `unittest.TestCase` classes for both functions.

Assertions include:

- `assertEqual`;
- `assertNotEqual`;
- positive, negative, zero, integer, and floating-point inputs.

### Executed Verification

The preserved output reports:

```text
Ran 1 test ... OK
Ran 1 test ... OK
```

and a `TextTestResult` with:

```text
errors=0 failures=0
```

This is direct positive evidence of Python unit-test execution.

## Static Code Analysis

### Pylint Setup

The static-analysis notebook installs and runs Pylint.

### Actual Diagnostics

The saved output includes concrete diagnostics for `sample1.py`, including:

- line too long;
- missing final newline;
- missing module docstring;
- missing function docstring;
- naming-style warnings;
- recommendation to use an f-string.

The recorded Pylint score is `0.00/10`.

That score is preserved as tool output rather than hidden or reframed as a quality rating of the portfolio.

## Engineering Practices

### Database Resource Management

SQLite connections are explicitly opened and closed.

### Reproducible Data Artifacts

Source CSV files and generated SQLite databases are checked into the learning repository.

### Automated Unit Verification

Python behavior is checked with executable assertions rather than print-only inspection.

### Static Analysis

Pylint is used as an automated code-quality diagnostic tool.

### Data Persistence

The same structured DataFrame is materialized into both CSV and relational-table forms.

## Scale and Complexity

The repository is small in raw size but spans several practical engineering workflows:

- database connectivity;
- SQL execution;
- DataFrame persistence;
- web scraping;
- file generation;
- unit testing;
- static analysis.

It is broader than a single tutorial notebook because multiple independent engineering practices are collected into one learning repository.

## Skills Demonstrated

### Python

- module imports;
- DataFrames;
- database connections;
- file output;
- HTTP requests;
- HTML parsing.

### Data Engineering

- CSV ingestion;
- relational persistence;
- SQL querying;
- append/replace table modes;
- web-to-tabular extraction;
- multi-format data persistence.

### Testing

- Python `unittest`;
- `TestCase`;
- equality and inequality assertions;
- executed passing tests.

### Code Quality

- Pylint installation and execution;
- interpretation of lint diagnostics.

### Databases

- SQLite;
- SQL;
- pandas-to-SQL integration.

## Capability Developed

This repository moves beyond using Python only for analysis or ML and exercises Python as glue between external data, relational storage, quality tooling, and automated tests.

The strongest portfolio signal is the integration of small engineering practices that later become essential in backend/data work: acquire data, structure it, persist it, query it, test code, and inspect quality diagnostics.

## Portfolio Evolution Context

This is the earliest processed repository so far with direct evidence of:

- Python `unittest`;
- Pylint execution;
- SQLite database integration from Python;
- a web-scraping workflow persisted simultaneously to CSV and SQLite.

## Overall Repository Narrative

`Python-Essentials-for-Data-Engineering` is a compact data-engineering foundations repository built around executed Python notebooks.

It demonstrates relational access through SQLite and pandas, a complete web-scraping-to-storage pipeline, automated unit testing, and static code analysis.

The repository is instructional in origin, so the corpus attributes exercised skills and completed workflows without treating course-hosted datasets or scaffold material as personally designed infrastructure.

# Project Tags

## Project Type

- `data-engineering-coursework`
- `course-assignment-repository`
- `technical-lab`

## Collaboration and Authorship

- `individual-coursework`
- `course-supplied-infrastructure`

## Languages

- `python`
- `sql`

## Data Engineering

- `pandas`
- `dataframe`
- `csv`
- `web-scraping`
- `beautifulsoup`
- `http-requests`
- `etl-workflow`
- `multi-format-persistence`

## Database

- `sqlite`
- `python-database-access`
- `sql-querying`
- `dataframe-to-sql`

## Testing and Verification

- `python-unittest`
- `automated-pass-fail`
- `executed-notebook-output`
- `pylint`
- `static-code-analysis`

## Software Engineering Practices

- `resource-lifecycle-management`
- `automated-testing`
- `static-analysis`
- `reproducible-input-data`

## Portfolio Significance

- `earliest-observed-python-unittest`
- `earliest-observed-pylint`
- `earliest-observed-python-sqlite`
