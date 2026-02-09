This is a Technical Design Document (TDD) tailored for **FLUX**.

It respects your constraint to avoid Cloud Functions/Server-side logic, relying instead on **Client-Side Calculation**, **Firebase Authentication**, and robust **Firestore Security Rules**. It utilizes the **Hytel Way** monorepo structure.

---

# Technical Design Document: FLUX Platform

**Version:** 1.0
**Status:** Draft
**Date:** October 26, 2023
**Author:** Gemini (AI Architect)

## 1. Executive Summary

FLUX is a freemium SaaS fitness platform facilitating a "Circle of Care" around a Trainee. It connects Trainees, Personal Trainers, Physiotherapists, and Gym Buddies. The architecture is **Serverless (BaaS)**, utilizing a heavy-client approach where logic resides in the React frontend, and data security is enforced via Firestore Rules.

## 2. Architecture Overview

### 2.1 High-Level Diagram

```mermaid
graph TD
    User[End User (Web/Mobile)] -->|Auth| FirebaseAuth
    User -->|Reads/Writes| Firestore[Firestore NoSQL DB]

    subgraph "Frontend Application (apps/web)"
        UI[React + Shadcn UI]
        Logic[Flux Algorithm (Strain/Recovery)]
        State[TanStack Query]
        DAL[Direct Firestore SDK Integration]
    end

    subgraph "Shared (packages/shared)"
        Schema[Zod Schemas]
        Types[TypeScript Interfaces]
    end

    User --> UI
    UI --> Logic
    Logic --> DAL
    DAL --> Firestore

```

### 2.2 The "No-Backend" Strategy

Per requirements, we are bypassing the `apps/functions` (Node.js/tRPC server) layer for runtime logic.

- **Validation:** Input validation occurs in the UI using **Zod** (from `packages/shared`).
- **Security:** Data integrity is enforced strictly by **Firestore Security Rules**.
- **Business Logic:** Complex calculations (Strain, Recovery Scores) happen in the browser (`apps/web/src/lib/logic`).
- **Data Access:** We will use **TanStack Query** to wrap Firebase Web SDK promises, maintaining the boilerplate's data-fetching patterns without needing a tRPC server.

---

## 3. Tech Stack & Boilerplate Implementation

We will utilize the **Hytel Monorepo** structure.

| Component             | Technology            | Implementation Note                                                                                     |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------------------------- |
| **Frontend**          | React, Vite, Tailwind | Located in `apps/web`                                                                                   |
| **UI Kit**            | Shadcn UI             | Located in `packages/ui`                                                                                |
| **State/Cache**       | TanStack Query        | Used to cache Firestore reads                                                                           |
| **Schema/Validation** | Zod                   | Located in `packages/shared`. Critical for ensuring data written to Firestore matches expected formats. |
| **Database**          | Firestore (NoSQL)     | Single database instance.                                                                               |
| **Auth**              | Firebase Auth         | Email/Password + Social Providers (Google).                                                             |
| **Hosting**           | Firebase Hosting      | Serving the Vite app.                                                                                   |

---

## 4. Data Model (Firestore)

Since we are not using SQL, we must structure data for **read optimization** and **security**.

### 4.1 Collections Structure

#### `users` (Collection)

Stores profile data.

```typescript
// ID: UserUID (from Auth)
{
  displayName: string,
  email: string,
  role: 'TRAINEE' | 'TRAINER' | 'PHYSIO',
  photoURL: string,
  // Private data sub-object (protected by rules)
  metrics: {
    height: number,
    weight: number,
    dob: timestamp,
  },
  // Professional Verification (if Role != TRAINEE)
  verification: {
    licenseUrl: string,
    isVerified: boolean, // Only Admin can write true
  },
  createdAt: timestamp
}

```

#### `relationships` (Collection)

The "Join Table" connecting users. Crucial for permissions.

```typescript
// ID: Auto-generated
{
  traineeId: string,    // The "Client"
  providerId: string,   // The Trainer, Physio, or Buddy
  type: 'TRAINER' | 'PHYSIO' | 'BUDDY',
  status: 'PENDING' | 'ACTIVE',
  permissions: {
    canViewDiet: boolean,
    canViewMedical: boolean, // Only true for Physio
  },
  createdAt: timestamp
}

```

#### `workouts` (Collection)

Root collection (not sub-collection) to allow Trainers to query _all_ client workouts easily.

```typescript
// ID: Auto-generated
{
  userId: string,       // Owner
  date: timestamp,
  title: string,        // e.g., "Leg Day"
  strainScore: number,  // 0-21 (Calculated on client)
  durationMinutes: number,
  perceivedPain: 1-10,  // For Physio tracking
  targetedMuscles: ['quads', 'hamstrings', 'glutes'],
  exercises: [
    { name: 'Squat', sets: 3, reps: 10, weight: 100 }
  ],
  // Array of userIDs allowed to view this (Denormalized for security rules)
  viewers: string[] // [userId, trainerId, buddyId]
}

```

#### `nutrition` (Collection)

```typescript
// ID: Auto-generated
{
  userId: string,
  date: string, // YYYY-MM-DD
  calories: number,
  macros: { protein: number, carbs: number, fats: number },
  photoUrl: string, // "Ate this" feature
  viewers: string[] // [userId, trainerId] (Buddies usually excluded)
}

```

#### `daily_metrics` (Collection)

Stores recovery data (Sleep, HRV, Resting Heart Rate).

```typescript
// ID: userId_YYYY-MM-DD
{
  userId: string,
  date: string,
  recoveryScore: number, // 0-100%
  sleepHours: number,
  restingHR: number,
  viewers: string[]
}

```

---

## 5. Security Strategy (Firestore Rules)

Since we have no backend to gatekeep, **Firestore Rules are the only line of defense.**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    // Check if the requester is in the 'viewers' array of the doc
    function isAuthorizedViewer() {
      return request.auth.uid in resource.data.viewers;
    }

    // 1. Users Collection
    match /users/{userId} {
      allow read: if isSignedIn(); // Basic profile is public-ish
      allow write: if isOwner(userId); // Only user edits self
    }

    // 2. Workouts & Nutrition
    match /workouts/{workoutId} {
      allow read: if isOwner(resource.data.userId) || isAuthorizedViewer();
      // On create, ensure the 'viewers' array includes the user + their active relations
      allow create: if isOwner(request.resource.data.userId);
      allow update: if isOwner(resource.data.userId);
    }

    // 3. Relationships (The Gatekeeper)
    match /relationships/{relId} {
      allow read: if request.auth.uid == resource.data.traineeId ||
                     request.auth.uid == resource.data.providerId;
      allow create: if isSignedIn(); // Users can create invites
    }
  }
}

```

---

## 6. Logic & Integration Points

### 6.1 The "Flux Logic" (Frontend)

Located in `apps/web/src/lib/flux-logic.ts`.

- **Strain Calculation:** Based on workout duration, volume (sets _ reps _ weight), and perceived exertion.
- **Recovery Calculation:** Weighted average of Sleep Duration and Self-reported energy.
- _Note:_ Since this is calculated on the client, a malicious user _could_ fake their strain score. For a social app, this is an acceptable risk.

### 6.2 Integrations

- **Authentication:** [Firebase Auth Docs](https://firebase.google.com/docs/auth/web/start)
- Used for Sign up/Login.

- **Database:** [Firestore Web SDK Docs](https://firebase.google.com/docs/firestore/quickstart)
- Primary data store.

- **Charts:** [Recharts](https://www.google.com/search?q=https://recharts.org/en-US/)
- Used for visualizing Strain vs. Recovery.

- **Validation:** [Zod Documentation](https://zod.dev/)
- Used in `packages/shared` to validate forms before submitting to Firestore.

---

## 7. Development Epics (Implementation Plan)

### Epic A: Foundation & Auth

1. Setup Firebase project.
2. Implement `packages/shared` Zod schemas for User and Workout.
3. Build Login/Register screens with Role Selection.

### Epic B: Core Tracking (The "Trainee" View)

1. Build Workout Logger (Muscles, Sets, Reps).
2. Build Nutrition Logger (Quick add macros/photo).
3. Implement Client-side "Flux Logic" to calculate daily scores.

### Epic C: The "Circle" (Social & Relations)

1. Build "Generate Invite Code" UI.
2. Build "Accept Invite" logic (creates `relationships` doc).
3. **Critical:** Implement logic that automatically adds Trainers/Buddies to the `viewers` array of _new_ workouts created by the Trainee.

### Epic D: Dashboards

1. **Trainer View:** Query `workouts` where `viewers` contains `trainerId`.
2. **Physio View:** Query `workouts` + `pain_logs`.
3. **Buddy View:** Read-only feed of completed workouts.

---

## 8. Directory Structure Adjustments

To fit the Hytel boilerplate without using the backend functions:

```
apps/
  web/
    src/
      lib/
        firebase.ts       // Init Firebase
        api/              // "Service Layer"
          workouts.ts     // encapsulate Firestore calls
          users.ts
          relations.ts
      hooks/
        useWorkouts.ts    // TanStack Query hooks wrapping api/workouts.ts
        useFluxScore.ts   // Custom hook for math logic
  functions/              // DELETE or LEAVE EMPTY (We are not using Node backend)

```

## 9. Next Steps

1. Initialize the repository.
2. Run `pnpm install`.
3. Create the Firebase Project and copy config keys to `apps/web/.env`.
4. Begin **Epic A (Foundation & Auth)**.
