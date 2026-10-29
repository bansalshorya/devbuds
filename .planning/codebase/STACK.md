---
name: STACK.md
description: Technology stack, runtime, frameworks, dependencies, and configuration for DevBuds
metadata:
  type: reference
  date: 2026-10-29
---

# Tech Stack: DevBuds

## Overview
DevBuds is a Faculty Mentoring & Early Warning System built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma ORM, and PostgreSQL.

## Core Technologies
- **Runtime & Framework**: Next.js `16.4.3` (App Router, Turbopack enabled via `@tailwindcss/turbopack`)
- **UI & Library Ecosystem**:
  - React `19.3.0`
  - Tailwind CSS `4` (`@tailwindcss/turbopack`)
  - Base UI (`@base-ui/react`) & Radix UI primitives (`@radix-ui/react-*`)
  - Lucide React (`1.64.0`) for icons
  - Motion (`14.7.1`) for animations
  - Custom Neumorphic design system with CSS utility classes (`.neumo-card`, `.neumo-inset`, `.neumo-card-pressed`)
- **Database & ORM**:
  - PostgreSQL (via Prisma ORM `6.19.3`)
  - `@prisma/client`
- **Authentication & Security**:
  - `jose` (`6.2.13`) for JWT session management & cookies
- **Data Processing & File Export**:
  - `docx`, `exceljs`, `papaparse` for document/spreadsheet generation and CSV parsing
- **Validation**:
  - `zod` (`4.6.7`) & `zod-validation-error`

## Build & Development Tools
- **Language**: TypeScript `5` (`tsconfig.json`)
- **Linting & Typechecking**: ESLint `9`, `eslint-config-next`, `tsc --noEmit`
- **Testing**: Vitest `5.0.5` (`vitest.config.ts` / `vitest run`)
- **Script Runner**: `tsx` (`4.23.15`) for database seeding and scripts (`prisma/seed.ts`)

## Configuration Files
- `next.config.ts`: Next.js configuration
- `tsconfig.json`: TypeScript compiler options and path aliases (`@/*` mapping to `src/*`)
- `eslint.config.mjs`: Flat config for ESLint
- `components.json`: shadcn/ui configuration
- `prisma/schema.prisma`: Database schema definition
