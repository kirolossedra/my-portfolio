# Worker Route Catalog

## Table of Contents

- [Physical Layout Note](#physical-layout-note)
- [Public Routes](#public-routes)
- [Authentication Routes](#authentication-routes)
- [Administration Routes](#administration-routes)
- [Proposed RAG Route](#proposed-rag-route)

<a id="physical-layout-note"></a>
## Physical Layout Note

**Current `main`: route handlers are in `worker/index.ts`; this directory-level README is documentation only.** It does not claim that route source files already live here.

<a id="public-routes"></a>
## Public Routes

| Method | Path | Authentication | Persistence |
|---|---|---|---|
| GET | `/api/health` | none | D1 `SELECT 1` |
| GET | `/api/milestones` | none | D1 |
| GET | `/api/milestones/:slug` | none | D1 |
| GET | `/api/images/:id` | none | D1 Base64 -> binary |
| GET | `/api/opinions` | none | approved D1 rows |
| POST | `/api/opinions` | no session; origin/input rules | inserts pending row |

<a id="authentication-routes"></a>
## Authentication Routes

`/api/auth/github` starts OAuth; callback exchanges the provider code server-side; `/api/auth/exchange` consumes a one-time handoff; `/api/auth/session` validates the owner session.

<a id="administration-routes"></a>
## Administration Routes

The administration surface supports milestone list/create/load/update/delete, ordered-section replacement, image replacement/add/delete, and opinion list/moderate/delete. All are signed-session protected and enforce the allowed origin.

<a id="proposed-rag-route"></a>
## Proposed RAG Route

A browser-facing RAG route is **PROPOSED**, not active. It should proxy/control access to the Python service rather than duplicating the retrieval algorithm in TypeScript.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Worker backend](../README.md)
