# FLUX Security Threat Model

**Last Updated:** 2025-02-15
**Owner:** Core Team
**Review Cadence:** Quarterly

---

## 1. Assets

| Asset                    | Classification | Storage Location                      |
| ------------------------ | -------------- | ------------------------------------- |
| User credentials         | Critical       | Firebase Authentication               |
| Health data (weight, HR) | Sensitive/PII  | Firestore `daily_metrics`             |
| Workout & exercise logs  | Sensitive      | Firestore `workouts`, `exercise_logs` |
| Nutrition entries        | Sensitive      | Firestore `nutrition`                 |
| Trainer-trainee links    | Internal       | Firestore `users/{uid}/relationships` |
| Invite tokens            | Internal       | Firestore `invites`                   |
| GCP service account key  | Critical       | GitHub Secrets (WIF)                  |
| Firebase config          | Public         | Client-side env vars                  |
| Session tokens (JWT)     | Critical       | Browser memory (Firebase SDK)         |

---

## 2. Trust Boundaries

```
+--------------------------------------------------+
|  Browser (Untrusted)                             |
|  +-----------+  +----------------------------+   |
|  | React SPA |->| Firebase JS SDK            |   |
|  +-----------+  +----------------------------+   |
+-------------------|-----------------------------|+
                    | HTTPS (TLS 1.3)              |
+-------------------|-----------------------------|+
|  Firebase (Trusted Infrastructure)               |
|  +----------------+  +-----------------------+   |
|  | Authentication |  | Firestore             |   |
|  | (Identity)     |  | (Security Rules)      |   |
|  +----------------+  +-----------------------+   |
|                       +-----------------------+   |
|                       | Cloud Functions       |   |
|                       | (tRPC Backend)        |   |
|                       +-----------------------+   |
+--------------------------------------------------+
```

**Key boundary:** The React SPA runs in an untrusted environment (user's browser). All authorization is enforced server-side by Firestore Security Rules and Firebase Authentication.

---

## 3. Threats & Mitigations (STRIDE)

### 3.1 Spoofing

| Threat                             | Risk   | Mitigation                                                                  | Status      |
| ---------------------------------- | ------ | --------------------------------------------------------------------------- | ----------- |
| Attacker impersonates another user | High   | Firebase Auth issues signed JWTs; Firestore rules verify `request.auth.uid` | Implemented |
| Stolen session token replay        | Medium | Firebase tokens expire after 1 hour; refresh tokens rotate                  | Implemented |
| Fake OAuth provider                | Low    | Only Google/Email providers enabled; no custom OIDC                         | Implemented |

### 3.2 Tampering

| Threat                                             | Risk   | Mitigation                                                                                    | Status      |
| -------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- | ----------- |
| Client modifies Firestore documents directly       | High   | Security Rules validate document schema and ownership (`userId == request.auth.uid`)          | Implemented |
| Malicious workout data (negative values, overflow) | Medium | Zod schemas in `@repo/shared` validate at write time; `calculateStrain` clamps output to 0-21 | Implemented |
| Tampered `viewers[]` array to gain access          | High   | Security Rules restrict `viewers` field writes to document owner only                         | Implemented |

### 3.3 Repudiation

| Threat                            | Risk | Mitigation                                                                       | Status  |
| --------------------------------- | ---- | -------------------------------------------------------------------------------- | ------- |
| User denies logging a workout     | Low  | Firestore `createdAt` server timestamp; audit trail via Firestore change history | Partial |
| Admin denies viewing trainee data | Low  | Cloud Logging captures all Firestore reads from Cloud Functions                  | Planned |

### 3.4 Information Disclosure

| Threat                                            | Risk     | Mitigation                                                                                      | Status        |
| ------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- | ------------- |
| Unauthorized access to another user's health data | Critical | Firestore rules: `userId == request.auth.uid OR request.auth.uid in resource.data.viewers`      | Implemented   |
| Firebase config keys exposed in client bundle     | Low      | Firebase config is designed to be public; security enforced via Security Rules, not key secrecy | Accepted Risk |
| Sensitive data in browser localStorage            | Medium   | Firebase SDK stores auth tokens in IndexedDB with origin isolation                              | Implemented   |
| API responses leak other users' data              | Medium   | tRPC procedures filter by authenticated user's UID server-side                                  | Implemented   |

### 3.5 Denial of Service

| Threat                                     | Risk   | Mitigation                                                                          | Status      |
| ------------------------------------------ | ------ | ----------------------------------------------------------------------------------- | ----------- |
| Excessive Firestore reads exhausting quota | Medium | TanStack Query caching reduces redundant reads; `staleTime` prevents refetch storms | Implemented |
| Malicious bulk writes to Firestore         | Medium | Security Rules rate-limit writes per user (planned); Firebase App Check (planned)   | Planned     |
| Cloud Functions cold start abuse           | Low    | Firebase Functions auto-scale; concurrency limits configurable                      | Implemented |

### 3.6 Elevation of Privilege

| Threat                             | Risk     | Mitigation                                                                                  | Status      |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------------------- | ----------- |
| Regular user accesses admin routes | High     | Client-side route guards check `userProfile.role`; Security Rules enforce role-based access | Implemented |
| Trainee modifies trainer's data    | High     | Firestore rules: write requires `userId == request.auth.uid`                                | Implemented |
| Self-assignment of admin role      | Critical | `role` field in user profile can only be set by Cloud Functions with admin SDK              | Implemented |

---

## 4. Security Controls Summary

### Authentication

- Firebase Authentication with Email/Password and Google OAuth
- JWT tokens with 1-hour expiry, automatic refresh
- Client-side auth state managed via `AuthProvider` context

### Authorization

- **Firestore Security Rules** (`firestore.rules`) enforce:
  - Document ownership (`userId == request.auth.uid`)
  - Viewer-based access (`request.auth.uid in resource.data.viewers`)
  - Role-based admin access
- **Client-side route guards** for role-based UI rendering (defense in depth, not primary control)

### Data Validation

- **Zod schemas** (`@repo/shared`) validate all data at write boundaries
- **Firestore Security Rules** validate document structure server-side
- **Clamped calculations** (e.g., strain 0-21, recovery 0-100, BMI > 0)

### Infrastructure

- **Workload Identity Federation** for CI/CD deployments (no stored service account keys)
- **HTTPS enforced** on all Firebase Hosting and Functions endpoints
- **Content Security Policy** via Firebase Hosting headers (planned)

---

## 5. Open Items

| Item                                            | Priority | Owner    | Target Date |
| ----------------------------------------------- | -------- | -------- | ----------- |
| Enable Firebase App Check                       | High     | DevOps   | Q2 2025     |
| Add Content-Security-Policy headers             | Medium   | Frontend | Q2 2025     |
| Implement write rate limiting in Security Rules | Medium   | Backend  | Q2 2025     |
| Enable Cloud Audit Logging for Firestore        | Low      | DevOps   | Q3 2025     |
| Add Sentry error monitoring with PII scrubbing  | Medium   | Frontend | Q2 2025     |
