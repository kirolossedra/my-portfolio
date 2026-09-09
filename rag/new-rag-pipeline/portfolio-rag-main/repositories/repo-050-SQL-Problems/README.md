# Repository 050 — SQL-Problems

## Repository Identity

- **Repository:** `kirolossedra/SQL-Problems`
- **Repository start date:** 2024-09-27
- **Last meaningful update date:** 2024-09-28
- **Primary implementation language:** SQL / MySQL-style query syntax
- **Repository type:** database query problem-solving corpus
- **Synchronization tooling:** LeetHub-generated repository structure / commits
- **Collaboration classification:** individual coding-practice repository

## What This Project Is

`SQL-Problems` is a collection of solved relational query problems synchronized from LeetCode-style exercises.

Each problem directory typically contains:

- a `.sql` solution,
- a generated `README.md` with the problem statement,
- sometimes `NOTES.md`.

The repository is therefore both a SQL practice history and a query-pattern corpus.

## Repository Automation

Commit messages repeatedly contain `LeetHub`.

Examples include:

- generated README commits,
- attached notes,
- runtime/space result commits.

This shows that repository structure and synchronization were tool-assisted.

The SQL solution content is the meaningful learner artifact.

Generated problem statements are not attributed as original repository-authored documentation.

## Relational Query Themes

The visible problem set spans patterns such as:

- filtering,
- joins,
- anti-joins / missing relationships,
- grouping,
- aggregation,
- maxima,
- nested queries,
- `UNION ALL`,
- self-referential organizational relationships.

## Department Highest Salary

`0184-department-highest-salary.sql` demonstrates a multi-stage relational query.

It:

1. groups employees by department,
2. computes `MAX(salary)` per department,
3. joins that result back to `Employee`,
4. retains employees matching each departmental maximum,
5. joins `Department` for the human-readable department name.

This exercises derived tables and aggregate-to-detail joins.

## Aggregate-to-Row Recovery

The department-highest-salary pattern is important because an aggregate alone loses the employee row.

The solution reconstructs the full row by joining aggregate output to the source table.

This is a common SQL reasoning pattern.

## Friend Requests: Most Friends

`0602-friend-requests-ii-who-has-the-most-friends.sql` handles a relationship whose participant can appear in either of two columns.

The solution:

- groups accepted relationships by `accepter_id`,
- groups them again by `requester_id`,
- normalizes both roles to a shared `id`,
- combines them with `UNION ALL`,
- aggregates the combined counts,
- selects the maximum.

## Symmetric Relationship Normalization

This is a useful relational-design insight.

A friendship count cannot be computed correctly by considering only one endpoint column.

The solution first converts both endpoint roles into one logical participant dimension.

That demonstrates reasoning about schema semantics, not just SQL syntax.

## Customers Who Never Order

The repository contains a dedicated problem for finding customers without orders.

That problem class exercises missing-relationship logic.

Depending on the checked-in query, this family is typically solved through:

- anti-join,
- `NOT IN`,
- `NOT EXISTS`,
- or null filtering after outer join.

The repository therefore records practice with negative relational conditions.

## Managers With Direct Reports

The `managers-with-at-least-5-direct-reports` problem exercises employee-to-manager self-relationships.

This requires grouping or joining a table against its own managerial references.

It adds hierarchical relational reasoning to the corpus.

## Employee Bonus

The employee-bonus problem requires joining employee records with optional bonus records and filtering based on nullable/threshold conditions.

This reinforces outer-join/null semantics.

## Customer Referee

The customer-referee problem exercises SQL three-valued logic around nullable foreign-key-like values.

This is useful evidence of practical null-handling awareness.

## Largest Number of Orders

The repository contains an aggregation problem for identifying the customer with the largest order count.

That class combines:

- `COUNT`,
- grouping,
- ordering or maximum selection.

## Big Countries

The `big-countries` problem is a simpler predicate/filter exercise.

It provides baseline SQL selection logic alongside the more nested queries.

## Classes With More Than Five Students

This is a grouped cardinality problem.

It reinforces:

- `GROUP BY`,
- count aggregation,
- post-aggregation filtering through `HAVING`.

## Query Composition

Across the repository, solutions combine relational operators rather than relying on one pattern.

The corpus contains evidence of:

- nested derived tables,
- aggregate subqueries,
- joins,
- unions,
- grouped filtering.

## MySQL Context

The checked-in solution comments use:

`Write your MySQL query statement below`.

The corpus therefore records MySQL-style problem solving.

It does not infer production MySQL administration from that comment.

## Runtime Metadata

LeetHub commit messages include runtime and space measurements returned by the coding platform.

Those values are platform feedback.

They are not treated as controlled database benchmarks.

They do, however, show that solutions were submitted/executed through the problem platform.

## Testing and Verification

Verification is external-platform based.

The repository's latest commits include accepted-solution timing metadata.

There is no standalone local SQL test harness.

There is no database fixture suite in the repository.

## Skills Demonstrated

### SQL

- `SELECT`
- `WHERE`
- `JOIN`
- aggregate functions
- `GROUP BY`
- derived tables
- nested subqueries
- `UNION ALL`
- null-aware filtering

### Relational Reasoning

- one-to-many relationships
- self-references
- symmetric relationship normalization
- missing relationships
- aggregate-to-row reconstruction

### Problem Solving

- decomposing relational requirements
- composing nested queries
- platform-based validation

## Capability Developed

The repository develops the ability to translate natural-language relational questions into executable queries.

The stronger exercises require intermediate relational representations rather than single-clause answers.

That is directly relevant to backend and data-engineering work where query correctness depends on understanding schema relationships.

## Portfolio Evolution

Earlier corpus repositories already contain SQL/database work.

`SQL-Problems` differs by making relational query reasoning itself the central repeated practice activity.

It complements application-oriented database use with deliberately isolated SQL problem solving.

## Historical Significance

Within the processed corpus, this is the first observed repository dedicated specifically to a synchronized corpus of SQL coding problems.

## Scope Boundaries

The repository does not establish:

- database administration,
- schema migration ownership,
- transaction design,
- production query monitoring,
- database deployment.

Its evidence is query-level problem solving.

## Limitations

Problem READMEs are generated from the coding platform.

Repository synchronization is automated by LeetHub.

No local database test fixtures are present.

Runtime numbers are platform-specific.

There is no repository-level explanatory README.

## Overall Narrative

`SQL-Problems` is a focused relational reasoning corpus.

Its value comes from repeated solutions across joins, aggregation, hierarchy, null handling, nested queries, and relationship normalization.

The repository should be read as evidence of SQL problem-solving practice with external platform verification, not as a standalone database product.

# Project Tags

- `individual-project`
- `coding-interview-practice`
- `sql`
- `mysql`
- `leethub`
- `relational-databases`
- `sql-joins`
- `sql-aggregation`
- `group-by`
- `nested-subqueries`
- `derived-tables`
- `union-all`
- `null-handling`
- `self-referential-data`
- `relational-query-reasoning`
- `online-judge`
