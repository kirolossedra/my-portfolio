# Kirolos Portfolio

`kirolos.dev` is a React + TypeScript portfolio deployed to Netlify, backed by a TypeScript Cloudflare Worker, Cloudflare D1 for structured content, and Cloudflare R2 for milestone media.

## Architecture

```text
Browser
  |
  v
kirolos.dev
Netlify: React + TypeScript + Vite
  |
  | HTTPS JSON API
  v
kirolos-portfolio-api.linc-ministry.workers.dev
Cloudflare Worker: TypeScript
  |                         |
  v                         v
D1: kirolos-portfolio-db    R2: kirolos-portfolio-assets
milestones + metadata       milestone photographs/media
```

The browser is read-only. Public portfolio content is fetched from the Worker. Mutations are protected by an admin bearer token and are intended for the repository CLI, not a token embedded in browser JavaScript.

## Repository layout

```text
src/                         React + TypeScript frontend
shared/                      API contracts shared by frontend and Worker
worker/                      Cloudflare Worker API
migrations/                  D1 schema and seed migrations
scripts/                     CLI authoring + migration helpers
examples/                    milestone payload templates
.github/workflows/           CI/CD gates and production deployment
netlify.toml                 Netlify SPA/deploy configuration
wrangler.jsonc               Worker/D1/R2 infrastructure configuration
```

## One-time JavaScript-to-TypeScript cleanup

The modification delivery cannot physically delete files from an existing checkout. After copying the delivery over the repository, run once:

```bash
npm run cleanup:legacy
```

CI deliberately fails while the obsolete `.jsx`, `.js`, and static milestone JSON files remain. The cleanup removes only the exact legacy files replaced by this migration.

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

Apply the D1 migrations to Wrangler's local D1 database:

```bash
npm run db:migrate:local
```

Create `.dev.vars` from `.dev.vars.example` and use a long random local admin token, then run:

```bash
npm run worker:dev
```

## Production infrastructure bootstrap

The D1 database and Worker already exist. The repository now treats `wrangler.jsonc` as the source of truth for the Worker configuration.

Create the R2 bucket once from the CLI:

```bash
npm run r2:create
```

Apply the idempotent initial D1 migration once. This also records the schema in Wrangler migrations and seeds the existing `kirolos.dev begins` milestone if it is absent:

```bash
npm run db:migrate:remote
```

Create the production admin secret once:

```bash
npx wrangler secret put ADMIN_API_TOKEN
```

Use a long random value. Do not add it to source control or to `VITE_*` variables. A browser-exposed admin token would turn the public portfolio into an administrative credential leak.

Deploying manually is then only:

```bash
npm run worker:deploy
```

Normal production deployment is automated by GitHub Actions instead.

## Public API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Worker + D1 health check |
| `GET` | `/api/milestones` | Published timeline milestones in chronological order |
| `GET` | `/api/milestones/:slug` | Full published milestone with sections/images |
| `GET` | `/api/media/:key` | R2-backed public media |

## Admin API

All routes require `Authorization: Bearer <ADMIN_API_TOKEN>`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/milestones` | List published and draft milestones |
| `POST` | `/api/admin/milestones` | Create a milestone |
| `PUT` | `/api/admin/milestones/:id` | Replace milestone metadata/content |
| `DELETE` | `/api/admin/milestones/:id` | Delete milestone and cascaded metadata |
| `PUT` | `/api/admin/milestones/:id/sections` | Replace ordered long-form sections |
| `PUT` | `/api/admin/milestones/:id/images` | Replace ordered R2 image metadata |
| `PUT` | `/api/admin/media/:key` | Upload a media object to R2 |
| `DELETE` | `/api/admin/media/:key` | Delete a media object from R2 |

## Adding milestones without a dashboard

Set the admin token in your terminal:

```bash
export PORTFOLIO_ADMIN_TOKEN='...'
```

On PowerShell:

```powershell
$env:PORTFOLIO_ADMIN_TOKEN='...'
```

Then use the included CLI and the files in `examples/`:

```bash
npm run milestone -- create examples/milestone.json
npm run milestone -- list
```

Add long-form sections:

```bash
npm run milestone -- sections 1 examples/milestone-sections.json
```

Upload a photograph to R2:

```bash
npm run milestone -- upload milestones/example-milestone/cover.jpg ./photo.jpg
```

Attach its metadata to the milestone:

```bash
npm run milestone -- images 1 examples/milestone-images.json
```

The milestone date is stored as integer `year` + `month`. React converts the calendar-month difference between milestones into proportional vertical distance, so adding database records does not require timeline component changes.

## Quality gates

Run the complete local gate:

```bash
npm run verify
```

It enforces:

1. no obsolete JavaScript/static-data files remain;
2. ESLint passes with zero warnings;
3. frontend TypeScript passes strict type checking;
4. Worker TypeScript passes strict type checking;
5. Vitest passes;
6. Wrangler can bundle the Worker with `--dry-run`.

CI additionally applies the D1 migration to a local Wrangler database before any deployment and builds the frontend production bundle. The frontend production build can also be checked locally with:

```bash
npm run build
```

## CI/CD

`.github/workflows/portfolio-ci-cd.yml` runs on every pull request and every push to `main`.

### Pull requests

Only the quality gate runs. Nothing deploys.

### Push to `main`

The pipeline is deliberately ordered:

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

If any stage fails, downstream production deployment stops. The previous production versions remain live.

Netlify's repository-triggered build is disabled through the `ignore = "exit 0"` rule in `netlify.toml`, preventing a second ungated deploy from racing the GitHub Actions pipeline. GitHub Actions is the sole production deployment path.

## CI secrets

The workflow requires four GitHub Actions secrets. After your first successful local `npm install`, commit the generated `package-lock.json`; the workflow automatically switches from `npm install` to deterministic `npm ci` when the lockfile exists.

The required secrets are:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

Cloudflare requires an API token for non-interactive CI. Create a narrowly scoped Worker deployment token once, rather than storing an account-wide key.

Netlify requires a personal access token for non-interactive CLI deployment. The existing site remains the deployment target; no new Netlify site is created.

After obtaining the values, add them from the CLI rather than clicking through repository settings:

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set NETLIFY_AUTH_TOKEN
gh secret set NETLIFY_SITE_ID
```

Each command securely prompts for the value.

## Deployment ownership

The repository is the source of truth for application code, schema migrations, Worker bindings, build commands, and deployment gates. The Cloudflare and Netlify dashboards remain useful for observability, logs, rollback, and the small number of credentials that cannot safely live in Git.
