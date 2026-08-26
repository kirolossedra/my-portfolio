# Kirolos Portfolio

`kirolos.dev` is a React + TypeScript portfolio deployed to Netlify and backed by a TypeScript Cloudflare Worker with Cloudflare D1 as the persistence layer.

Milestones, long-form sections, and milestone photographs live in D1. Photographs are stored as Base64 text; the Worker decodes them and serves normal image responses.

## Architecture

```text
Browser
  |
  v
kirolos.dev
Netlify: React + TypeScript + Vite
  |
  | HTTPS
  v
kirolos-portfolio-api.linc-ministry.workers.dev
Cloudflare Worker: TypeScript
  |
  v
D1: kirolos-portfolio-db
  |- milestones
  |- milestone_sections
  |- milestone_images (Base64)
  `- auth_exchange_codes (short-lived OAuth handoff only)
```

Public visitors are read-only. Portfolio administration is restricted to one immutable GitHub numeric user ID through GitHub OAuth. There is no public registration, password database, Firebase Authentication, or multi-role user system.

## Repository layout

```text
src/                         React + TypeScript frontend
src/admin/                   private GitHub-authenticated admin workspace
shared/                      frontend/Worker contracts
worker/                      Cloudflare Worker API + OAuth
migrations/                  D1 schema migrations
scripts/                     authoring CLI and repository gates
examples/                    milestone payload templates
.github/workflows/           CI/CD gates and deployment
netlify.toml                 Netlify configuration
wrangler.jsonc               Worker + D1 configuration
```

## Install and verify

```bash
npm install
npm run verify
```

`npm run verify` rejects obsolete JavaScript files, R2 integration, and the removed permanent admin-token mechanism before running lint, strict TypeScript checks, tests, and a Wrangler dry-run bundle.

## Local frontend

```bash
npm run dev
```

The frontend reads `VITE_API_BASE_URL` when supplied and otherwise uses the production Worker URL.

## Local Worker

Authenticate Wrangler once:

```bash
npx wrangler login
```

Apply migrations locally:

```bash
npm run db:migrate:local
```

Copy `.dev.vars.example` to `.dev.vars` and populate local-only OAuth values, then:

```bash
npm run worker:dev
```

Never commit `.dev.vars`.

## GitHub OAuth administrator model

The private editor lives at:

```text
https://kirolos.dev/admin
```

The flow is:

```text
/admin
  -> Sign in with GitHub
  -> Worker creates signed OAuth state
  -> GitHub callback reaches Worker
  -> Worker exchanges authorization code server-side
  -> Worker fetches authenticated GitHub identity
  -> numeric GitHub user ID must equal ADMIN_GITHUB_USER_ID
  -> Worker creates a 2-minute, single-use D1 exchange code
  -> browser returns to /admin/auth/callback
  -> React exchanges code once
  -> Worker issues a signed 60-minute admin session
  -> session is held in sessionStorage
```

Only the configured immutable GitHub numeric ID can receive an admin session. A username change does not change the authorization identity.

The OAuth handoff code is stored only as a SHA-256 hash in D1 and is consumed transactionally. The GitHub access token is used only during the callback and is never persisted.

### Worker secrets

Production requires these Worker secrets:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `ADMIN_GITHUB_USER_ID`
- `SESSION_SECRET`

`GITHUB_CALLBACK_URL` is non-secret and is versioned in `wrangler.jsonc` as:

```text
https://kirolos-portfolio-api.linc-ministry.workers.dev/api/auth/github/callback
```

Set secrets through Wrangler rather than source control:

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put ADMIN_GITHUB_USER_ID
npx wrangler secret put SESSION_SECRET
```

The only unavoidable GitHub GUI bootstrap is creating the OAuth App with:

```text
Homepage URL: https://kirolos.dev
Authorization callback URL: https://kirolos-portfolio-api.linc-ministry.workers.dev/api/auth/github/callback
```

## Admin workspace

After OAuth is configured, `/admin` provides:

- list of draft and published milestones;
- create/edit/delete milestone metadata;
- year/month and deterministic display order;
- publish/draft state;
- short timeline description;
- expanded hover/touch description;
- full-story introduction;
- ordered long-form sections;
- Base64 photograph upload directly to D1;
- existing image deletion;
- short-lived session copy for CLI use.

No application password exists.

## D1 image storage

`milestone_images` stores:

- MIME type;
- Base64 image data;
- raw byte size;
- alt text;
- caption;
- ordering;
- cover flag.

The raw image limit is **1,310,720 bytes (1.25 MiB)** to keep the Base64-expanded row below D1's row/string limits with margin.

Supported formats:

- AVIF
- GIF
- JPEG
- PNG
- WebP

Public milestone JSON contains image URLs rather than Base64 payloads. `GET /api/images/:id` reads D1, decodes Base64 to an `ArrayBuffer`, and returns binary image bytes with the stored MIME type.

## Public API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Worker + D1 health |
| `GET` | `/api/milestones` | Published chronological timeline |
| `GET` | `/api/milestones/:slug` | Published milestone detail |
| `GET` | `/api/images/:id` | Published D1-backed image |

## Authentication API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/github` | Start GitHub OAuth |
| `GET` | `/api/auth/github/callback` | Server-side GitHub callback |
| `POST` | `/api/auth/exchange` | Consume one-time handoff code and issue session |
| `GET` | `/api/auth/session` | Validate current admin session |

## Admin API

All routes below require a valid GitHub-authenticated admin session in `Authorization: Bearer <session>` and enforce the configured frontend origin.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/milestones` | List drafts + published milestones |
| `POST` | `/api/admin/milestones` | Create milestone |
| `GET` | `/api/admin/milestones/:id` | Load milestone for editing |
| `PUT` | `/api/admin/milestones/:id` | Update milestone |
| `DELETE` | `/api/admin/milestones/:id` | Delete milestone |
| `PUT` | `/api/admin/milestones/:id/sections` | Replace ordered sections |
| `PUT` | `/api/admin/milestones/:id/images` | Replace image set |
| `POST` | `/api/admin/milestones/:id/images` | Add Base64 image |
| `DELETE` | `/api/admin/milestones/:id/images/:imageId` | Delete image |

## CLI milestone authoring

The CLI no longer accepts a permanent portfolio admin secret. Sign in at `/admin`, choose **Copy CLI session**, then set the short-lived OAuth-backed session:

PowerShell:

```powershell
$env:PORTFOLIO_ADMIN_SESSION='...'
```

Bash:

```bash
export PORTFOLIO_ADMIN_SESSION='...'
```

Then:

```bash
npm run milestone -- list
npm run milestone -- create examples/milestone.json
npm run milestone -- update 1 examples/milestone.json
npm run milestone -- sections 1 examples/milestone-sections.json
npm run milestone -- image-add 1 ./photo.jpg --alt="University campus" --cover
npm run milestone -- image-delete 1 42
npm run milestone -- delete 1
```

The session expires after 60 minutes; reauthenticate rather than maintaining a long-lived application credential.

## D1 migrations

The migration chain is:

```text
0001-initial-portfolio-schema.sql
0002-base64-milestone-images.sql
0003-github-oauth.sql
```

Production migrations are applied by GitHub Actions before the Worker deploy:

```bash
npm run db:migrate:remote
```

## CI/CD

`.github/workflows/portfolio-ci-cd.yml` runs on pull requests and pushes to `main`.

Quality gate:

```text
legacy-file gate
  -> no-R2 gate
  -> no-permanent-admin-token gate
  -> ESLint
  -> frontend TypeScript
  -> Worker TypeScript
  -> Vitest
  -> local D1 migration validation
  -> Vite production build
  -> Wrangler dry-run
```

A push to `main` continues only after the quality gate succeeds:

```text
apply remote D1 migrations
  -> deploy Cloudflare Worker
  -> build frontend
  -> deploy prebuilt dist/ to Netlify
```

Required GitHub Actions repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

OAuth runtime secrets belong to the Worker, not GitHub Actions or Netlify.

## Deployment ownership

The repository is the source of truth for application code, D1 migrations, Worker bindings, OAuth behavior, tests, and deployment gates. Cloudflare and Netlify dashboards are reserved mainly for observability and unavoidable account/bootstrap operations.
