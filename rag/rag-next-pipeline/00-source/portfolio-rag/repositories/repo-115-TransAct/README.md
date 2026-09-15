# TransAct

## Repository Identity

- Repository: 115
- Name: `TransAct`
- Repository Start Date: 2026-09-07
- Latest Meaningful Update Date: 2026-09-07
- Latest Meaningful Commit: `223b4b030f2dc59803c07e537765f77bdcae635f`
- Primary Type: Full-stack financial-workflow web application
- Domain: Closed-loop developer economy, project transactions, recurring payments, lending, and transactional reliability
- Context: Owner-authored product prototype
- Collaboration Type: `individual-project`
- Primary Backend: Java 21 and Spring Boot 4.1
- Primary Frontend: React 19, TypeScript, Vite, and TanStack Query
- Persistence: PostgreSQL through Spring Data JPA
- Schema Evolution: Flyway SQL migrations
- Local Runtime: Docker Compose
- Continuous Integration: GitHub Actions

## Collaboration and Authorship Context

Repository history, commit authorship, and project structure support treating TransAct as an individual owner-authored project.

The repository contains a complete application-specific domain model rather than a thin framework exercise.

The implementation includes the business rules, persistence schema, API surface, user-facing React features, local container topology, CI workflow, and project-specific documentation.

The repository also makes an explicit evidence boundary around its review abstraction.

The interface is named `AiReviewService`, but the checked-in concrete implementation identifies itself as `HEURISTIC_PLACEHOLDER`.

That concrete implementation is deterministic and explicitly states that no model or API key is configured.

Accordingly, this repository demonstrates design for a replaceable review-provider boundary and human-in-the-loop decision support, while the currently evidenced runtime reviewer is a deterministic heuristic rather than an external AI model.

## What This Project Is

TransAct models a closed internal economy for voluntary developers.

Participants use an internal accounting unit named Brain Coins to represent transactional exchanges associated with project work, direct transfers, recurring payments, and loans.

The system separates economic accounting from a second concept named T-score.

T-score is designed as a bounded measure of observed transactional reliability inside TransAct.

Its code-level inputs are completed project commitments, overdue accepted work, disputes, repaid loans, and defaulted loans.

The score therefore captures behavioral evidence produced by TransAct workflows instead of attempting to represent technical competence, intelligence, employability, or personal value.

This separation is important to the product model.

A user can participate in financial-style workflows while the application independently explains how observed commitments affect a reliability score.

The project also explores a loan-approval workflow in which automated review is intentionally subordinate to deterministic domain services and a human administrator.

Payment-history evidence and qualification text are evaluated before a loan enters an administrator review state.

The administrator must wait through a configured review period before approving or rejecting the application.

Approval is the event that actually triggers Brain Coin disbursement.

The review provider itself cannot directly change balances, approve a loan, reject a loan, or alter T-score.

That boundary makes the application a useful example of separating advisory computation from authoritative state transition logic.

## Product Concept

The core product concept combines several connected workflows.

1. Developers have accounts inside the platform.
2. Brain Coin balances are derived from ledger postings.
3. Users can transfer Brain Coins directly.
4. Users can create project deals with other developers.
5. A developer can accept a proposed project commitment.
6. The requester can confirm completed work and release payment.
7. Either party can move accepted work into dispute.
8. Users can establish recurring salary-style payments.
9. Users can apply for Brain Coin loans.
10. Loan review evidence is assembled from recorded transactional history.
11. Qualification/context information is reviewed separately.
12. A mandatory administrator review period prevents immediate automated approval.
13. A human administrator approves or rejects the loan.
14. Approved loans are disbursed through the same ledger abstraction used by other money movement.
15. Repayments flow back to the system treasury.
16. Repaid or defaulted loans become future T-score evidence.

The workflows therefore feed one another.

Project outcomes and loan outcomes become reliability evidence.

Reliability evidence becomes part of future loan review context.

Money movement remains ledger-driven throughout those cycles.

## Architectural Shape

The repository is organized as a conventional full-stack application with explicit backend, frontend, database, and operational layers.

```text
React 19 + TypeScript frontend
            |
            | HTTP API
            v
Spring Boot 4.1 application
            |
            +--> Spring Security authentication/authorization
            |
            +--> Controllers / API views
            |
            +--> Domain services
            |      |
            |      +--> Ledger rules
            |      +--> Deal state transitions
            |      +--> Loan workflow
            |      +--> T-score calculation
            |      +--> Salary scheduling
            |      +--> Audit recording
            |
            +--> Spring Data JPA repositories
            |
            v
PostgreSQL
            |
            +--> Flyway-managed schema
```

Docker Compose supplies a local three-service topology.

```text
PostgreSQL 17
     |
     v
Spring Boot backend
     |
     v
Containerized frontend
```

The PostgreSQL container has a health check.

The backend waits for the database to become healthy before starting.

The frontend is configured with the backend API URL at image-build time.

This provides a reproducible local environment for exercising the complete application rather than requiring separately provisioned services.

## Backend Layering

The Java source separates concerns into application-specific packages.

- `domain` holds entities and state enumerations.
- `repo` holds persistence access.
- `service` contains transactional business rules.
- `api` exposes HTTP controllers and response views.
- `config` contains security and seeded development data.
- `db/migration` contains Flyway schema history.

This structure keeps HTTP handling separate from transaction logic.

For example, project completion payment is not implemented as controller-side arithmetic.

The controller delegates into a service that validates actor identity, validates the deal state, performs a ledger transfer, changes the domain state, and records an audit event.

The same pattern appears in lending and recurring payment workflows.

## Brain Coin Ledger

### Ledger as the Balance Authority

The application does not model a user balance as an independently mutable field.

Balance is calculated from ledger postings associated with an account.

`LedgerService.balanceForUser` obtains the user's account and asks the posting repository for the account balance.

The resulting amount is normalized to two decimal places.

This makes transaction history the accounting source of truth.

### Double-Entry Transfer Shape

Every transfer creates one `LedgerTransaction`.

The transfer then writes two postings against that transaction.

The source posting is the negated amount.

The destination posting is the positive amount.

The two postings therefore have equal magnitude and opposite sign.

This gives each money movement an explicit accounting pair.

### Monetary Normalization

Amounts are normalized to two decimal places with `RoundingMode.HALF_EVEN`.

A transfer amount must be present.

It must be greater than zero.

The source and destination accounts must differ.

These checks centralize basic monetary invariants in the ledger service.

### System Accounts

The account model distinguishes user-owned accounts from system accounts.

The lending workflow uses a named system account, `Brain Coin Treasury`, as the source of loan disbursements and the destination of repayments.

The ledger service exempts a system source account from the normal insufficient-balance rule.

This lets the internal treasury represent system-originated issuance within the same transaction model used for user transfers.

### Account Lock Ordering

Before a transfer is written, both participating accounts are loaded through a locking repository method.

The account UUIDs are sorted before locking.

Both locks are therefore acquired in deterministic identifier order.

The service then maps the locked records back to source and destination roles.

That design is concrete evidence of concurrency-aware transactional money movement.

It reduces the chance that two concurrent transfers lock the same pair of accounts in opposing orders.

### Insufficient-Balance Protection

For a non-system source account, the service calculates the current posting-derived balance while the account pair is locked.

The transfer is rejected when that balance is lower than the requested amount.

The balance rule is therefore enforced inside the same transactional service that writes the postings.

### Ledger References

Ledger transactions can carry:

- transaction type,
- reference type,
- reference identifier,
- memo,
- creation time.

This allows a posting pair to be associated with a project deal, loan application, or other domain event.

The ledger is therefore not merely a numerical total.

It acts as a traceable record connecting accounting changes to business workflows.

### Recent Activity Reconstruction

Recent account activity is generated from the user's latest postings.

For each posting, the service loads the postings belonging to the same transaction.

It identifies the counterparty as the other account in the pair.

When the counterparty is user-owned, the user's display name is returned.

When it is a system account, the account name is used.

This gives the frontend transaction history a domain-readable counterparty rather than exposing raw posting IDs.

### Memo Bounding

Transaction memos are optional.

Blank memos become null.

Long memos are bounded to 280 characters.

This keeps application-level free text aligned with the migration's `VARCHAR(280)` storage contract.

## Project Deal Workflow

Project deals connect voluntary development work to payment and T-score evidence.

A deal contains a requester, assigned developer, title, description, Brain Coin amount, optional due date, and status.

### Deal Creation

Creating a deal validates that the assigned developer exists.

A requester cannot create a deal with the same user identity.

The recipient must be an active developer.

Title and description are required.

The amount must be positive.

A supplied due date cannot be in the past.

The created proposal is recorded in the audit log.

### Developer Acceptance

Only the assigned developer can accept a proposal.

Only a deal in the proposed state can be accepted.

Acceptance therefore represents an explicit commitment by the work-performing party.

### Requester-Controlled Completion

Only the requester can confirm that an accepted deal is complete.

Completion invokes `LedgerService.transfer`.

The requester is charged.

The developer is credited.

The transfer is recorded with transaction type `PROJECT_PAYMENT` and a reference back to the deal.

Only after the transfer call does the domain object enter its completed state.

The completion transition is then audit logged.

This links product workflow, payment, state transition, and traceability.

### Dispute Entry

Either party to an accepted deal can place it into dispute.

The code explicitly records that entering dispute does not perform an automatic judgment.

That makes dispute a state transition, not an automated adjudication mechanism.

### Pre-Acceptance Cancellation

The requester can cancel a proposed deal.

Accepted work cannot be unilaterally cancelled through the same operation.

That distinction protects the semantics of an accepted commitment.

## T-Score Reliability Model

### Narrow Reliability Scope

`TrustService` calculates T-score only from TransAct-observable transactional events.

The current implementation examines:

- completed project deals,
- disputed project deals,
- overdue accepted project deals,
- repaid loans,
- defaulted loans.

The implementation starts with an unestablished baseline score of 50.

Its baseline explanation explicitly states that no reliability is assumed without transaction history and that this is not a judgment of skill or personal worth.

### Positive Evidence Components

Completed project commitments contribute positive points.

The contribution is bounded.

Repaid Brain Coin loans also contribute positive points.

That contribution is independently bounded.

### Concern Components

Disputed project commitments apply a bounded negative impact.

Overdue accepted commitments apply a bounded negative impact.

Defaulted Brain Coin loans apply the largest bounded negative impact among the current components.

### Bounded Final Score

The final score is clamped between 0 and 100.

The implementation maps the numerical score into named bands.

- `HIGH`
- `ESTABLISHED`
- `UNESTABLISHED_OR_DEVELOPING`
- `CONCERNS_PRESENT`

### Explainability

The result contains both the numerical score and a list of component records.

Each component includes:

- name,
- point impact,
- explanation.

The score can therefore be presented as a decomposable result rather than as an unexplained number.

### Reuse as Loan Evidence

`paymentHistory` packages the same source evidence into a record for the loan-review adapter.

The record includes:

- repaid loan count,
- defaulted loan count,
- completed deal count,
- disputed deal count,
- overdue commitment count,
- current T-score.

This provides a clean boundary between authoritative historical evidence and whatever review provider evaluates it.

## Loan Application Workflow

The lending workflow is one of the repository's most developed business processes.

### Application Validation

A loan amount must be positive.

The current Brain Coin loan ceiling is 10,000 BC.

Purpose is required.

Qualification/context text is required.

The service prevents an applicant from opening a second approved loan while an approved loan is still outstanding.

### Payment-History Collection

The loan service asks `TrustService` to build payment-history evidence.

The evidence comes from already-recorded project and lending history.

This means the review stage consumes application-domain facts instead of asking a reviewer to infer historical behavior from unstructured prose.

### Separate Review Channels

The application requests two assessments.

One assessment evaluates payment-history evidence.

A second assessment evaluates the qualification/context statement and purpose.

Those assessments are stored separately in the loan entity and database schema.

The separation preserves provenance between behavioral history and applicant-supplied context.

### Configurable Review Provider

`AiReviewService` defines the review abstraction.

The active repository implementation is `HeuristicReviewService`.

Its provider name is `HEURISTIC_PLACEHOLDER`.

The class labels every explanation as a pre-AI heuristic placeholder.

No external model is needed to exercise the workflow.

The abstraction nevertheless allows a later provider to implement the same assessment contract.

### Deterministic Payment-History Heuristic

The placeholder payment-history review maps evidence into `WEAK`, `MODERATE`, or `STRONG`.

Defaults or multiple disputes lead to the weak band.

A repaid loan or at least two completed commitments can lead to the strong band.

Other current cases produce a moderate band.

The explanation records the T-score and the input counts used by the heuristic.

### Deterministic Qualification Heuristic

The placeholder qualification review counts words in the applicant statement.

Longer statements cross deterministic thresholds into moderate or strong bands.

Its explanation explicitly states that the logic is only a stand-in for exercising the end-to-end process before a real reviewer is configured.

### Mandatory Human Review Window

Submitting the application captures the current time.

The application computes `adminReviewDueAt` by adding the configured review-period duration.

The default is three days.

The resulting state enters administrator review.

An audit event records that review-window entry.

### Human Approval Gate

Approval loads the application and verifies that it is in `ADMIN_REVIEW`.

The operation then checks the current time against `adminReviewDueAt`.

Approval before the review deadline is rejected.

Once the window has elapsed, an administrator can approve.

The service then transfers Brain Coins from the treasury system account to the applicant account.

The loan receives an approval state and repayment due date.

An audit event explicitly records that a human administrator approved and disbursed the loan.

### Human Rejection Gate

Rejection uses the same status and review-deadline gate.

The human administrator supplies or receives default explanatory notes.

The decision is audit logged.

### Repayment

An applicant can repay only their own approved outstanding loan.

The repayment amount must be positive.

It cannot exceed outstanding principal.

The money movement goes from the applicant account back to the treasury through the central ledger service.

The loan then updates outstanding amount.

The repayment is audit logged.

### Scheduled Default Detection

An hourly scheduled operation finds approved loans whose repayment due date has passed.

If outstanding amount remains, the loan is marked defaulted.

A system-authored audit event records the transition.

Defaulted loans subsequently become T-score and payment-history evidence.

This creates a closed feedback loop between operational loan state and future reliability assessment.

## Recurring Salary / Direct-Deposit Workflow

The repository models recurring payments through `SalaryAgreement`.

A payer creates an agreement for a recipient developer.

The recipient must have the developer role.

The payer and recipient must differ.

The label is required.

Amount must be positive.

The interval must be between one and 365 days.

A first-payment timestamp in the past is normalized to the current time.

The agreement stores the next payment time.

### Scheduler

`SalaryService.runDuePayments` is annotated with Spring scheduling.

The delay is configurable through `transact.salary.scheduler-ms`.

Each scheduler pass queries active agreements whose next payment timestamp is due.

Each due agreement is handed to `SalaryPaymentProcessor`.

This separates agreement management from payment execution.

### Deactivation Authority

Only the payer can deactivate an agreement.

Deactivation is audit logged.

The repository therefore models recurring payments as explicit agreements with ownership and lifecycle rules rather than as anonymous timers.

## Auditability

`AuditEvent` is a persisted domain entity.

The initial Flyway migration creates an `audit_events` table and an index on entity type plus entity ID.

Business services call `AuditService` for consequential transitions.

Evidenced audit events include:

- loan application,
- loan approval,
- loan rejection,
- loan repayment,
- automatic loan default,
- project-deal creation,
- project-deal acceptance,
- project-deal completion,
- deal dispute,
- deal cancellation,
- salary agreement creation,
- salary agreement deactivation.

Audit records include actor, action, entity type, entity ID, details, and creation time.

This gives major state changes a separate trace record from their mutable domain entities.

## Persistence Model

The repository uses PostgreSQL and Spring Data JPA.

The initial Flyway migration creates a normalized relational schema.

### `app_users`

Stores application identity fields including:

- UUID primary key,
- display name,
- unique email,
- role,
- active flag,
- creation timestamp.

### `accounts`

Stores:

- UUID primary key,
- optional unique user owner,
- unique name,
- system-account flag,
- active flag,
- creation timestamp.

The nullable owner relationship allows system accounts such as the Brain Coin treasury.

### `ledger_transactions`

Stores transaction-level context including type, domain reference, memo, and timestamp.

### `ledger_postings`

Stores account-level signed amounts belonging to ledger transactions.

Indexes support lookup by account and transaction.

### `project_deals`

Stores both parties, textual work definition, amount, due date, lifecycle state, transition timestamps, and optimistic version field.

### `loan_applications`

Stores application inputs, outstanding amount, review provider, separate review bands and explanations, administrator notes, review deadline, decision time, repayment deadline, and version field.

This schema preserves both decision inputs and decision-process metadata.

### `salary_agreements`

Stores payer, recipient, label, amount, interval, next payment, active state, last execution metadata, creation time, and version.

### `audit_events`

Stores the immutable-style event record associated with consequential operations.

## Security Baseline

The backend uses Spring Security.

### Stateless HTTP Security

Session creation policy is `STATELESS`.

The health endpoint is public.

Administrative API paths require the `ADMIN` role.

Other API requests require authentication.

### Development Identities

The current security configuration uses an in-memory `UserDetailsService`.

It defines a developer identity and administrator identity.

Passwords come from application configuration.

The HTTP mechanism is Basic authentication.

This establishes a testable role boundary for the current prototype.

### Method Security

`@EnableMethodSecurity` is enabled.

This allows controller or service methods to apply role annotations in addition to path-level authorization.

### CORS

Allowed origins are configuration-driven.

The default local origin points at the Vite frontend.

The configuration permits the HTTP methods used by the API and the `Authorization` and `Content-Type` headers.

Credentials are allowed.

This is an explicit frontend-backend integration boundary rather than a blanket browser-access assumption.

## HTTP API Shape

The backend has controllers for:

- health,
- current user,
- dashboard,
- transfers,
- project deals,
- loans,
- recurring salaries,
- administrator loan review.

The controller split mirrors the main product workflows.

API view records are kept separately from persistence entities through `ApiViews`.

This provides a presentation boundary for HTTP responses.

## React Frontend

The frontend uses React 19 and TypeScript.

Vite is the development and production build tool.

TanStack Query provides server-state access.

The source tree is feature-oriented rather than placing all screens into one application file.

Feature areas include:

- authentication,
- dashboard,
- project deals,
- loans,
- salaries,
- administration.

Shared components, domain definitions, API access, and application shell logic have their own directories.

### Dashboard

The dashboard exposes financial-style navigation and summary interactions.

Evidence in `OverviewPage.tsx` includes quick actions for:

- applying for a loan,
- creating a project deal,
- configuring direct deposit.

The same screen presents recent transaction activity.

The UI therefore reflects the backend domain rather than being a generic starter interface.

### Financial UI Evolution

The latest two repository commits focus on frontend architecture and presentation.

One commit rebuilds the financial UI architecture and light theme.

The latest commit adopts a Namaa-inspired fintech dashboard.

This shows a short but explicit evolution from domain implementation into product-facing financial interaction design.

## Build and Tooling

### Frontend Build Contract

The frontend `build` script runs:

```text
tsc -b
vite build
```

TypeScript compilation therefore precedes bundling.

The repository history includes a dedicated commit fixing the TypeScript configuration to make this build path work.

### Backend Build Contract

The Maven project targets Java 21.

GitHub Actions executes:

```text
mvn --batch-mode verify
```

This invokes the Maven verification lifecycle instead of compilation alone.

## Testing and Verification

### Unit Testing

The backend contains `HeuristicReviewServiceTest`.

The test class exercises deterministic review behavior.

Its evidenced cases include:

- weak classification for default-containing payment history,
- strong classification for a sufficiently substantial qualification statement.

These tests directly verify the current review-provider rules.

### Continuous Integration

The GitHub Actions workflow has independent backend and frontend jobs.

Backend CI:

1. checks out the repository,
2. installs Temurin Java 21,
3. enables Maven dependency caching,
4. executes `mvn --batch-mode verify`.

Frontend CI:

1. checks out the repository,
2. installs Node.js 22,
3. installs dependencies,
4. runs the production build.

### Verified Latest CI Run

The workflow run associated with latest commit `223b4b030f2dc59803c07e537765f77bdcae635f` completed successfully on 2026-09-07.

The successful run validates the current latest frontend state against both CI jobs defined by the repository workflow.

This is direct build-verification evidence for the checked-in state.

## Containerized Development Environment

Docker Compose defines three services.

### PostgreSQL

The database uses `postgres:17-alpine`.

A named Docker volume persists database state.

A `pg_isready` health check gates backend startup.

### Backend

The backend is built from `./backend`.

Its environment receives JDBC connection information, CORS configuration, and the development user passwords.

It exposes port 8080.

### Frontend

The frontend is built from `./frontend`.

The backend URL is passed as `VITE_API_URL` during the image build.

The resulting web service is exposed on local port 5173.

The frontend declares a dependency on the backend service.

The complete local topology can therefore be started as one composed environment.

## Engineering Practices Demonstrated

### Deterministic Authority Boundaries

The project deliberately keeps financial state transitions in deterministic domain services.

Review output is advisory evidence.

Approval remains a human-authorized operation.

Ledger mutation remains a transactional backend operation.

This is a strong example of assigning authority according to risk.

### Transactional Consistency

Money movement is centralized in one transactional ledger abstraction.

Project payments, loan disbursement, and loan repayment reuse that abstraction.

Account locking and balance validation happen before postings are written.

### Separation of Evidence and Decision

Loan payment history is assembled from persisted system facts.

Qualification context is a separate input.

Each is reviewed independently.

The results are persisted separately.

The administrator then makes the actual decision after the review window.

### Explicit State Machines

Deals and loans have guarded state transitions.

Operations validate both actor and current state.

This prevents callers from treating domain states as arbitrary labels.

### Audit-First Consequential Operations

Major transitions emit audit records.

The pattern makes important state changes independently inspectable.

### Configuration-Driven Runtime Behavior

The repository externalizes:

- database connection details,
- development passwords,
- CORS origins,
- loan review duration,
- salary scheduler frequency,
- frontend API URL.

This allows the same code paths to run under local and externally configured environments.

### Schema Versioning

Flyway places database structure under version control.

The initial schema is explicit SQL rather than implicit auto-generated production state.

### Type-Safe Frontend Build

TypeScript compilation is part of the production frontend build.

The repository history shows that buildability was treated as an implementation requirement, not merely an editor concern.

### Feature-Oriented Frontend Organization

The React source mirrors user workflows.

This makes the codebase navigable by product capability: dashboard, deals, loans, salary, admin, and auth.

## Product Engineering Evidence

TransAct is more than a numerical accounting demo.

It includes named actors, guarded workflows, user-facing pages, recurring processes, administrative review, and auditability.

The system distinguishes normal developer users from administrators.

It supports seeded counterparties so workflows can be exercised immediately.

It provides a dashboard and quick actions oriented around actual product journeys.

The product model is also careful about semantics.

T-score is labeled as transactional reliability rather than technical skill.

Brain Coins are treated as an internal accounting unit.

Human administrators retain authority over loan approval.

The current deterministic reviewer is explicitly labeled as a placeholder.

These choices demonstrate attention to how product terminology can imply authority or meaning beyond what the implementation actually establishes.

## Scale and Complexity

### Domain Complexity

The domain spans:

- accounts,
- ledger transactions,
- ledger postings,
- users and roles,
- project deals,
- deal disputes,
- reliability scoring,
- loan applications,
- review evidence,
- administrator decisions,
- repayments,
- defaults,
- recurring salary agreements,
- scheduled payments,
- audit events.

### Cross-Workflow Coupling

The workflows interact through well-defined shared abstractions.

Deals move Brain Coins through the ledger.

Loan approval and repayment move Brain Coins through the ledger.

Deal and loan outcomes feed T-score.

T-score and historical outcomes feed loan review evidence.

Audit events trace all of those consequential state transitions.

### Operational Complexity

The repository contains independent frontend and backend builds, a relational database, schema migration, scheduled jobs, role-based security, Docker Compose, and CI.

This gives the project meaningful full-stack operational shape despite its short chronological development period.

## Engineering Evolution

Repository history shows an unusually compressed implementation sequence on 2026-09-07.

### Architecture Definition

The early documentation commit defines TransAct's architecture and product boundaries.

This establishes the intended distinction between ledger authority, T-score, human loan authority, and review-provider integration.

### Developer Economy Implementation

The next major commit implements the developer-economy backend and frontend baseline.

The repository gains the concrete ledger, deals, loans, salaries, trust scoring, persistence, API, and infrastructure represented in the current tree.

### Build Repair

A dedicated commit corrects frontend TypeScript configuration.

This converts the frontend from source presence into a buildable CI target.

### Financial UI Refactor

The frontend is then reorganized into a more explicit financial UI architecture with a light visual system.

### Dashboard Productization

The latest commit adopts a fintech dashboard design influenced by the Namaa reference.

The chronology therefore moves rapidly from domain definition to executable system to build hardening to product-facing interface refinement.

## Skills Demonstrated

### Java and Spring

- Java 21 application development
- Spring Boot
- Spring services
- Spring Data JPA
- Spring Security
- Spring scheduling
- declarative transaction management
- configuration injection
- role-based authorization
- exception-based business-rule enforcement

### Financial-System Modeling

- double-entry ledger modeling
- derived balances
- signed posting pairs
- system accounts
- transfer validation
- account locking
- transactional money movement
- traceable transaction references
- repayment accounting

### Domain Modeling

- explicit deal lifecycle
- explicit loan lifecycle
- recurring agreement lifecycle
- user roles
- guarded state transitions
- actor authorization inside business rules
- reliability-score composition
- bounded scoring
- explainable component scoring

### Lending Workflow Design

- payment-history evidence construction
- separate qualification review
- review-provider abstraction
- mandatory review windows
- human approval/rejection
- treasury disbursement
- repayment tracking
- automatic overdue default transition

### Scheduled Processing

- Spring scheduled jobs
- due-payment discovery
- recurring agreement execution
- overdue-loan detection

### Persistence and Data Modeling

- PostgreSQL
- relational modeling
- UUID identifiers
- foreign-key relationships
- unique constraints
- indexes
- monetary numeric types
- optimistic version columns
- Flyway migrations

### Frontend Engineering

- React 19
- TypeScript
- Vite
- TanStack Query
- feature-oriented frontend organization
- financial dashboard interaction design
- typed API integration
- product workflow navigation

### Security

- Spring Security
- stateless API configuration
- HTTP Basic development authentication
- administrator route authorization
- method security
- configurable CORS

### DevOps and Verification

- Docker
- Docker Compose
- PostgreSQL health checks
- container dependency ordering
- GitHub Actions
- Java 21 CI
- Maven verification
- frontend TypeScript production builds
- unit testing
- successful latest-commit CI validation

### Product Engineering

- developer economy modeling
- transaction history
- direct transfers
- project compensation
- recurring payments
- loan administration
- auditability
- explainable reliability metrics
- human-in-the-loop review
- terminology boundaries around internal credits and reliability scoring

## Portfolio Significance

TransAct represents a shift from implementing isolated application features toward encoding product policy directly in domain services.

The important engineering signal is not simply that the repository uses Spring and React.

It is that the code expresses who is allowed to perform consequential operations, when those operations are legal, which evidence feeds later decisions, and which subsystem is authoritative for money movement.

The ledger is the accounting authority.

The domain services are the state-transition authority.

The review adapter supplies decision-support evidence.

The administrator is the approval authority for loans.

T-score is a bounded explanation of platform-observed reliability.

Those boundaries are encoded in executable code rather than existing only as product prose.

The project also demonstrates an attempt to keep a future AI integration constrained.

The current implementation does not pretend that a deterministic heuristic is an AI model.

Instead, it gives the heuristic the same adapter shape that a later model-backed reviewer can implement, while preserving human approval and deterministic financial execution regardless of provider.

That architectural choice makes the repository useful evidence for backend domain modeling, financial-style accounting, safe decision-support boundaries, full-stack product organization, and CI-backed implementation discipline.

# Project Tags

- java
- java-21
- spring-boot
- spring-data-jpa
- spring-security
- spring-scheduling
- transactional-services
- postgresql
- flyway
- relational-database
- uuid-identifiers
- react
- react-19
- typescript
- vite
- tanstack-query
- feature-oriented-frontend
- financial-dashboard
- rest-api
- stateless-api
- role-based-authorization
- http-basic
- cors
- docker
- docker-compose
- github-actions
- maven
- continuous-integration
- unit-testing
- successful-ci-build
- double-entry-ledger
- derived-balance
- ledger-postings
- ledger-transactions
- system-account
- account-locking
- deterministic-lock-order
- transactional-money-movement
- direct-transfer
- brain-coins
- project-deal-workflow
- project-payment
- deal-state-machine
- dispute-workflow
- t-score
- transactional-reliability
- explainable-scoring
- bounded-score
- loan-application-workflow
- payment-history-evidence
- qualification-review
- review-provider-abstraction
- deterministic-heuristic-review
- human-in-the-loop-review
- mandatory-review-window
- administrator-loan-review
- loan-disbursement
- loan-repayment
- loan-default-detection
- recurring-payments
- salary-agreement
- scheduled-payments
- audit-log
- audit-events
- configuration-driven-runtime
- fintech-style-application
- developer-economy
- full-stack-application
