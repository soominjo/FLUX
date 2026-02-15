# ADR-001: Turborepo Monorepo with pnpm Workspaces

**Status:** Accepted
**Date:** 2025-01-15
**Deciders:** Core Team

## Context

FLUX is a multi-package platform comprising a React SPA (`apps/web`), Firebase Cloud Functions (`apps/functions`), shared UI components (`packages/ui`), and shared schemas/types (`packages/shared`). We needed a project structure that enables code reuse across packages while maintaining fast build times and a cohesive developer experience.

### Options Considered

1. **Polyrepo** - Separate repositories per package with npm publishing
2. **Nx Monorepo** - Nx workspace with module boundaries
3. **Turborepo + pnpm Workspaces** - Lightweight monorepo with remote caching

## Decision

We chose **Turborepo with pnpm workspaces** as our monorepo orchestrator.

### Workspace Layout

```
apps/web              # React + Vite SPA
apps/functions        # Firebase Cloud Functions (tRPC)
packages/ui           # @repo/ui - Shared Shadcn/Tailwind components
packages/shared       # @repo/shared - Zod schemas, TypeScript types
packages/eslint-config
packages/typescript-config
```

## Rationale

| Criterion        | Turborepo + pnpm    | Nx                  | Polyrepo            |
| ---------------- | ------------------- | ------------------- | ------------------- |
| Setup complexity | Minimal             | Moderate (plugins)  | High (publish flow) |
| Build caching    | Remote + local      | Remote + local      | Per-repo only       |
| Dependency hoist | pnpm strict mode    | pnpm or yarn        | N/A                 |
| Type sharing     | Instant (workspace) | Instant (workspace) | npm publish cycle   |
| CI speed         | Turbo prune + cache | Nx affected         | Parallel repos      |
| Learning curve   | Low                 | Moderate            | Low                 |

**Key advantages:**

- `turbo prune` generates minimal Docker contexts for Cloud Functions deployment
- pnpm's strict node_modules prevents phantom dependencies
- Zero-config task parallelization (`turbo run build lint test`)
- Shared `@repo/shared` Zod schemas provide runtime validation + TypeScript types in a single source of truth

## Consequences

### Positive

- Single `pnpm install` bootstraps all packages
- Schema changes in `@repo/shared` are immediately reflected across `apps/web` and `apps/functions`
- `pnpm precheck` runs lint, typecheck, build, and test across all packages in topological order
- Turborepo remote cache reduces CI build times by ~60%

### Negative

- All packages share the same Git history, making per-package release gating more complex (mitigated by Changesets)
- Developers must understand workspace protocol (`workspace:*`) for internal dependencies
- Turbo cache invalidation occasionally requires manual `--force` when config files change

### Risks

- Turborepo is relatively new; breaking changes in major versions could require migration effort
- Mitigated by pinning Turbo version and staying within one major version behind latest
