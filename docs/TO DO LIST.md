This is a comprehensive **Project Implementation To-Do List** (Backlog) based on your Product Design (PDD) and Technical Design (TDD).

This document is structured to fit your **Agile** workflow and the **Hytel Monorepo** structure. It assumes a "No-Backend" approach where logic lives in the React client and security is handled by Firestore Rules.

---

# 📝 FLUX Implementation Roadmap

**Stack:** React (Vite), Tailwind, Shadcn UI, Firestore, Firebase Auth.
**Repo Structure:** Hytel Monorepo (`apps/web`, `packages/shared`, `packages/ui`).

## Phase 0: Setup & Configuration (The "Plumbing")

_Goal: Get the monorepo running and connected to the database._

- [ ] **Repo Cleanup**
- [ ] Initialize Hytel boilerplate.
- [ ] Delete or empty `apps/functions` (Since we are not using server-side Trpc/Node).
- [ ] Verify `pnpm dev` runs the `apps/web` frontend successfully.

- [ ] **Firebase Setup**
- [ ] Create new Project in Firebase Console.
- [ ] Enable **Authentication** (Email/Password & Google Provider).
- [ ] Enable **Firestore Database** (Start in Test Mode, switch to Locked later).
- [ ] Enable **Storage** (For profile pics/meal photos/physio licenses).
- [ ] Copy Firebase Config keys into `apps/web/.env`.

- [ ] **Shared Schemas (`packages/shared`)**
- [ ] Install Zod in the shared package if not present.
- [ ] Create `UserSchema` (include roles: Trainee, Trainer, Physio).
- [ ] Create `WorkoutSchema` (include `viewers` array for permission logic).
- [ ] Create `NutritionSchema`.
- [ ] Export TypeScript types inferred from these Zod schemas.

## Phase 1: Identity & Role-Based Access

_Goal: Users can sign up, choose a role, and be routed to the correct dashboard._

- [ ] **Authentication UI (`apps/web`)**
- [ ] Build Login / Sign-up Page using Shadcn Card & Form components.
- [ ] Implement Firebase Auth Context/Provider.

- [ ] **Onboarding Flow**
- [ ] Create "Role Selection" step (Trainee vs. Trainer vs. Physio).
- [ ] **Trainee Onboarding:** specific form for Height/Weight/Age (stored in `users/{id}/metrics`).
- [ ] **Physio Onboarding:** File input for "License Upload" (upload to Firebase Storage).
- [ ] **Profile Creation:** Write the initial user document to Firestore upon registration.

- [ ] **Firestore Security Rules (V1)**
- [ ] Write rule: Users can only read/write their own `users` document.
- [ ] Write rule: Public read access for `users` basic info (Name/Avatar) if authenticated.

## Phase 2: Core Tracking (The "Trainee" Experience)

_Goal: The Trainee can log data. This is the heart of the app._

- [ ] **Workout Logger**
- [ ] UI: Create "Start Workout" button.
- [ ] UI: Form to add Exercises, Sets, Reps, Weight.
- [ ] UI: "Muscle Group" selector (Chest, Back, Legs, etc.).
- [ ] Logic: Calculate `strainScore` locally (e.g., Duration \* Intensity).
- [ ] Database: Save to `workouts` collection. **Crucial:** Initialize `viewers` array with `[auth.uid]`.

- [ ] **Nutrition Logger**
- [ ] UI: Simple form for Calories/Protein/Carbs/Fat.
- [ ] UI: "Photo Log" button (Upload image to Firebase Storage).
- [ ] Database: Save to `nutrition` collection.

- [ ] **Dashboard (Trainee View)**
- [ ] Display list of recent workouts (Query `workouts` where `userId` == `auth.uid`).
- [ ] Display daily calorie summary.

## Phase 3: The "Circle of Care" (Connections)

_Goal: Connect the Trainee to their support network._

- [ ] **Invite System**
- [ ] Logic: Generate a simple unique ID or Link for the current user.
- [ ] UI: "Add Connection" input field (to paste a code).
- [ ] Database: Creating a `relationships` document connecting two UIDs.

- [ ] **Permission Logic (The "Viewers" Array)**
- [ ] Logic: When a `relationship` is created, trigger an update (or cloud function/client logic) to append the new Trainer/Buddy ID to the `viewers` array of the Trainee’s existing/future workouts.
- [ ] _Optimization:_ For V1, just ensure _new_ workouts look up active relationships and add those IDs to the `viewers` field on creation.

- [ ] **Firestore Security Rules (V2 - Critical)**
- [ ] Update `workouts` rules: Allow read if `request.auth.uid` is in `resource.data.viewers`.
- [ ] Update `nutrition` rules: Allow read if `request.auth.uid` is in `viewers` (Ensure Buddies are excluded here if desired).

## Phase 4: Professional Dashboards

_Goal: Trainers and Physios can see their clients' data._

- [ ] **Trainer Dashboard**
- [ ] UI: "My Clients" List (Query `relationships` where `providerId` == `me`).
- [ ] UI: Client Detail View (Query `workouts` where `userId` == `clientId`).
- [ ] UI: Heatmap visualization of "Targeted Muscles" (use Recharts).

- [ ] **Physio Dashboard**
- [ ] UI: "Patient Roster".
- [ ] UI: "Pain & Mobility" specific view (Filter workouts by `perceivedPain` > 0).
- [ ] Feature: "Add Clinical Note" (Save to a sub-collection `users/{clientId}/clinical_notes` visible only to Physio).

- [ ] **Gym Buddy Dashboard**
- [ ] UI: "Friend Feed" (Simple list of "User X finished a workout").
- [ ] UI: "Kudos" button (Simple counter update on the workout doc).

## Phase 5: Analytics & Algorithms (The "Flux")

_Goal: Provide insights, not just data logs._

- [ ] **Flux Logic Library (`apps/web/src/lib/flux-logic.ts`)**
- [ ] Function: `calculateRecovery(sleepHours, restingHR, perceivedEnergy)`.
- [ ] Function: `calculateStrain(workoutVolume, duration)`.
- [ ] Function: `getReadinessScore(recovery, strain)`.

- [ ] **Visualization**
- [ ] Install `recharts`.
- [ ] Create "Strain vs. Recovery" Line Chart.
- [ ] Create "Muscle Balance" Radar Chart.

## Phase 6: Testing & Quality Assurance

_Goal: Ensure reliability before launch._

- [ ] **Unit Testing (Vitest)**
- [ ] Test the `Flux Logic` math functions (ensure inputs result in correct scores).
- [ ] Test Zod Schemas (ensure invalid data throws errors).

- [ ] **Integration Testing**
- [ ] Manual Test: Create a Trainee account and a Trainer account.
- [ ] Manual Test: Connect them.
- [ ] Manual Test: Log a workout as Trainee -> Verify Trainer sees it.
- [ ] Manual Test: Log a workout -> Verify a random 3rd party user _cannot_ see it.

- [ ] **Physio Verification Test**
- [ ] Test uploading a "fake license" -> Admin view (mocked) -> Verify approval flow.

---

### Definition of Done (DoD) for a Feature

1. Feature is implemented in React.
2. Data is saving to Firestore correctly.
3. Zod validation passes.
4. Security Rules prevent unauthorized access.
5. Component is responsive (Mobile/Desktop).
