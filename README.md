# Kirolos Portfolio

`kirolos.dev` is a React + TypeScript portfolio deployed to Netlify and backed by a TypeScript Cloudflare Worker with Cloudflare D1 as the single persistence layer.

Milestones, long-form sections, and milestone photographs all live in D1. Photographs are stored as Base64 text in the database; the Worker decodes them and serves normal image responses to the browser.

## Architecture

```text
Browser
  |
  v
kirolos.dev
Netlify: React + TypeScript + Vite
  |
  | HTTPS JSON/image API
  v
kirolos-portfolio-api.linc-ministry.workers.dev
Cloudflare Worker: TypeScript
  |
  v
D1: kirolos-portfolio-db
  |- milestones
  |- milestone_sections
  `- milestone_images (Base64 image data)
```

The public browser is read-only. Public content is fetched from the Worker. Administrative mutations are currently protected by a temporary server-side bearer token. The intended next authentication phase is a single-admin GitHub OAuth flow restricted to the portfolio owner's immutable GitHub user ID; the token is not embedded in the frontend.

## Repository layout

```text
src/                         React + TypeScript frontend
shared/                      API contracts shared by frontend and Worker
worker/                      Cloudflare Worker API
migrations/                  D1 schema migrations
scripts/                     CLI authoring and repository gates
examples/                    milestone payload templates
.github/workflows/           CI/CD gates and production deployment
netlify.toml                 Netlify SPA/deploy configuration
wrangler.jsonc               Worker + D1 configuration
```

## Install

```bash
npm install
```

## Local frontend

```bash
npm run dev
```

The frontend reads `VITE_API_BASE_URL` when provided and otherwise uses the production Worker URL.

## Local Worker

Authenticate Wrangler once:

```bash
npx wrangler login
```

Apply all D1 migrations to Wrangler's local database:

```bash
npm run db:migrate:local
```

Create `.dev.vars` from `.dev.vars.example` and use a long random temporary admin token, then run:

```bash
npm run worker:dev
```

## D1 image storage

Image binaries are converted to standard Base64 before they are written to `milestone_images.base64_data`.

The current raw-image limit is **1,310,720 bytes (1.25 MiB)**. This deliberately leaves room below D1's per-row size ceiling after Base64 expansion and metadata are included. Optimize portfolio photographs before upload rather than treating the database as an original-photo archive.

Supported image formats:

- AVIF
- GIF
- JPEG
- PNG
- WebP

The public API does not inject the Base64 payload into milestone JSON. Instead, milestone responses contain an image URL such as:

```text
/api/images/42
```

The Worker reads the Base64 value from D1, decodes it, and returns the original image bytes with the stored MIME type. This keeps the timeline JSON significantly smaller while still using D1 as the only image store.

## Production database migrations

The database and Worker already exist. The repository treats the migration directory and `wrangler.jsonc` as source of truth.

Apply remote migrations manually when needed:

```bash
npm run db:migrate:remote
```

Normal production migration and deployment are automated by GitHub Actions.

`0001-initial-portfolio-schema.sql` is historical and created the original image-metadata table. `0002-base64-milestone-images.sql` replaces that table with the Base64-backed schema. Because object storage was never enabled for this portfolio, the migration does not attempt to preserve unusable external-object references.

## Temporary admin authentication

Until GitHub OAuth is implemented, create the Worker secret once:

```bash
npx wrangler secret put ADMIN_API_TOKEN
```

Use a long random value. Never put it in source control or any `VITE_*` variable.

The temporary token exists only so the CLI and protected admin API can operate while the single-admin GitHub OAuth flow is being implemented. It is not the long-term authentication design.

## Public API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Worker + D1 health check |
| `GET` | `/api/milestones` | Published timeline milestones in chronological order |
| `GET` | `/api/milestones/:slug` | Full published milestone with sections/images |
| `GET` | `/api/images/:id` | Published Base64-backed D1 image, decoded to binary |

Only images belonging to published milestones are exposed through the public image route.

## Admin API

All current admin routes require `Authorization: Bearer <ADMIN_API_TOKEN>` until GitHub OAuth replaces temporary token authentication.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/milestones` | List published and draft milestones |
| `POST` | `/api/admin/milestones` | Create a milestone |
| `PUT` | `/api/admin/milestones/:id` | Replace milestone metadata/content |
| `DELETE` | `/api/admin/milestones/:id` | Delete milestone and cascaded content |
| `PUT` | `/api/admin/milestones/:id/sections` | Replace ordered long-form sections |
| `PUT` | `/api/admin/milestones/:id/images` | Replace all ordered Base64 images |
| `POST` | `/api/admin/milestones/:id/images` | Add one Base64 image |
| `DELETE` | `/api/admin/milestones/:id/images/:imageId` | Delete one image |

## Adding milestones without a dashboard

Set the temporary admin token in the terminal:

```bash
export PORTFOLIO_ADMIN_TOKEN='...'
```

PowerShell:

```powershell
$env:PORTFOLIO_ADMIN_TOKEN='...'
```

Create and manage milestones using the included CLI:

```bash
npm run milestone -- create examples/milestone.json
npm run milestone -- list
npm run milestone -- update 1 examples/milestone.json
npm run milestone -- sections 1 examples/milestone-sections.json
```

### Add a photograph directly from a file

The CLI converts the file to Base64 locally and sends it to the protected Worker API:

```bash
npm run milestone -- image-add 1 ./photo.jpg --alt="University campus" --cover
```

Optional metadata:

```bash
npm run milestone -- image-add 1 ./photo.jpg --alt="University campus" --caption="September 2024" --order=0 --cover
```

Delete an image:

```bash
npm run milestone -- image-delete 1 42
```

The bulk image endpoint remains available through:

```bash
npm run milestone -- images 1 examples/milestone-images.json
```

For normal use, `image-add` is preferable because it performs the Base64 conversion automatically.

The milestone date is stored as integer `year` + `month`. React converts the calendar-month difference between milestones into proportional vertical distance, so adding database records does not require timeline component changes.

## Quality gates

Run the complete local gate:

```bash
npm run verify
```

It enforces:

1. obsolete JavaScript/static-data migration files are absent;
2. active application code contains no object-storage integration;
3. ESLint passes with zero warnings;
4. frontend TypeScript passes strict type checking;
5. Worker TypeScript passes strict type checking;
6. Vitest passes;
7. Wrangler can bundle the Worker with `--dry-run`.

CI additionally applies the full D1 migration chain to a local Wrangler database and builds the production frontend before any deployment.

## CI/CD

`.github/workflows/portfolio-ci-cd.yml` runs on every pull request and every push to `main`.

### Pull requests

Only the quality gate runs. Nothing deploys.

### Push to `main`

```text
quality gate
    |
    v
apply D1 migrations
    |
    v
deploy Cloudflare Worker
    |
    v
build React production bundle
    |
    v
deploy prebuilt dist/ to Netlify
```

If any stage fails, downstream production deployment stops. Previous production versions remain live.

Netlify's repository-triggered build is disabled through `netlify.toml`, preventing a second ungated deployment from racing GitHub Actions. GitHub Actions is the sole production deployment path.

## CI secrets

The workflow requires these GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

The Cloudflare token only needs permissions required for Worker deployment and D1 migration. Object-storage permission is not required by this application.

## Authentication roadmap

The next backend phase replaces the temporary bearer token with single-admin GitHub OAuth:

```text
/admin
  -> GitHub OAuth
  -> Worker callback
  -> fetch GitHub identity
  -> compare immutable GitHub numeric user ID
  -> reject every other account
  -> issue short-lived portfolio admin session
```

There will be no public registration, password table, arbitrary portfolio users, or multi-role user management. The authorization model should reflect the actual system: one administrator and public read-only visitors.

## Deployment ownership

The repository is the source of truth for application code, schema migrations, Worker bindings, build commands, tests, and deployment gates. Cloudflare and Netlify dashboards remain primarily for observability, logs, rollback, and initial credential/bootstrap operations that cannot safely live in Git.
