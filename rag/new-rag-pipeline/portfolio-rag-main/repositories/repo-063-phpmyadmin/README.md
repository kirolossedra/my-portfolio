# Repository 063 — phpmyadmin

## Repository Identity

- **Repository:** `kirolossedra/phpmyadmin`
- **Repository start date:** 2024-10-19
- **Last meaningful update date:** 2024-10-20
- **Latest meaningful commit:** `50c946c44e3145191f08c003436fd985d4795706`
- **Primary technical field:** MySQL administration, transactional SQL, and recovery behavior
- **Primary tools:** MySQL, phpMyAdmin, SQL, Linux package management
- **Project context:** individual database-learning / troubleshooting lab
- **Collaboration classification:** `individual-coursework`

## Evidence Basis

The final tree contains four substantive artifacts:

- `README.md`;
- `BankAccounts-CREATE.sql`;
- `ShoeShop-CREATE.sql`;
- `ROLLBACK.sql`.

The SQL files are the strongest implementation evidence.

The large README is primarily a saved troubleshooting conversation around installing and repairing MySQL/phpMyAdmin on Linux.

The corpus therefore separates direct SQL implementation evidence from conversational troubleshooting notes.

## Database Environment Work

The README records a practical attempt to install:

- MySQL Server;
- phpMyAdmin;
- Apache integration;
- PHP/MySQL support.

The setup path includes:

```bash
sudo apt update
sudo apt install mysql-server
sudo apt install phpmyadmin
```

and Apache configuration/restart steps.

## Package-Management Troubleshooting

The notes capture several real setup failures.

### APT Lock

The user encountered:

```text
Could not get lock /var/lib/dpkg/lock-frontend
```

with another `apt` process holding the lock.

The troubleshooting sequence includes process inspection and package-manager recovery.

### Interrupted `dpkg`

A subsequent error states:

```text
dpkg was interrupted, you must manually run
sudo dpkg --configure -a
```

The repository records using:

```bash
sudo dpkg --configure -a
```

as the repair path.

### MySQL Password Policy

The setup also encounters MySQL error 1819:

```text
Your password does not satisfy the current policy requirements
```

This adds direct exposure to operational database security policy rather than only SQL syntax.

## Bank Account Schema

`BankAccounts-CREATE.sql` defines:

```sql
CREATE TABLE BankAccounts (
    AccountNumber VARCHAR(5) NOT NULL,
    AccountName VARCHAR(25) NOT NULL,
    Balance DECIMAL(8,2) CHECK(Balance>=0) NOT NULL,
    PRIMARY KEY (AccountNumber)
);
```

Important schema properties include:

- explicit primary key;
- non-null account number;
- non-null account name;
- non-negative balance constraint.

The initial data includes:

- Rose;
- James;
- Shoe Shop;
- Corner Shop.

## Shoe-Shop Schema

`ShoeShop-CREATE.sql` defines:

```sql
CREATE TABLE ShoeShop (
    Product VARCHAR(25) NOT NULL,
    Stock INTEGER NOT NULL,
    Price DECIMAL(8,2) CHECK(Price>0) NOT NULL,
    PRIMARY KEY (Product)
);
```

This introduces another constrained table with:

- product identity;
- inventory quantity;
- positive-price validation.

## Cross-Table Business Transaction

The most technically important artifact is `ROLLBACK.sql`.

It defines a stored procedure:

```sql
CREATE PROCEDURE TRANSACTION_ROSE()
```

The procedure represents a multi-step business transaction spanning:

- account balances;
- merchant payment;
- shoe inventory.

### Transaction Start

The procedure explicitly begins:

```sql
START TRANSACTION;
```

### Financial Updates

It debits Rose:

```sql
UPDATE BankAccounts
SET Balance = Balance-200
WHERE AccountName = 'Rose';
```

and credits the Shoe Shop:

```sql
UPDATE BankAccounts
SET Balance = Balance+200
WHERE AccountName = 'Shoe Shop';
```

### Inventory Update

It decrements boot inventory:

```sql
UPDATE ShoeShop
SET Stock = Stock-1
WHERE Product = 'Boots';
```

### Additional Debit

The procedure then attempts another debit:

```sql
UPDATE BankAccounts
SET Balance = Balance-300
WHERE AccountName = 'Rose';
```

Given the starting balance and the table's non-negative `CHECK` constraint, this sequence is designed to create a constraint-sensitive failure scenario.

## SQL Exception Handling

The procedure declares:

```sql
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    ROLLBACK;
    RESIGNAL;
END;
```

This is important because failure handling is not left implicit.

The transaction logic explicitly defines:

```text
SQL exception
  ↓
ROLLBACK
  ↓
RESIGNAL
```

## Commit Path

Only after all statements succeed does the procedure execute:

```sql
COMMIT;
```

This establishes the core transaction invariant:

> either the multi-table business operation succeeds as a unit, or the transaction is rolled back.

## Transactional System Shape

The repository models:

```text
Rose account
   │
   ├─ debit purchase amount
   │
   v
Shoe Shop account
   │
   └─ credit purchase amount

ShoeShop inventory
   │
   └─ decrement stock

any SQL failure
   ↓
ROLLBACK entire transaction
```

This is much more significant than the repository title alone suggests.

## Technical Stack

### Database

- MySQL
- SQL
- phpMyAdmin

### SQL Features

- DDL;
- `CREATE TABLE`;
- `INSERT`;
- `UPDATE`;
- primary keys;
- `CHECK`;
- stored procedures;
- transactions;
- exception handlers;
- rollback;
- commit;
- `RESIGNAL`.

### Environment

- Linux;
- APT;
- dpkg;
- Apache/phpMyAdmin setup.

## Testing and Verification

Verification is largely manual.

The SQL script ends with:

```sql
CALL TRANSACTION_ROSE;
SELECT * FROM BankAccounts;
SELECT * FROM ShoeShop;
```

That structure is intended to observe post-transaction state.

There is no evidence of an automated database-test harness.

The important verification mechanism is the database's own integrity constraint plus transaction semantics.

## Engineering Discipline

### Integrity Constraints

Invalid financial state is constrained at the schema level:

```sql
CHECK(Balance>=0)
```

rather than relying only on application convention.

### Atomicity

Related financial and inventory changes are grouped into one transaction.

### Explicit Failure Policy

A SQL exception triggers rollback and rethrow.

### Business-State Consistency

The procedure recognizes that account balances and stock represent one logical operation.

This is a concrete form of defensive data engineering.

## Product Engineering Context

Although this is a lab, the modeled domain is business-relevant.

It resembles a purchase workflow where:

- customer funds decrease;
- merchant funds increase;
- inventory decreases.

The transaction boundary exists because these state changes cannot safely be independent.

## Scale and Complexity

The source code is small.

The conceptual complexity is higher than line count suggests because it introduces:

- multi-table state;
- constraint failures;
- transactional atomicity;
- database-side exception handling;
- stored-procedure encapsulation.

## Skills Demonstrated

### MySQL

- schema creation;
- constrained columns;
- data insertion;
- table updates;
- stored procedures.

### Transaction Management

- `START TRANSACTION`;
- `COMMIT`;
- `ROLLBACK`;
- exception-triggered recovery.

### Data Integrity

- primary keys;
- `NOT NULL`;
- `CHECK`;
- non-negative financial balance.

### Linux Operations

- package installation;
- package-manager lock diagnosis;
- interrupted `dpkg` recovery;
- phpMyAdmin environment setup.

## Capability Developed

This repository introduces the idea that data operations must preserve invariants under failure.

The key lesson is not merely how to issue SQL updates.

It is how to coordinate dependent updates so a partially completed business transaction does not corrupt state.

## Portfolio Evolution Context

The preceding repositories establish:

- SQL query practice;
- normalization;
- PostgreSQL operations.

`phpmyadmin` adds a stronger transaction/recovery dimension.

Within the processed chronology, this is the earliest direct evidence of:

- a SQL stored procedure;
- an explicit multi-statement transaction;
- SQL exception handling;
- rollback-on-failure.

Those concepts later matter strongly in fintech and backend systems.

## Historical Significance

The repository is an early point where database knowledge becomes business-state reasoning.

The use of a bank-account scenario is particularly relevant because it naturally exposes why atomicity matters.

It is a small learning repository, but the design concept—consistent state across failure—is foundational to production transaction systems.

## Authorship and Evidence Boundary

The README largely preserves a ChatGPT troubleshooting conversation and should not be treated as original authored technical documentation.

The `.sql` files are concrete repository artifacts and are the primary basis for implementation claims.

The environment-troubleshooting claims are limited to the problems and commands preserved in the README.

## Overall Repository Narrative

`phpmyadmin` combines operational database setup with a compact transactional SQL exercise.

Its strongest contribution to the portfolio corpus is `TRANSACTION_ROSE`: a stored procedure that coordinates account balances and inventory, protects invariants with schema constraints, and defines rollback behavior for SQL exceptions.

That makes the repository an early, concrete demonstration of thinking about failure-safe state transitions rather than only successful-path CRUD.

# Project Tags

## Project Type

- `individual-coursework`
- `database-lab`
- `transactional-sql-lab`

## Database

- `mysql`
- `phpmyadmin`
- `relational-database`
- `database-administration`

## SQL

- `sql`
- `stored-procedure`
- `sql-transaction`
- `commit`
- `rollback`
- `sql-exception-handler`
- `resignal`
- `check-constraint`
- `primary-key`

## Business Logic

- `account-balance`
- `inventory`
- `multi-table-transaction`
- `transaction-atomicity`
- `state-consistency`

## Linux and Operations

- `apt`
- `dpkg`
- `package-management`
- `database-environment-troubleshooting`

## Engineering Practices

- `defensive-data-design`
- `failure-recovery`
- `schema-level-invariants`

## Portfolio Significance

- `earliest-observed-stored-procedure`
- `earliest-observed-sql-transaction`
- `earliest-observed-sql-rollback`
- `earliest-observed-sql-exception-handler`