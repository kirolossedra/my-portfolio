# Frontend Architecture

## Table of Contents

- [Responsibility](#responsibility)
- [Route Map](#route-map)
- [Major Areas](#major-areas)
- [API Boundary](#api-boundary)
- [Accessibility / Motion](#accessibility-motion)
- [Kiro Integration](#kiro-integration)

<a id="responsibility"></a>
## Responsibility

`src/` owns the React/TypeScript browser application. It renders public and owner interfaces, loads public content through the Worker API, and hosts the Kiro Three.js/GLB experience. It does not own durable D1 access, OAuth secrets, Pinecone credentials or Python inference.

<a id="route-map"></a>
## Route Map

`src/App.tsx` performs direct path dispatch:

| Path | Component / behavior |
|---|---|
| `/` | public timeline |
| `/milestones/:slug` | milestone detail |
| `/skills` | `SkillsPage` |
| `/opinions` | `OpinionsPage` |
| `/kiro-rag` | `KiroRagPage` |
| `/admin` | private admin page |
| `/admin/auth/callback` | OAuth browser callback |

<a id="major-areas"></a>
## Major Areas

- `admin/` - authenticated owner workspace and OAuth browser handoff;
- `components/` - timeline/milestone and reusable UI behavior;
- `data/` - API/data adapters and static skills evidence;
- `features/kiro-rag/` - avatar, GLB model contract, diagnostics and behavior-state tooling;
- `styles.css` - shared visual system and page-specific styles.

<a id="api-boundary"></a>
## API Boundary

The frontend uses `VITE_API_BASE_URL` when configured and otherwise falls back to the production API behavior defined by the application. The Worker remains the server-side authority for public and owner CRUD.

<a id="accessibility-motion"></a>
## Accessibility / Motion

The portfolio repeatedly treats `prefers-reduced-motion` as a first-class input. Timeline effects, opinion motion and other animated presentations should preserve semantic content when motion is reduced.

<a id="kiro-integration"></a>
## Kiro Integration

The current Kiro query form is a behavior test. It schedules semantic state transitions locally; it does not send the entered string to the Python RAG runtime. The state interface is intentionally designed so future network lifecycle events can replace the timers without rewriting the avatar contract.

## Related Documentation

- Parent: [../README.md](../README.md)
- [Feature index](features/README.md)
- [Kiro RAG](features/kiro-rag/README.md)
