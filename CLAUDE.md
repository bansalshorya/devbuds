# DevBuds Instructions

## Build & Development Commands
- **Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Test**: `npm run test` (Vitest)
- **Database Migrate**: `npm run db:migrate`
- **Database Seed**: `npm run db:seed`

## Architecture & Code Conventions
- Next.js 16 App Router with React 19 and Tailwind CSS v4.
- Neumorphic UI design system (`.neumo-card`, `.neumo-inset`, `.neumo-card-pressed`).
- Prisma ORM with PostgreSQL.
- Zod for validation.

## GSD Workflow Enforcement
- Reference code as `file_path:line_number`.
- Follow active phase plans in `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md`.
