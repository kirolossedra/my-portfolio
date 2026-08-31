# Shared Frontend/Worker Contracts

## Table of Contents

- [Responsibility](#responsibility)
- [Boundary Rule](#boundary-rule)
- [Change Discipline](#change-discipline)

<a id="responsibility"></a>
## Responsibility

`shared/` contains TypeScript data contracts that must compile in both browser and Worker builds. Current files are `milestone.ts` and `opinion.ts`.

<a id="boundary-rule"></a>
## Boundary Rule

Put transport/domain shapes here when both frontend and Worker need the exact same type. Do not put browser UI state, Worker-only D1 rows/secrets, Python RAG models or Pinecone records here unless a future browser-facing RAG API contract genuinely needs a TypeScript representation.

<a id="change-discipline"></a>
## Change Discipline

Changing a shared contract requires both `npm run typecheck:app` and `npm run typecheck:worker`, plus affected tests and API documentation. A type-compatible change can still be a runtime API breaking change, so validate payload semantics as well as TypeScript.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Worker docs](../worker/README.md)
- [Frontend docs](../src/README.md)
