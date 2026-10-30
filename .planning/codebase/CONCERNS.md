---
name: CONCERNS.md
description: Technical debt, known issues, security boundaries, and fragile areas in DevBuds
metadata:
  type: reference
  date: 2026-10-29
---

# Concerns & Technical Debt: DevBuds

## Privacy Boundaries
- **Strict HOD Aggregate-Only Privacy**: Department dashboards (`/department`) must strictly enforce aggregate-only metrics (percentages, averages, counts). No student names or private mentoring notes are permitted to be exposed to HODs.

## Security & Authentication
- Authentication state relies on HttpOnly JWT cookies. Care must be taken when adding new routes to protect them with `getCurrentUser()` role verification (`src/server/auth/session.ts`).

## Performance & State
- Mentor dashboard supports server-side URL search params (`?tab=...&filter=...&sort=...`) for sorting and filtering. Ensure client hydration remains clean and responsive.
- Large student lists with multiple Prisma relations (`attendance`, `marks`, `lmsActivity`, `meetings`, `followUps`) should maintain optimized queries to avoid N+1 issues.
