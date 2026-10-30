---
name: TESTING.md
description: Test framework, test structure, mocking, and coverage in DevBuds
metadata:
  type: reference
  date: 2026-10-29
---

# Testing: DevBuds

## Test Framework
- **Test Runner**: Vitest (`vitest run`, configured in `package.json` with script `"test": "vitest run"`).
- **Test Directory**: `tests/` (`tests/alerts.test.ts`).

## Test Practices
- Unit tests cover core domain logic such as the early warning attention engine (`tests/alerts.test.ts`).
- Typechecking via `npm run typecheck` (`tsc --noEmit`).
- Linting via `npm run lint` (`eslint`).
- Database migration validation via Prisma (`npm run db:migrate`).
