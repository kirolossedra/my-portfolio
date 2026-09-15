# Master Prompt: Repository-by-Repository Portfolio RAG Corpus Generation

You are building a **portfolio-analysis corpus from a complete collection of software, research, hardware, academic, experimental, and product repositories**.

The generated corpus must live persistently in the GitHub repository:

```text
portfolio-rag
```

Your task is to inspect repositories systematically and create **one independent, detailed analytical `README.md` for every repository**, then push the resulting corpus files incrementally into `portfolio-rag`.

These generated READMEs will later become the primary semantic corpus for a RAG system that must answer questions about:

* technical skills,
* project types,
* engineering evolution,
* testing evolution,
* architectural evolution,
* technologies,
* research capability,
* product engineering,
* systems engineering,
* DevOps,
* infrastructure,
* security,
* career progression,
* first/last appearances of skills,
* recurring skills,
* project comparisons,
* historical development,
* collaboration,
* authorship,
* individual versus team work,
* and portfolio-wide patterns.

The primary goal is **faithful preservation of positively evidenced information**.

The corpus is not a checklist of what repositories do not contain.

---

# 1. Core Positive-Evidence Rule

This is the most important rule in the entire task.

## Only write about things that are actually found.

If a capability, technology, engineering practice, project characteristic, or artifact is not evidenced in the repository:

**do not mention it at all.**

Do not write:

```text
E2E testing was not found.
CI/CD was not found.
Observability was not found.
No deployment configuration was identified.
No database was found.
No security mechanisms were observed.
```

Instead, write nothing about those categories.

If a repository contains no E2E testing:

* do not create an E2E subsection,
* do not mention E2E,
* do not add an E2E tag.

If a repository contains no CI/CD:

* do not create a CI/CD subsection,
* do not mention CI/CD,
* do not add a CI/CD tag.

If a repository contains no backend:

* do not create an empty Backend section.

If a repository contains no AI:

* do not discuss AI.

The corpus should contain **dense positive evidence**, not absence statements.

---

# 2. No Empty or Negative Sections

Never generate sections simply because they appear in this master template.

The README structure is **adaptive**.

Only instantiate sections that have meaningful positively evidenced content.

Bad:

```markdown
## End-to-End Testing

No E2E testing was found.

## CI/CD

No CI/CD configuration was found.

## Observability

No observability stack was identified.
```

Correct:

```markdown
## Unit Testing

The project contains...
```

and nothing else if unit testing is the only verification category evidenced.

The same rule applies to:

* frontend,
* backend,
* databases,
* APIs,
* testing,
* deployment,
* CI/CD,
* DevOps,
* cloud,
* security,
* observability,
* AI,
* ML,
* networking,
* embedded systems,
* product engineering,
* research,
* hardware,
* storage,
* integrations,
* and all other technical categories.

---

# 3. Evidence Preservation Principle

The generated corpus must preserve enough factual and analytical information that a later model can reason across repositories **without repeatedly reopening and reinterpreting every raw repository**.

Every positive claim must remain grounded in repository evidence.

Never infer expertise merely because a dependency, filename, framework, or utility exists.

Distinguish carefully between:

* code authored by the repository owner,
* code authored collaboratively,
* teammate work,
* framework-generated code,
* coursework-provided code,
* starter templates,
* supplied test infrastructure,
* generated files,
* copied examples,
* vendored dependencies,
* research-group infrastructure,
* supervisor/lab-provided code,
* and genuinely engineered repository-specific work.

When a positive capability is present but authorship is uncertain, qualify **that positive claim**.

Example:

> The repository contains a local test harness through `public_tests.py`; course structure suggests this infrastructure may have been supplied rather than personally authored.

Do not create a separate list of everything whose authorship could not be established.

---

# 4. Collaboration and Authorship

Actively determine whether the repository is:

```text
individual-project
group-project
course-group-project
research-collaboration
work-team-project
open-source-collaboration
```

Include the classification when supported by repository or project evidence.

Where evidence permits, also preserve:

* team size,
* personal role,
* personally attributable components,
* shared components,
* supplied infrastructure,
* collaboration context.

A repository being hosted under one GitHub account does not prove individual authorship.

For collaborative repositories distinguish:

```text
Repository capability
```

from:

```text
Personally attributable capability
```

when that distinction is materially supported.

Do not manufacture a large negative authorship discussion.

---

# 5. Persistent Output Repository

All generated corpus material must be stored in and pushed to:

```text
portfolio-rag
```

Do not use ZIP archives.

The Git repository itself is the cumulative persistent state.

Use this structure:

```text
portfolio-rag/
├── repositories/
│   ├── repo-001-project-name/
│   │   └── README.md
│   ├── repo-002-project-name/
│   │   └── README.md
│   ├── repo-003-project-name/
│   │   └── README.md
│   └── ...
├── PROGRESS.md
├── LINE-COUNTS.md
├── TAG-ONTOLOGY.md
└── corpus-manifest.json
```

Every repository receives a separate README.

Never merge all projects into a single README.

---

# 6. Incremental Push Requirement

After every agreed processing iteration:

1. generate the new repository READMEs;
2. update persistent corpus metadata;
3. commit the intended files;
4. push them to `portfolio-rag`.

A processed repository is not complete until its README and corresponding corpus-state updates have been pushed successfully.

Typical changed files:

```text
repositories/repo-XXX-project-name/README.md
PROGRESS.md
LINE-COUNTS.md
corpus-manifest.json
TAG-ONTOLOGY.md
```

Only modify `TAG-ONTOLOGY.md` when the iteration actually introduces or changes canonical tags.

Do not unnecessarily rewrite old README files.

---

# 7. Dynamic-Programming Line Accounting

Maintain line counts incrementally.

Store:

```text
repository_line_counts[repository_id] = README line count
```

and:

```text
cumulative_lines = sum(repository_line_counts)
```

For a new repository:

```text
new_cumulative_lines =
    previous_cumulative_lines
    + new_repository_readme_lines
```

For a revised repository:

```text
new_cumulative_lines =
    previous_cumulative_lines
    - old_repository_line_count
    + revised_repository_line_count
```

Do not repeatedly recompute the entire corpus when persistent state already provides the previous total.

---

# 8. Dedicated LINE-COUNTS.md

Maintain:

```text
LINE-COUNTS.md
```

Example:

```markdown
# Portfolio RAG README Line Counts

| Repo | Repository | README Lines | Cumulative Lines |
|---:|---|---:|---:|
| 001 | SQL-Problems | 314 | 314 |
| 002 | Project-X | 428 | 742 |
| 003 | xml_Parse_project | 611 | 1,353 |

## Current Total

- Processed repositories: 3
- Total repository README lines: 1,353
```

This is the human-readable line-count ledger.

It must always represent the current checked-in corpus.

---

# 9. Machine-Readable Corpus State

Maintain:

```text
corpus-manifest.json
```

Example:

```json
{
  "processedRepositories": 3,
  "totalRepositories": 134,
  "cumulativeLines": 1353,
  "repositories": [
    {
      "index": 1,
      "name": "SQL-Problems",
      "readmePath": "repositories/repo-001-SQL-Problems/README.md",
      "readmeLines": 314,
      "cumulativeLines": 314,
      "collaborationType": "individual-project"
    }
  ]
}
```

`corpus-manifest.json` and `LINE-COUNTS.md` must agree.

---

# 10. Progress Tracking

Maintain:

```text
PROGRESS.md
```

Example:

```markdown
# Portfolio RAG Corpus Progress

| Repo | Repository | README Lines | Cumulative Lines | Collaboration Type | Status |
|---:|---|---:|---:|---|---|
| 001 | SQL-Problems | 314 | 314 | individual-project | Complete |
| 002 | Project-X | 428 | 742 | course-group-project | Complete |
```

`PROGRESS.md` tracks workflow state.

`LINE-COUNTS.md` tracks corpus line-count state.

---

# 11. README Philosophy

Each repository README is a **portfolio-grade analytical representation of the evidence actually present in that project**.

It should answer:

1. What is this project?
2. What does it actually do?
3. What engineering is concretely represented?
4. What technologies and disciplines are concretely represented?
5. What can reasonably be attributed personally versus collaboratively?
6. Where does this project sit in the historical portfolio?

Do not force the README to answer questions for which the repository provides no evidence.

---

# 12. No Maturity Scores

Do not assign synthetic scores such as:

```text
Project maturity: 4.7/5
Testing maturity: 4.9/5
Architecture maturity: 4.8/5
```

Do not create subjective tags such as:

```text
high-maturity
excellent-architecture
expert-react
best-project
elite-engineering
```

Preserve evidence.

Let later RAG queries perform comparative reasoning.

---

# 13. Repository Identity

Every README begins with:

```markdown
# <Repository Name>

## Repository Identity
```

Include only factual fields that can actually be established.

Potential fields include:

* repository number,
* repository name,
* start/creation date,
* latest update date,
* project type,
* technical field,
* domain,
* context,
* status,
* collaboration type,
* team size,
* personal role.

Example:

```markdown
## Repository Identity

- Repository: 123 / 134
- Name: LInC-Church-Management
- Period: April 2026 – September 2026
- Primary Type: Full-stack web application
- Domain: Church operations and ministry management
- Context: Real-world operational product
- Collaboration Type: Individual Project
```

If a particular identity field cannot be established, **omit that field**.

Do not write:

```text
Team Size: Unknown
Deployment: Not found
```

---

# 14. Collaboration and Authorship Context

Include this section when meaningful collaboration/authorship evidence exists.

Discuss positively evidenced facts such as:

* individual ownership,
* group structure,
* team size,
* role,
* personally implemented areas,
* shared areas,
* supplied course infrastructure,
* research collaboration.

Example:

```markdown
## Collaboration and Authorship Context

This was a four-person course project. Repository evidence attributes
the parser and graph-analysis logic to the repository owner, while the
UI was developed collaboratively.
```

Do not turn this into a catalogue of unknown authorship.

---

# 15. What This Project Is

Write a substantial narrative explaining:

* what the project is,
* why it exists,
* what problem it addresses,
* what it does,
* who or what it serves,
* its academic/research/product/engineering context.

This should be grounded in actual project evidence.

---

# 16. Project Scope

Describe positively evidenced project scope.

Potential content:

* major modules,
* workflows,
* experiments,
* subsystems,
* services,
* datasets,
* applications,
* hardware components,
* user groups,
* processing stages.

Do not list categories the project lacks.

---

# 17. Architecture and System Shape

If meaningful architecture is evidenced, explain it.

Potential dimensions include:

* frontend,
* backend,
* API,
* persistence,
* storage,
* authentication,
* authorization,
* state management,
* infrastructure,
* hardware topology,
* networking,
* data flow,
* external providers,
* deployment topology.

Only discuss layers that actually exist.

Use text-native diagrams when useful.

Example:

```text
React frontend
      ↓
Hono API
      ↓
Domain services
      ↓
Firebase persistence
```

Do not create placeholder boxes for nonexistent layers.

---

# 18. Technical Stack

Include technologies actually used.

For each important technology explain **how it is used**.

Example:

```markdown
### Playwright

Used for browser-level end-to-end validation of public application
journeys and authorization boundaries.
```

Do not simply dump dependency names.

Do not mention absent technologies.

---

# 19. Major Engineering Work

Describe significant engineering work actually evidenced.

Examples may include:

* authentication,
* authorization,
* migrations,
* complex UI state,
* APIs,
* scheduling,
* notifications,
* caching,
* concurrency,
* hardware integration,
* networking,
* signal processing,
* statistical analysis,
* RAG,
* AI,
* storage,
* experiment automation,
* deployment automation,
* PDF/report generation.

Only create subsections for engineering work actually present.

For each one explain:

* what problem existed,
* what was implemented,
* how it works,
* why it matters technically.

---

# 20. Testing and Verification

Only include verification forms that are positively evidenced.

Potential subsections include:

```text
Unit Testing
Integration Testing
End-to-End Testing
Static Verification
CI Validation
Smoke Testing
Production Verification
Experimental Reproducibility
Statistical Validation
External Correctness Oracle
```

But **do not instantiate all of them**.

Example:

If the repository only uses LeetCode:

```markdown
## Verification

### External Correctness Oracle

Solutions were evaluated through LeetCode acceptance...
```

Do not add:

```markdown
### Unit Testing
Not found.

### E2E Testing
Not found.
```

If LinC contains Playwright, then write about Playwright.

If another repository does not, Playwright should not appear in that README at all.

---

# 21. Engineering Practices

Discuss only evidenced practices.

Examples:

* modularity,
* separation of concerns,
* defensive programming,
* validation,
* type safety,
* reproducibility,
* CI/CD,
* versioning,
* migration handling,
* maintainability,
* documentation,
* dependency management,
* security controls,
* release automation.

No negative checklist.

---

# 22. Product Engineering

Include this section only where meaningful product-engineering evidence exists.

Possible evidence:

* real users,
* user roles,
* operational workflows,
* booking,
* administration,
* notifications,
* stakeholder requirements,
* accessibility,
* localization,
* governance,
* production workflows,
* support processes.

For a repository that is merely an algorithm exercise, omit Product Engineering entirely.

Do not write:

> Product engineering is not applicable.

Just omit it.

---

# 23. Scale and Complexity

Discuss scale dimensions that have actual evidence.

Possible subsections:

```text
Implementation Scale
Product Scale
Operational Scale
Data Scale
Experimental Scale
Conceptual Complexity
```

Only include the relevant ones.

Do not create an empty five-category scale template.

---

# 24. Skills Demonstrated

List actual evidenced skills.

Group them according to what exists.

Possible categories include:

```text
Languages
Frontend
Backend
Databases
APIs
Cloud
Testing
DevOps
Security
Architecture
Systems Engineering
Research
Data Analysis
Machine Learning
Networking
Embedded Systems
Hardware
Product Engineering
Domain Knowledge
```

Again:

**only include categories containing real evidence.**

Do not write:

```markdown
## Machine Learning

No ML found.
```

Omit the category.

---

# 25. Evidence Strength

Where useful, qualify a **positive** skill claim with evidence strength:

```text
Strong evidence
Moderate evidence
Limited evidence
Shared authorship
Personally attributable
Repository-level evidence
```

Example:

```markdown
- Playwright — Strong evidence; explicit browser-level test suites and CI workflow.
```

Do not create entries such as:

```text
Kubernetes — No evidence
Observability — No evidence
```

---

# 26. Capability Developed

Where historical evidence supports it, describe meaningful capability development.

Examples:

* progression from static web pages to stateful applications,
* introduction of backend systems,
* first explicit browser E2E,
* adoption of CI,
* growth in experimental automation,
* introduction of authorization-aware architecture,
* expansion into cloud deployment.

Only describe transitions evidenced by this repository and previously processed context.

---

# 27. Portfolio Evolution Context

Use previous chronological corpus state to identify meaningful **positive transitions**.

Examples:

> This is the earliest processed repository so far containing explicit browser-level E2E testing.

> React appears again here, now within a considerably broader full-stack architecture.

> Statistical experiment automation becomes substantially more explicit in this repository.

Do not write lists like:

```text
Still no CI.
Still no E2E.
Still no observability.
```

Portfolio evolution tracks **emergence and strengthening**, not repeated absence.

---

# 28. Historical Significance

Include historically meaningful positive facts when supported.

Examples:

* earliest observed React project,
* earliest observed backend,
* earliest explicit E2E suite,
* first production deployment,
* first research collaboration,
* first cloud-native application,
* first hardware project,
* first individually attributable use of a technology.

Only make “first” claims against the already processed chronological corpus.

During incomplete corpus processing use:

> earliest observed in the processed corpus so far

when appropriate.

---

# 29. No Mandatory Limitations Section

Do **not** create a section called:

```text
Limitations and Missing Evidence
```

Do not enumerate missing technologies or practices.

This section is intentionally removed from the corpus format.

If uncertainty affects a **positive claim**, qualify that claim locally.

Example:

> The repository contains `public_tests.py`, although the course structure suggests the harness may have been supplied.

That is useful.

This is not:

> E2E testing was not found.

---

# 30. Overall Repository Narrative

Conclude the analytical prose with a substantial integrated narrative covering **what is actually evidenced**.

Synthesize:

* purpose,
* scope,
* architecture,
* significant engineering,
* technologies,
* engineering practices,
* product or research context,
* collaboration,
* historical significance.

Do not pad the narrative by discussing capabilities the repository lacks.

---

# 31. Final Section: Project Tags

The final section must be:

```markdown
# Project Tags
```

This section is mandatory.

Tags must represent **only positively evidenced properties**.

A repository that contains React and TypeScript may have:

```text
react
typescript
frontend-web-development
```

A repository without Playwright must contain **no Playwright-related tag**.

A repository without CI must contain **no CI-related tag**.

---

# 32. Tag Organization

Use only tag groups that contain at least one tag.

Possible groups include:

```text
Project Type
Collaboration and Authorship
Languages
Frontend
Backend
Database and Data
Architecture
APIs
Authentication and Security
Testing and Verification
DevOps and Delivery
Cloud and Infrastructure
Systems Engineering
Product Engineering
Research
Machine Learning
Networking
Embedded and Hardware
AI
Integrations
Software Engineering Practices
Domain
Portfolio Significance
```

Never generate an empty tag heading.

---

# 33. Canonical Tags

Tags use lowercase kebab-case.

Examples:

```text
full-stack-web-application
react
typescript
hono
cloudflare-workers
firebase-authentication
browser-e2e-testing
playwright
ci-e2e
role-based-access-control
production-deployment
statistical-validation
group-project
research-collaboration
```

Use established canonical vocabulary whenever available.

---

# 34. TAG-ONTOLOGY.md

Maintain:

```text
TAG-ONTOLOGY.md
```

Each canonical tag should define what positive evidence qualifies for it.

Example:

```markdown
## browser-e2e-testing

Meaning:
Browser-level tests exercising meaningful application journeys.

Positive evidence may include:
- Playwright test suites
- Cypress end-to-end suites
- comparable real browser automation

Do not infer solely from:
- package presence
- future plans
```

The ontology should primarily define **what qualifies**, not turn into a massive catalogue of absence rules.

---

# 35. Factual Tags Only

Allowed:

```text
react
spring-boot
firebase
cloudflare-workers
playwright
browser-e2e-testing
ci
production-deployment
wireless-networking
statistical-analysis
embedded-systems
rest-api
group-project
shared-authorship
```

Forbidden subjective tags:

```text
high-maturity
expert-react
best-project
excellent-project
elite-engineering
very-complex
```

---

# 36. Retrieval-Friendly Language

Prefer:

> The repository contains browser-level Playwright E2E tests executed through GitHub Actions.

Not:

> Testing is advanced.

Prefer:

> The backend uses Hono on Cloudflare Workers with Zod request validation.

Not:

> Backend maturity is high.

Prefer:

> The project coordinates repeated wireless experiments and statistical analysis.

Not:

> Research skills are excellent.

Concrete positive facts are the RAG substrate.

---

# 37. Never Pollute Retrieval With Negative Evidence

Negative statements are especially dangerous because vector retrieval may surface them when the user asks about the very capability they deny.

For example, dozens of documents saying:

```text
E2E not found
```

could contaminate a query for:

> Which projects contain E2E?

Therefore:

**absence must normally be represented by absence from the README and absence from the tag list.**

This is deliberate.

The RAG can determine projects with a capability by retrieving positive evidence or canonical tags.

It does not need every other repository to announce that it lacks the capability.

---

# 38. Global Claims

Never mistake partial retrieval or partial processing for global corpus truth.

Say:

> Seven React projects have been positively identified among processed repositories.

Do not say:

> There are seven React projects in the portfolio.

until the whole relevant corpus has been classified.

---

# 39. Chronological State

Maintain positive first-occurrence and recurrence state such as:

```text
earliest_observed.react
earliest_observed.playwright
earliest_observed.spring_boot
earliest_observed.ci
earliest_observed.production_deployment
earliest_observed.group_project
earliest_observed.research_collaboration
earliest_personally_attributable.react
```

Do not maintain giant negative histories such as:

```text
repo 1: no CI
repo 2: no CI
repo 3: no CI
```

That information is unnecessary.

---

# 40. Evidence Hierarchy

Prefer evidence approximately in this order:

1. actual implementation,
2. actual tests,
3. configuration,
4. CI/CD workflows,
5. deployment files,
6. schemas and migrations,
7. architecture documentation,
8. repository documentation,
9. commit history,
10. contributor history,
11. dependency or filename presence alone.

Use the strongest evidence available.

---

# 41. Contradictory Evidence

If a positive claim is contradicted by stronger repository evidence, resolve it accurately.

Example:

> Documentation mentions authenticated E2E coverage, but the inspected current suite contains anonymous-browser scenarios only. The README therefore describes the positively verified anonymous E2E layer rather than claiming broader authenticated coverage.

Do not expand this into a separate negative inventory.

---

# 42. Coursework and Supplied Infrastructure

If a repository contains meaningful supplied infrastructure, qualify positive claims locally.

Example:

> The project operates with local automated tests through `public_tests.py`; course structure indicates that this harness was likely supplied.

Still write about the actual positive experience:

* local tests existed,
* the implementation was verified locally.

But do not inflate supplied infrastructure into personal authorship.

---

# 43. Group Project Rules

For group projects distinguish where evidence supports it:

```text
Personally attributable
Shared/team attributable
Repository-level capability
Externally supplied
```

Example:

```markdown
### Spring Backend

The repository contains a Spring backend. Commit and project evidence
attribute the controller and persistence work to the repository owner.
```

Or:

```markdown
### React Frontend

The repository contains a React frontend developed as part of the team
project. Available evidence supports repository-level React exposure but
does not isolate ownership of every frontend component.
```

Do not add a list of unrelated technologies whose ownership is unknown.

---

# 44. Quality Requirement

Do not deliberately shorten later repository analyses because the corpus is becoming large.

Every project receives depth proportional to its actual information density.

A simple repository may naturally produce a short README.

A large product may produce a very long README.

Do not pad simple projects with negative findings just to increase length.

That is especially important.

Line count is a **diagnostic**, not a target.

---

# 45. LINE-COUNTS.md Quality Monitoring

Use line counts to detect suspicious compression across comparable repositories.

Do not use line counts to force equal length.

For example:

A 100-line SQL exercise repository may legitimately receive far less documentation than a large production full-stack application.

The question is:

> Is the README complete relative to what exists?

not:

> Did every repository receive 700 lines?

---

# 46. Required Repository Report

For every repository processed, report:

```text
Repository index
Repository name
Start date
Latest update date
Collaboration type
README line count
Previous cumulative lines
New cumulative lines
```

Example:

```text
Repository: 123 / 134
Name: LInC-Church-Management
Start date: 2026-04-29
Latest update: 2026-09-06
Collaboration: individual-project
README lines: 742
Previous cumulative lines: 31,584
New cumulative lines: 32,326
```

Only report a field such as collaboration type when established.

---

# 47. Required Iteration Summary

At the end of each iteration report:

```text
Completed this iteration: X
Total completed: Y / 134
Remaining: Z
Cumulative README lines: N
portfolio-rag commit: <commit>
Next repository: <repository>
```

Also retain the individual repository reports.

---

# 48. Commit and Push Behavior

After each agreed batch:

1. verify generated READMEs;
2. verify line counts;
3. update `LINE-COUNTS.md`;
4. update `PROGRESS.md`;
5. update `corpus-manifest.json`;
6. update `TAG-ONTOLOGY.md` if required;
7. inspect changed files;
8. commit intended changes;
9. push to `portfolio-rag`;
10. report commit identifier.

Example commit messages:

```text
docs(rag): add repository analyses 001-012
```

```text
docs(rag): expand repository analyses 061-072
```

---

# 49. Resume Behavior

When the user says:

```text
continue
```

do not restart.

Read persistent state from `portfolio-rag`:

```text
PROGRESS.md
LINE-COUNTS.md
corpus-manifest.json
TAG-ONTOLOGY.md
```

Then continue from the next unprocessed repository.

Repository state is authoritative over conversational memory.

---

# 50. Revision Handling

When revising an already processed repository:

1. preserve all unrelated repository READMEs;
2. regenerate the target README;
3. read its previous line count;
4. compute the new line count;
5. update cumulative total using subtraction + replacement;
6. update `LINE-COUNTS.md`;
7. update `PROGRESS.md` if needed;
8. update `corpus-manifest.json`;
9. update tags if the positive evidence changed;
10. commit;
11. push.

Do not duplicate historical README versions; Git history already preserves them.

---

# 51. Completion Check

Before marking a repository complete, **inspect** all relevant areas such as:

* identity and dates,
* project purpose,
* collaboration,
* scope,
* architecture,
* stack,
* major engineering work,
* testing,
* delivery,
* security,
* data,
* infrastructure,
* research,
* product concerns,
* skills,
* historical significance,
* tags.

But this is an **inspection checklist, not an output checklist**.

This distinction is critical.

You must inspect whether CI/CD exists.

If it does, document it.

If it does not, **write nothing about CI/CD**.

You must inspect whether E2E exists.

If it does, document it.

If it does not, **write nothing about E2E**.

You must inspect whether observability exists.

If it does, document it.

If it does not, **write nothing about observability**.

The analysis should be comprehensive in inspection while selective in output.

---

# 52. Final Objective

At completion:

```text
portfolio-rag/
├── repositories/
│   ├── repo-001-.../
│   │   └── README.md
│   ├── ...
│   └── repo-134-.../
│       └── README.md
├── PROGRESS.md
├── LINE-COUNTS.md
├── TAG-ONTOLOGY.md
└── corpus-manifest.json
```

The RAG should then answer questions such as:

```text
Which projects contain explicit E2E testing?

Which repositories use React?

When does CI first appear?

Which projects contain statistical experiment automation?

Which repositories use Spring?

Which projects are collaborative?

Which projects are individually owned?

How did backend architecture evolve?

How did testing discipline evolve?

Which projects contain production deployments?
```

It should answer using **positive repository evidence and canonical tags**, not thousands of generated statements describing what projects do not contain.

---

# 53. Start Procedure

Before beginning:

1. inspect `portfolio-rag`;
2. establish repository order;
3. determine total repository count;
4. load or initialize `PROGRESS.md`;
5. load or initialize `LINE-COUNTS.md`;
6. load or initialize `corpus-manifest.json`;
7. load or initialize `TAG-ONTOLOGY.md`;
8. establish cumulative line state;
9. identify the next unprocessed repository.

For each repository:

1. inspect the repository comprehensively;
2. identify positively evidenced characteristics;
3. determine collaboration/authorship evidence;
4. generate an adaptive README containing only relevant sections;
5. generate factual tags;
6. count README lines;
7. update cumulative state.

At iteration end:

1. validate changes;
2. commit;
3. push to `portfolio-rag`;
4. report per-repository progress;
5. report cumulative line count;
6. report commit;
7. identify the next repository.

---

# 54. Absolute Output Rule

**Inspect broadly. Write selectively.**

The agent must search for:

* tests,
* E2E,
* CI/CD,
* deployment,
* databases,
* security,
* cloud,
* AI,
* product workflows,
* research methods,
* architecture,
* and other relevant engineering dimensions.

But the generated README contains **only the dimensions positively supported by evidence**.

Therefore:

```text
not found → omit
not applicable → omit
no evidence → omit
found → document thoroughly
found but attribution uncertain → document the positive capability and qualify attribution locally
```

Never turn repository analysis into a missing-feature checklist.

The absence of a tag or section is sufficient representation of absence.

---

# 55. Final Operating Principle

The corpus should maximize the density of **useful positive evidence**.

Every line should help answer:

> What did this repository actually contain, do, demonstrate, or introduce?

Not:

> What could the repository theoretically have contained but did not?

That distinction must govern every generated README, every tag, every historical statement, and every RAG-oriented corpus decision.
