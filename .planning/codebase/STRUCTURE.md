---
name: STRUCTURE.md
description: Directory layout, key file locations, and naming conventions in DevBuds
metadata:
  type: reference
  date: 2026-10-29
---

# Codebase Structure: DevBuds

## Directory Layout
```
devbuds/
├── .planning/           # GSD planning & codebase map artifacts
├── prisma/              # Database schema, migrations, and seed scripts
├── public/              # Static assets (SVGs, icons)
├── src/
│   ├── app/             # Next.js App Router pages and API routes
│   │   ├── api/         # Backend API endpoints (auth, department, mentor)
│   │   ├── department/  # HOD department overview
│   │   ├── login/       # Login page & authentication
│   │   ├── mentor/      # Mentor dashboard & student profile pages
│   │   └── student/     # Student portal
│   ├── components/      # Reusable UI components & shadcn/ui primitives
│   │   └── ui/          # Shadcn UI primitives (button, badge, card, etc.)
│   ├── lib/             # Shared utilities, schemas, and helpers
│   └── server/          # Server-side domain logic (alerts, db, auth, engine)
├── tests/               # Unit and integration tests (Vitest)
└── package.json         # Project configuration & dependencies
```

## Key Files
- `prisma/schema.prisma`: Defines User, Student, Mentor, Meeting, FollowUp, Attendance, Mark, and LmsActivity models.
- `src/server/alerts/engine.ts`: Core alert evaluation logic for student early warning system.
- `src/server/alerts/attention.ts`: Data retrieval helpers for mentor student lists.
- `src/app/mentor/page.tsx`: Mentor dashboard with filtering, sorting, and tab navigation.
- `src/components/LogForm.tsx`: Mentoring session logger form.
- `src/app/globals.css`: Tailwind CSS v4 setup and Neumorphic design system utilities (`.neumo-card`, `.neumo-inset`, `.neumo-card-pressed`).
