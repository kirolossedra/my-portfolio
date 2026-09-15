# George-Sedra-Website

## Repository Identity

- Repository: 102 / 134
- Name: `George-Sedra-Website`
- Repository start date: 2025-12-24
- Last meaningful update date: 2026-09-06
- Latest meaningful commit: `341f1aa31bf8d383f5f4d3b448175347891e84bf`
- Primary type: Full-stack company consulting website and business-workflow API
- Technical field: React frontend engineering, TypeScript backend engineering, serverless APIs, relational persistence
- Application domain: Engineering, environmental, real-estate, careers, contact, and project-inquiry workflows
- Collaboration type: `individual-project`
- Primary languages: TypeScript, TSX, SQL, CSS
- Frontend framework/tooling: React 19, React Router, Vite, ESLint
- Backend framework/tooling: Hono, Cloudflare Workers tooling, Wrangler
- Persistence model: Cloudflare D1 relational schema with resume data stored as Base64
- Current source state: Responsive frontend plus implemented API/backend foundation

## Collaboration and Authorship Context

The current repository history is owner-driven, and the latest backend/resume-storage work is explicitly authored and committed by the repository owner. The corpus therefore treats the application architecture, frontend implementation, backend repositories/routes, relational schema, validation layer, and integration decisions as personally attributable repository work.

The company/service content itself is domain content presented by the website. The engineering claim is the software system that structures and serves that content.

## Evidence Basis

The analysis is grounded in:

- root `README.md`;
- current recursive repository tree;
- `package.json`;
- `src/App.tsx` and frontend page/component/data structure;
- `api/src/index.ts`;
- public and admin Hono route modules;
- API database repository modules;
- authentication, CORS, request-ID, and validation modules;
- D1 migration and seed SQL;
- resume service code;
- Wrangler/TypeScript/ESLint configuration;
- commit history through the September 6, 2026 backend expansion and Base64-resume correction.

The latest commit changes resume persistence from a bucket-oriented design to D1-only Base64 storage, making the current persistence model a deliberate architectural choice rather than a repository-name inference.

## What This Project Is

`George-Sedra-Website` is a React/TypeScript company website that evolved into a two-layer full-stack system.

The frontend presents consulting services and business-facing workflows. It contains dedicated routes for:

- home;
- engineering services;
- environmental services;
- real-estate services;
- careers;
- individual job details;
- job applications;
- about;
- contact;
- fallback/not-found behavior.

The backend is a Hono API structured for Cloudflare Workers and Cloudflare D1. It models job publishing, candidate applications, resumes, contact requests, project inquiries, and administrator review workflows.

The repository therefore goes substantially beyond a static brochure site: it models operational business entities and lifecycle transitions behind a public consulting interface.

## Project Scope

### Public Website

The React application includes:

- service-line navigation;
- engineering service presentation;
- environmental Phase I / Phase II service presentation;
- real-estate service presentation;
- careers listing;
- job-detail routing;
- job-application interface;
- contact interface;
- about/company presentation;
- responsive layout behavior.

### Careers Domain

The backend supports a structured careers workflow around:

- job records;
- publish/draft/closed/archive lifecycle states;
- ordered responsibility items;
- ordered qualification items;
- public published-job retrieval;
- job filtering by department;
- application creation;
- application review status;
- application status history;
- resume metadata and payload persistence.

### Inquiry Domain

The backend separately models:

- general contact requests;
- structured project inquiries;
- service-line selection;
- sub-service fields;
- property/location context;
- desired timeline;
- administrative review status.

### Administrative Domain

Bearer-protected administration routes support:

- job listing and filtering;
- job creation;
- job editing;
- job archival;
- application listing;
- application detail retrieval;
- application status transitions;
- resume download;
- contact-request listing;
- project-inquiry listing;
- status updates for requests and inquiries.

## Architecture and System Shape

```text
React + TypeScript + Vite
        |
        +-- public company/service routes
        +-- careers / job detail / apply routes
        +-- contact and business inquiry interfaces

Hono API boundary
        |
        +-- request ID middleware
        +-- security headers
        +-- configured CORS
        +-- logging
        |
        +-- /api/v1 public routes
        |     +-- published jobs
        |     +-- job detail
        |     +-- applications
        |     +-- contact requests
        |     +-- project inquiries
        |
        +-- /api/v1/admin routes
              +-- bearer authentication
              +-- job lifecycle
              +-- application review
              +-- resume retrieval
              +-- request/inquiry workflow

Cloudflare D1
        |
        +-- jobs
        +-- responsibilities
        +-- qualifications
        +-- applications
        +-- application resumes
        +-- application status history
        +-- contact requests
        +-- project inquiries
```

The application separates UI routing, API routing, domain validation, database repositories, middleware, services, and relational schema.

## Technical Stack

### React 19 + React Router

The frontend uses React component composition and React Router route declarations for the major company and careers pages.

### TypeScript

TypeScript is used across the React frontend and Hono backend, including typed environment bindings, domain statuses, repository return values, validation inputs, and Worker-facing API code.

### Vite

Vite provides frontend development, production build, and preview workflows.

### Hono

Hono implements the serverless API surface, routing, middleware composition, body limits, response handling, and Worker entrypoint.

### Cloudflare Workers Tooling

Wrangler scripts are defined for:

- local API development;
- Worker deployment;
- Worker environment type generation;
- D1 migration execution;
- D1 local seeding.

### Cloudflare D1 / SQL

The schema uses SQLite-compatible D1 SQL with:

- strict tables;
- primary keys;
- foreign keys;
- cascading deletes where appropriate;
- unique slugs;
- status `CHECK` constraints;
- file-type and resume-size constraints;
- query-supporting indexes.

### ESLint + TypeScript Project Builds

The repository exposes combined lint/build/typecheck commands through `npm run check`, `npm run api:typecheck`, and `npm run check:all`.

## Major Engineering Work

### Responsive React Consulting Frontend

The repository replaces a simple company-site shape with a routed React platform covering multiple consulting service lines and careers.

The route table is explicit rather than dynamically inferred, giving business areas stable URLs and distinct page responsibilities.

### Careers Data Modeling

The D1 schema models jobs as operational records instead of flat page content.

A job contains:

- identifier and unique slug;
- title and department;
- location;
- employment type;
- work mode;
- summary and full description;
- lifecycle status;
- publication timestamps.

Responsibilities and qualifications are normalized into ordered child tables.

### Job Application Workflow

Applications are tied to jobs through foreign keys and include:

- applicant identity/contact fields;
- portfolio URL;
- interest statement;
- experience statement;
- consent timestamp;
- explicit review status.

Application status history records transitions separately, enabling lifecycle tracking rather than destructive state replacement without history.

### Resume Persistence in D1

The current architecture stores resume payloads in the `application_resumes` table as Base64.

Important implementation choices include:

- separate resume table rather than embedding the large payload into the main application row;
- PDF/DOC/DOCX content-type restriction;
- maximum decoded size of 1 MB;
- stored metadata for file name, type, size, and creation time;
- protected download path that reconstructs bytes from Base64;
- content-disposition sanitization for downloaded names;
- `private, no-store` cache policy.

### Public API Routes

The public API implements:

- published job collection;
- job lookup by slug;
- application submission;
- contact-request submission;
- project-inquiry submission.

Applications are checked against a currently published job before persistence.

### Admin API Routes

Administrator routes expose operational workflows rather than a single generic CRUD endpoint.

The code supports:

- pagination;
- status filters;
- job filters;
- job create/update/archive;
- application detail and review-state transitions;
- resume downloads;
- contact/project inquiry queues;
- request status transitions.

### Bearer-Protected Administration

Admin middleware reads `ADMIN_API_TOKEN` from the Worker environment and compares it against a Bearer token from the request.

This provides a clear trust boundary between public endpoints and internal business operations.

### Shared Request Validation

The backend contains dedicated validation modules for:

- common values and pagination;
- jobs;
- applications;
- contact requests;
- project inquiries.

The latest commit series specifically adds and expands shared payload validation before database operations.

### Request Tracing and Error Envelopes

The Hono entrypoint adds request-ID middleware and includes the request ID in successful/error response handling.

Structured `ApiError` handling maps domain failures into HTTP status/code/message responses.

### Security Headers and CORS

`secureHeaders()` is applied globally, while configured CORS is scoped to the API path.

### D1 Health Check

The health route performs `SELECT 1 AS ok` through D1, which checks the API/database path rather than returning an unconditional static health string.

### Prototype Seed Separation

Prototype job seed data is kept under `api/seed/` separately from the migration schema, making schema creation independent from sample business records.

## Verification

### Configured Frontend Checks

The project exposes:

```text
npm run lint
npm run build
npm run check
```

with `check` combining ESLint and the TypeScript/Vite production build.

### Configured Backend Checks

The backend exposes:

```text
npm run api:typecheck
npm run check:all
```

where `check:all` combines frontend lint/build and API typechecking.

### Schema Execution Evidence

Repository implementation notes record D1-compatible schema execution/validation against SQLite and TypeScript syntax checking during the backend construction work.

### Compile-Time Structure

Separate frontend and API TypeScript configurations provide a static validation boundary between browser and Worker code.

## Engineering Practices

### Layered Backend Design

Persistence, routing, middleware, services, validation, domain types, and error handling are separated rather than concentrated in the Worker entrypoint.

### Database Constraints as Domain Guardrails

Business invariants are represented in SQL through:

- enumerated status checks;
- department checks;
- employment-type checks;
- work-mode checks;
- resume content-type checks;
- resume size checks;
- foreign-key relationships.

### Soft Lifecycle Handling

Job deletion is implemented as archival behavior through the repository/service path, preserving lifecycle semantics.

### Human-Review Workflow Modeling

Applications expose explicit human-review states and status history.

### Minimal-Payload Listing

Resume binary/Base64 data is separated from ordinary application listing/detail metadata, reducing the amount of large file content moved through routine queries.

### Input Validation Before Persistence

Public and admin payloads pass dedicated parsers before reaching database repositories.

### Explicit Error Taxonomy

Domain failures use stable codes such as job/application/resume not found and empty update conditions.

### Environment-Based Secrets

The admin token is read from environment bindings rather than embedded in source.

### Incremental Architectural Evolution

Commit history shows a clear sequence:

1. React consulting frontend rebuild;
2. Hono backend foundation;
3. Worker/API entrypoint;
4. authentication and CORS;
5. database repositories;
6. admin/public routes;
7. shared validation;
8. D1-only Base64 resume correction.

That history provides evidence of architecture being built in layers rather than appearing as one undifferentiated source dump.

## Product Engineering

The software maps website pages to actual company workflows.

### Service Discovery

Three major service domains are given dedicated user journeys.

### Hiring Funnel

The careers surface connects:

```text
careers list
   ↓
job detail
   ↓
application form
   ↓
application persistence
   ↓
human-review status workflow
```

### Lead Intake

Contact requests and project inquiries are modeled separately, allowing a simple contact message and a structured project lead to have different data shapes.

### Administrative Operations

The API provides queues and state transitions for staff-facing processing of jobs, candidates, contact requests, and project inquiries.

## Scale and Complexity

### Source Scale

The repository contains both frontend and backend source, configuration, SQL migrations, seed data, static assets, and architecture/change documentation.

### Domain Scale

The backend models four business workflow families:

- jobs;
- applicants;
- contact leads;
- project inquiries.

### Data-Model Complexity

Multiple normalized tables, foreign keys, indexes, status histories, and constrained enum-like fields create meaningful relational complexity.

### API Complexity

Public and administrative surfaces have different authentication, payload, pagination, and response needs.

### Operational Complexity

The project includes local development, frontend build, API typechecking, D1 migration, local seeding, Worker deployment tooling, and environment-bound secrets.

## Skills Demonstrated

### Frontend

- **React — strong evidence.**
- **TypeScript/TSX — strong evidence.**
- **React Router — strong evidence.**
- **Responsive company-website construction — strong evidence.**
- **Multi-page SPA routing — strong evidence.**

### Backend

- **Hono — strong evidence.**
- **REST-style route design — strong evidence.**
- **Cloudflare Workers-oriented backend structure — strong evidence.**
- **Middleware composition — strong evidence.**
- **Structured error handling — strong evidence.**
- **Payload validation — strong evidence.**
- **Bearer-token authorization — strong evidence.**

### Data

- **Cloudflare D1 / relational SQL — strong evidence.**
- **Schema migration design — strong evidence.**
- **Foreign keys and relational normalization — strong evidence.**
- **Indexes and database constraints — strong evidence.**
- **Repository-layer SQL access — strong evidence.**
- **Lifecycle/history modeling — strong evidence.**
- **Base64 file persistence — strong evidence.**

### Delivery and Quality

- **Vite — strong evidence.**
- **ESLint — strong evidence.**
- **TypeScript build/typecheck workflows — strong evidence.**
- **Wrangler — strong evidence.**
- **D1 migration/seeding commands — strong evidence.**

## Capability Developed

This repository is a major full-stack expansion in the processed chronology.

Earlier personal sites established browser and portfolio capabilities; this project turns a company website into a structured business system with:

- typed frontend routes;
- backend APIs;
- protected administration;
- relational persistence;
- file handling;
- business-state workflows;
- schema constraints;
- deployment-oriented serverless tooling.

The engineering object is no longer only a page or utility. It is a product architecture that connects public interactions to persistent business operations.

## Portfolio Evolution Context

Within the processed corpus, this repository is the clearest evidence so far of combining:

- React/TypeScript SPA work;
- Hono backend development;
- Cloudflare Workers conventions;
- Cloudflare D1 relational persistence;
- public/admin API separation;
- database repositories;
- structured request validation;
- application-status history;
- business lead/careers workflows;
- D1 Base64 document storage.

It also demonstrates later-stage defensive thinking around constraints, validation, file-size limits, protected downloads, environment secrets, request tracing, and operational lifecycle states.

## Historical Significance

`George-Sedra-Website` marks a transition from frontend company presentation toward full-stack business software.

Its chronology is particularly useful because the repository begins as a website and later gains a serverless backend and persistence architecture without discarding the original product surface.

The September 2026 commit sequence provides strong evidence of deliberate backend decomposition and business-domain modeling.

## Overall Repository Narrative

`George-Sedra-Website` is a full-stack consulting-company platform built from a React/TypeScript frontend and a Hono/Cloudflare backend.

The frontend gives engineering, environmental, real-estate, careers, contact, and company content dedicated routes. The backend models the operational data behind jobs, applications, resumes, contacts, and project inquiries.

Cloudflare D1 provides normalized relational persistence with strict constraints and indexes. Public endpoints accept business inputs; admin endpoints provide protected review and lifecycle operations. Dedicated validation, error handling, middleware, repository modules, request IDs, and Base64 resume persistence demonstrate a materially more structured engineering style than a simple brochure site.

# Project Tags

## Project Type

- `full-stack-application`
- `company-website`
- `business-workflow-application`
- `consulting-platform`
- `careers-platform`
- `individual-project`

## Collaboration and Authorship

- `individual-project`
- `owner-attributed-source`

## Languages

- `typescript`
- `tsx`
- `sql`
- `css`

## Frontend

- `react`
- `react-router`
- `vite`
- `single-page-application`
- `responsive-web-design`
- `multi-route-frontend`

## Backend

- `hono`
- `rest-api`
- `cloudflare-workers`
- `public-api`
- `admin-api`
- `middleware`
- `request-id`
- `structured-errors`
- `bearer-token-authentication`
- `cors`
- `secure-headers`
- `payload-validation`

## Database and Data

- `cloudflare-d1`
- `relational-database`
- `sql-migrations`
- `foreign-keys`
- `database-indexes`
- `check-constraints`
- `repository-pattern`
- `status-history`
- `base64-file-storage`
- `resume-storage`

## Product Engineering

- `job-posting-workflow`
- `job-application-workflow`
- `human-review-workflow`
- `contact-request-workflow`
- `project-inquiry-workflow`
- `job-archival`
- `pagination`

## DevOps and Quality

- `wrangler`
- `eslint`
- `typescript-typecheck`
- `production-build`
- `d1-migrations`
- `database-seeding`
- `environment-secret`

## Portfolio Significance

- `earliest-observed-hono`
- `earliest-observed-cloudflare-d1`
- `earliest-observed-business-workflow-api`
- `earliest-observed-d1-base64-document-storage`
- `earliest-observed-public-admin-api-separation`
