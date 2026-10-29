# DevBuds: Faculty Mentoring & Early Warning System

## What This Is

DevBuds is an advanced Faculty Mentoring & Early Warning System built for educational institutions. It empowers faculty mentors and department heads (HODs) to track student academic progress, attendance, LMS engagement, and mentoring sessions in real-time, proactively identifying at-risk students and facilitating targeted interventions.

## Core Value

The single most critical capability of DevBuds is the real-time Early Warning Engine that automatically flags at-risk students based on multi-factor telemetry (attendance drops, failing internal marks, drop in LMS activity) and enables mentors to log actionable session outcomes and follow-ups.

## Requirements

### Validated

- ✓ Authentication & role-based access control (MENTOR, STUDENT, HOD) — existing
- ✓ Mentor dashboard with filtering, sorting, and at-risk indicators — existing
- ✓ Student detailed profile pages with attendance, marks, LMS activity, and meetings history — existing
- ✓ Meeting session logger with follow-up tracking (`LogForm.tsx`) — existing
- ✓ Department Head (HOD) overview dashboard (`DepartmentDashboardClient.tsx`) — existing
- ✓ Neumorphic UI design system (`.neumo-card`, `.neumo-inset`) — existing

### Active

- [ ] ENH-01: Enhanced alerting rules customization and automated notification dispatch for at-risk students
- [ ] ENH-02: Comprehensive analytics and export capabilities (PDF/Excel reports for department meetings)
- [ ] ENH-03: Student self-service portal enhancements for tracking personal mentor feedback and action items
- [ ] ENH-04: Robust end-to-end testing and performance optimization for scaling across departments

### Out of Scope

- External LMS third-party webhooks sync — manual or seed data sufficient for current deployment scope
- Real-time video conferencing integration — external meeting links and meeting summary logging sufficient for current scope

## Context

DevBuds is built on Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma ORM, and PostgreSQL. The foundational application architecture and core dashboards are already in place. This milestone focuses on enhancing analytics, alert refinement, reporting exports, and polishing the user experience.

## Constraints

- **Tech Stack**: Must use Next.js 16 App Router, TypeScript, Prisma, and Tailwind CSS v4 as established.
- **Design System**: Must adhere to the Neumorphic design aesthetic (`.neumo-card`, `.neumo-inset`) established in `globals.css`.
- **Database**: PostgreSQL via Prisma ORM.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router & Server Actions | High performance, secure server-side data fetching and mutations | ✓ Good |
| Prisma + PostgreSQL | Robust relational data modeling for students, mentors, attendance, marks, and meetings | ✓ Good |
| Neumorphic UI Styling | Clean, modern, tactile interface tailored for faculty dashboards | ✓ Good |

---
*Last updated: 2026-10-29 after project initialization*
