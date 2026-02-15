# ADR-002: Firestore as Primary Data Store

**Status:** Accepted
**Date:** 2025-01-15
**Deciders:** Core Team

## Context

FLUX needs a database to store user profiles, workouts, exercise logs, nutrition entries, daily metrics, and relationship data (trainer-trainee-physio). The platform requires real-time data synchronization for dashboard updates and must support role-based access control.

### Options Considered

1. **PostgreSQL** (via Supabase or Cloud SQL) - Relational, strong consistency
2. **Cloud Firestore** - Document-oriented NoSQL, real-time listeners, integrated with Firebase Auth
3. **PlanetScale** (MySQL) - Serverless relational database

## Decision

We chose **Cloud Firestore** in Native mode as the primary data store, paired with Firebase Authentication for identity management.

### Data Model

```
users/{uid}                          # UserProfile document
users/{uid}/relationships/{relId}    # Trainer/Physio connections
workouts/{docId}                     # Workout sessions (strainScore, date)
exercise_logs/{docId}                # Individual exercise logs (sets, reps, weight, RPE)
nutrition/{docId}                    # Meal/food entries (calories, macros)
daily_metrics/{docId}               # Daily recovery data (sleep, HR, water, mood)
invites/{docId}                     # Pending network invitations
```

Each document includes a `userId` field for ownership and a `viewers[]` array for permission-based access.

## Rationale

| Criterion            | Firestore             | PostgreSQL           |
| -------------------- | --------------------- | -------------------- |
| Real-time sync       | Built-in `onSnapshot` | Requires Supabase RT |
| Auth integration     | Native (Firebase)     | External (JWT/OAuth) |
| Security rules       | Declarative rules     | Row-Level Security   |
| Scaling              | Auto-scales           | Manual provisioning  |
| Composite index mgmt | Auto + manual         | N/A (SQL joins)      |
| Offline support      | Built-in persistence  | Not built-in         |
| Relational queries   | Limited               | Full SQL             |

**Key advantages:**

- Firebase Auth + Firestore Security Rules provide end-to-end authorization without custom middleware
- Real-time listeners enable live dashboard updates when a trainee logs a workout
- Generous free tier (50K reads/day, 20K writes/day) suitable for early-stage product

## Consequences

### Positive

- Zero backend code needed for CRUD operations — the web client writes directly to Firestore
- Security Rules enforce that only authenticated users can read/write their own documents
- `viewers[]` array pattern enables trainer/physio access without complex join tables

### Negative

- **Composite index requirement:** Queries combining equality + range filters (e.g., `userId == X AND date >= Y`) require pre-built composite indexes or client-side filtering
- **Denormalization:** No joins means data duplication (e.g., `exerciseName` stored in every log)
- **Limited aggregation:** No `SUM()`, `AVG()` — all aggregation computed client-side

### Mitigations

- **Client-side filtering pattern (see ADR-003):** Fetch all documents by `userId`, filter dates in JavaScript to avoid composite index requirements
- **Firestore Security Rules** validated in CI via `firebase emulator` testing
- **Zod schemas** in `@repo/shared` enforce document structure at write time
