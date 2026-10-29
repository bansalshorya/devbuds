---
name: INTEGRATIONS.md
description: External APIs, databases, authentication providers, and services in DevBuds
metadata:
  type: reference
  date: 2026-10-29
---

# External Integrations: DevBuds

## Database
- **PostgreSQL**: Connected via Prisma Client (`src/server/db/client.ts`). Database URL configured via environment variables (`DATABASE_URL`).
- **Prisma Migrations**: Managed via `prisma/migrations/` (`20261029093331_init`, `20261029101427_full_schema`).

## Authentication & Session Management
- **JWT Authentication (`jose`)**: Session cookies stored securely via HttpOnly cookies managed in `src/server/auth/session.ts` and `src/server/auth/origin.ts`.
- **Roles**: Supported roles include `STUDENT`, `MENTOR`, `HOD`, `ADMIN` (`src/lib/roles.ts`).

## APIs & Endpoints
- **App Router API Routes**:
  - `POST /api/auth/login` (`src/app/api/auth/login/route.ts`)
  - `POST /api/auth/logout` (`src/app/api/auth/logout/route.ts`)
  - `GET /api/department/coverage` (`src/app/api/department/coverage/route.ts`)
  - `GET /api/health` (`src/app/api/health/route.ts`)
  - `POST /api/mentor/meetings` (`src/app/api/mentor/meetings/route.ts`)

## External File Services & Parsers
- CSV parsing via `papaparse`
- Excel workbook generation via `exceljs`
- Word document generation via `docx`
