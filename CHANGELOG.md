# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Architecture Decision Records (ADR-001 through ADR-003) documenting monorepo, Firestore, and client-side filtering decisions
- Security Threat Model (STRIDE analysis) in `docs/security/THREAT_MODEL.md`
- Property-based fuzz tests using `fast-check` for `calculateStrain`, `calculateRecovery`, and `calculateBMI`
- Zod schema unit tests for `@repo/shared` (42 tests covering all domain schemas)
- End-to-end smoke tests using Playwright
- Discord notification step in production CI/CD pipeline
- SEO meta tags via `react-helmet-async` with per-page titles
- Disaster Recovery & Seeding documentation in README
- Public changelog (this file)

### Fixed

- `useProfileUpdate` TypeScript error: proper `FieldValue` typing for Firestore `updateDoc`
- Removed unused `AdminView` type in `AdminDashboard.tsx`
- Removed unused `embedded` prop in `TraineeDashboard.tsx`
- Replaced outdated boilerplate `App.test.tsx` with valid smoke test
- `@repo/shared` test suite now passes (previously had zero test files)

### Changed

- ESLint config now warns on `console.log` usage to enforce production-level quality
