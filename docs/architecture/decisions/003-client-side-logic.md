# ADR-003: Client-Side Filtering and Aggregation

**Status:** Accepted
**Date:** 2025-02-15
**Deciders:** Core Team

## Context

Multiple FLUX features require filtered and aggregated views of user data:

- **Nutrition Dashboard:** Daily/Monthly/Yearly calorie and macro summaries
- **Workouts Dashboard:** Today's strength and cardio load calculations
- **Analytics Charts:** 14-day strain/recovery trends
- **Daily Metrics:** Date-range hydration and recovery data

Firestore's query model does not support composite indexes without explicit creation, and range queries (`>=`, `<=`) combined with equality filters (`==`) silently return empty results if the required composite index is missing.

### Options Considered

1. **Server-side aggregation** via Cloud Functions (tRPC procedures)
2. **Firestore composite indexes** for every query pattern
3. **Client-side filtering** — fetch by `userId`, filter and aggregate in JavaScript

## Decision

We adopted **client-side filtering and aggregation** as the standard pattern for all range-based queries.

### Pattern

```typescript
// Fetch ALL documents for the user (single equality filter — no composite index)
const q = query(collection(db, 'nutrition'), where('userId', '==', uid))
const snapshot = await getDocs(q)
const allLogs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))

// Filter by date range in JavaScript
const filtered = allLogs.filter(log => log.date >= startDate && log.date <= endDate)

// Sort client-side (Firestore orderBy also requires composite index with where)
return filtered.sort((a, b) => bTime - aTime)
```

This pattern is applied consistently in:

- `useNutritionRange()` — nutrition logs by date range
- `useDailyMetricsRange()` — daily metrics for chart display
- `useMetricsRange()` — recovery/sleep data
- `WorkoutsPage` — today's exercise logs for load calculations

## Rationale

| Criterion           | Client-Side Filter     | Composite Indexes     | Server Aggregation   |
| ------------------- | ---------------------- | --------------------- | -------------------- |
| Setup effort        | Zero                   | Manual per query      | Cloud Function code  |
| Firestore reads     | Higher (all user docs) | Minimal (exact match) | Server-side          |
| Silent failure risk | None                   | High (missing index)  | None                 |
| Latency             | Acceptable (<200ms)    | Fastest               | Network hop overhead |
| Maintenance         | None                   | Index per query combo | Function maintenance |

**Deciding factor:** Firestore silently returns zero results when a composite index is missing (no error thrown). This caused multiple "no data" bugs during development. Client-side filtering eliminates this entire class of failure.

### Data Volume Justification

For a single user, the expected data volume is:

- **Nutrition:** ~3-5 entries/day = ~150/month = ~1,800/year
- **Exercise logs:** ~3-10 entries/day = ~300/month = ~3,600/year
- **Daily metrics:** 1 entry/day = ~365/year

At these volumes, fetching all user documents and filtering client-side adds negligible latency (<100ms on modern devices). The trade-off of extra Firestore reads is acceptable given the free tier limits (50K reads/day).

## Consequences

### Positive

- Zero composite index management — no Firestore console configuration needed
- Eliminates silent query failures from missing indexes
- Queries are testable in unit tests without Firestore emulator
- Aggregation logic (sums, averages, streaks) lives in reusable TypeScript functions

### Negative

- Higher Firestore read costs at scale (fetching all documents per query)
- Client bears the compute cost of filtering and sorting
- Not viable if a single user has tens of thousands of documents

### Future Migration Path

When user data volume exceeds ~5,000 documents per collection:

1. Create composite indexes for hot query paths
2. Implement server-side aggregation via scheduled Cloud Functions that pre-compute daily/weekly summaries
3. Use Firestore's `count()` and `sum()` aggregation queries (GA as of 2024)

### Risks

- If multiple components mount simultaneously, each triggers its own fetch of all user documents. Mitigated by TanStack Query's deduplication (same `queryKey` = single network request).
- Stale data window of up to 5 minutes (default `staleTime`). Mitigated by `invalidateQueries()` on every mutation's `onSuccess`.
