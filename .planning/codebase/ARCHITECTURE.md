---
name: ARCHITECTURE.md
description: System design, architectural layers, data flow, and entry points in DevBuds
metadata:
  type: reference
  date: 2026-10-29
---

# Architecture: DevBuds

## Architectural Pattern
DevBuds follows a **Next.js App Router** architecture with clear separation of concerns between Server Components, Server Actions / Route Handlers, and Client Interaction Islands (`"use client"`).

## Layers & Directory Organization
- **Presentation Layer (`src/app/`)**: Server and client pages utilizing the Neumorphic design system (`.neumo-card`, `.neumo-inset`).
  - `/` (`src/app/page.tsx`)
  - `/login` (`src/app/login/page.tsx`)
  - `/mentor` (`src/app/mentor/page.tsx`, student profiles at `/mentor/students/[id]`)
  - `/student` (`src/app/student/page.tsx`)
  - `/department` (`src/app/department/page.tsx`)
- **UI Components (`src/components/`)**: Reusable components such as `LogForm.tsx`, `DepartmentDashboardClient.tsx`, `Sparkline.tsx`, and Shadcn/UI wrappers (`src/components/ui/`).
- **Server & Business Logic (`src/server/`)**:
  - Database access: `src/server/db/client.ts`, `src/server/db/coverage.ts`
  - Authentication: `src/server/auth/session.ts`
  - Alert engine: `src/server/alerts/engine.ts`, `src/server/alerts/attention.ts`, `src/server/alerts/config.ts`
- **Utilities & Schemas (`src/lib/`)**:
  - Zod validation schemas (`src/lib/schemas.ts`)
  - Date formatting (`src/lib/dates.ts`)
  - Role management (`src/lib/roles.ts`)
  - Utility helpers (`src/lib/utils.ts`)

## Data Flow
1. **Request Lifecycle**: Incoming HTTP requests or Next.js route navigation hit App Router Server Components (`page.tsx`).
2. **Data Fetching**: Server Components query PostgreSQL directly via Prisma (`src/server/db/client.ts`) or server modules (`getMentorStudents`, `getStudentForMentor`).
3. **Alert Evaluation**: Student metrics (attendance, marks, LMS activity, meetings, follow-ups) are evaluated in real-time via `evaluateStudent` (`src/server/alerts/engine.ts`).
4. **Interactive Updates**: Client components handle user inputs (e.g., logging meetings in `LogForm.tsx`, filtering students, expanding department metric cards) and submit via API routes or server actions.
