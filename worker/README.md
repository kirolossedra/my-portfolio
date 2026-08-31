# Cloudflare Worker Backend

## Table of Contents

- [Responsibility](#responsibility)
- [Current Files](#current-files)
- [Request Partitioning](#request-partitioning)
- [Security Model](#security-model)
- [D1 Image Serving](#d1-image-serving)
- [RAG Boundary](#rag-boundary)

<a id="responsibility"></a>
## Responsibility

The active Worker is the deployed HTTP and D1 boundary for the portfolio. It handles public reads/submissions, GitHub OAuth, signed owner sessions, protected administration and binary image serving.

<a id="current-files"></a>
## Current Files

- `index.ts` - route dispatch and request lifecycle;
- `auth.ts` - OAuth/state/exchange/session behavior;
- `env.ts` - Worker environment bindings;
- `http.ts` - JSON/error/CORS/origin helpers;
- `milestones-repository.ts` - milestone/section/image D1 persistence;
- `opinions-repository.ts` - opinion D1 persistence;
- `validation.ts` - server-side input validation;
- `__tests__/` - Worker tests.

There is no active `worker/routes/` directory in the current GitHub `main`; route handling is presently centralized in `worker/index.ts`. The `worker/routes/README.md` in this documentation package therefore documents the logical route catalog rather than claiming a physical routes-module layout.

<a id="request-partitioning"></a>
## Request Partitioning

`handleRequest` recognizes auth (`/api/auth/*`), admin (`/api/admin/*`) and public paths. Restricted browser routes and opinion submission pass through origin enforcement. `OPTIONS` is handled centrally. Unexpected/server errors are logged without exposing internal detail through the response.

<a id="security-model"></a>
## Security Model

Admin requests first require a valid signed session. Authentication authorizes the immutable configured GitHub numeric ID. OAuth state and one-time handoff mechanics live on the server side. There is no user-role matrix or public account database.

<a id="d1-image-serving"></a>
## D1 Image Serving

Published images are decoded from stored Base64 into `ArrayBuffer` and returned with the stored MIME type, content length, public caching, CORS and `nosniff`.

<a id="rag-boundary"></a>
## RAG Boundary

The Worker currently has no RAG route and must not be documented as if it does. A future integration can make the Worker/gateway the browser-facing control plane while the Python service remains the model-heavy data plane.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Logical routes](routes/README.md)
- [Trust boundaries](../docs/architecture/trust-boundaries.md)
