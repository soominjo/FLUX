# The Hytel Way: Monorepo Stack

A production-ready monorepo template featuring React, TypeScript, Tailwind CSS, Shadcn UI, tRPC, and TanStack Query. Built with pnpm and Turborepo for optimal developer experience.

## Stack Overview

Think of building a web app like putting on a theater production!

| Tool | Role | Analogy |
|------|------|---------|
| **pnpm** | Package Manager | The super-organized prop master |
| **Turborepo** | Build System | The stage manager coordinating tasks |
| **React + Vite** | Frontend | The stage and lighting system |
| **TypeScript** | Type Safety | The script ensuring everyone knows their lines |
| **Tailwind CSS** | Styling | The costume designer's fabric swatches |
| **Shadcn UI** | Components | Pre-made costume patterns |
| **tRPC** | API Layer | The messenger between actors |
| **TanStack Query** | Data Fetching | Smart caching (remembers the script!) |
| **Vitest** | Testing | Dress rehearsals before the show |
| **Zod** | Validation | The bouncer checking IDs |

## Monorepo Structure

```
├── apps/
│   ├── web/              # React frontend (Vite + Tailwind)
│   │   ├── src/
│   │   │   ├── App.tsx   # Main application component
│   │   │   ├── hooks/    # Custom React hooks (useUsers, etc.)
│   │   │   ├── lib/      # Utilities (tRPC client, query client)
│   │   │   └── providers/# Context providers
│   │   └── public/       # Static assets
│   │
│   └── functions/        # tRPC backend (stubbed for development)
│       └── src/trpc/     # API routers and procedures
│
├── packages/
│   ├── ui/               # Shared React components
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Counter.tsx
│   │   │   └── ui/       # Shadcn UI components (Button, Card)
│   │   └── lib/utils.ts  # Tailwind class merging utility
│   │
│   ├── shared/           # Shared Zod schemas & types
│   │   └── src/schemas/  # User schemas, validation rules
│   │
│   └── config/           # Shared TypeScript configuration
│
├── turbo.json            # Turborepo pipeline configuration
├── pnpm-workspace.yaml   # Workspace definition
└── package.json          # Root scripts
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd react-mono-repo-template

# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev
# Opens at http://localhost:5173

# Run tests
pnpm test

# Build for production
pnpm build

# Lint code
pnpm lint

# Format code
pnpm format
```

## Key Features

### Shared Components (`packages/ui`)

Components in `@repo/ui` can be used by any app in the monorepo:

```tsx
import { Header } from '@repo/ui/Header'
import { Button } from '@repo/ui/Button'
import { Card, CardHeader, CardContent } from '@repo/ui/Card'
```

### Type-Safe API (`apps/functions`)

tRPC provides end-to-end type safety:

```tsx
// Backend (apps/functions)
export const userRouter = router({
  create: publicProcedure
    .input(CreateUserSchema)
    .mutation(({ input }) => ({ id: 'new-id', ...input })),
})

// Frontend (apps/web)
const { mutate } = trpc.user.create.useMutation()
```

### Shared Schemas (`packages/shared`)

Zod schemas shared between frontend and backend:

```tsx
import { UserSchema, CreateUserSchema } from '@repo/shared'

// Type-safe validation everywhere!
const user = UserSchema.parse(data)
```

## Testing

Each package has its own tests:

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter web test
pnpm --filter @repo/ui test
pnpm --filter @repo/shared test
pnpm --filter @repo/functions test
```

## Adding New Packages

### New App

```bash
mkdir apps/new-app
cd apps/new-app
pnpm init
```

### New Shared Package

```bash
mkdir packages/new-package
cd packages/new-package
pnpm init
```

Then add to `pnpm-workspace.yaml` (already configured for `apps/*` and `packages/*`).

## Tips for Experimenting

1. **Safe to edit**: `apps/web/src/App.tsx` - Main UI, experiment freely!
2. **Add components**: Create new files in `packages/ui/components/`
3. **Add schemas**: Extend `packages/shared/src/schemas/`
4. **Don't break**: Avoid modifying `turbo.json` or workspace config unless needed

## Useful Links

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Shadcn UI Components](https://ui.shadcn.com)
- [tRPC Documentation](https://trpc.io)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite](https://vitejs.dev)

## Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers |
| `pnpm build` | Build all packages for production |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format code with Prettier |

---

## Developer CI/CD Education

This template includes educational CI/CD resources to help you understand deployment pipelines before implementing them.

### What's Included

| Location | Purpose |
|----------|---------|
| `scripts/setup-wif.sh` | Workload Identity Federation setup template |
| `docs/ci-cd/` | Step-by-step CI/CD documentation |

### Important: These Are Templates Only

The files in `scripts/` and `docs/ci-cd/` are **educational templates** with placeholder values. They will NOT trigger any pipelines.

- No `.github/workflows/` files exist
- All sensitive values use `<YOUR-VALUE-HERE>` placeholders
- Scripts are for learning, not production use

### Making Pipelines Functional

When you're ready to enable real CI/CD:

1. Read the docs in order (see below)
2. Replace ALL `<YOUR-VALUE-HERE>` placeholders
3. Run `scripts/setup-wif.sh` with real GCP credentials
4. Copy workflow files from docs to `.github/workflows/`

> **WARNING**: Do not copy to `.github/workflows/` until you have completed all setup steps and replaced all placeholders.

### Recommended Reading Order

1. [CI-CD-Pipeline-Guide.md](docs/ci-cd/CI-CD-Pipeline-Guide.md) - Concepts and overview
2. [CI.md](docs/ci-cd/CI.md) - Continuous Integration workflow
3. [Deploy-Dev.md](docs/ci-cd/Deploy-Dev.md) - Deployment workflow
4. [setup-wif.sh](scripts/setup-wif.sh) - Infrastructure setup script

### Dependency Consistency with Syncpack

This template includes **Syncpack**, a monorepo utility that helps you view, lint, and fix version mismatches across workspace packages.

Syncpack is **optional and educational** — it does not run automatically. You can experiment with it to learn how monorepo dependency consistency works.

#### What Syncpack Does

| Command | Purpose |
|---------|---------|
| `pnpm sync:lint` | Reports mismatched dependency versions across packages |
| `pnpm sync:fix` | Attempts to fix mismatches automatically |
| `pnpm sync:list` | Lists dependency versions in all workspace packages |

#### Educational Usage

1. Install dependencies (if not already):

```bash
pnpm install
```

2. Check for mismatches:

```bash
pnpm sync:lint
```

3. List all versions:

```bash
pnpm sync:list
```

4. Try fixing mismatches (safe in a local environment):

```bash
pnpm sync:fix
```

> **Note:** This is an educational example. Do not use these scripts in production until you understand how version alignment affects your project.

#### How It Works

- Syncpack reads `.syncpackrc.json` to determine which `package.json` files and dependencies to check
- `versionGroups` ensure dependencies match exactly across all packages
- `semverGroups` define consistent semver range policies (e.g., all devDependencies use `^`)

You can customize the Syncpack config to match your monorepo's specific needs.

---

### Version Requirements for CI/CD

| Tool | Minimum Version |
|------|-----------------|
| Node.js | 20.x |
| pnpm | 8.x |
| Firebase CLI | 13.x |
| gcloud CLI | Latest |

---

Built with Turborepo
