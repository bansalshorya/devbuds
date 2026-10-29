---
name: CONVENTIONS.md
description: Coding style, naming conventions, design patterns, and error handling in DevBuds
metadata:
  type: reference
  date: 2026-10-29
---

# Coding Conventions: DevBuds

## Code Style & TypeScript
- Strict TypeScript configuration (`tsconfig.json`).
- Explicit typing for props, server functions, and database models.
- Path aliases: `@/*` maps to `src/*`.

## Design System & Styling (Neumorphic Design)
- **Theme Color**: Warm mist background (`#edf2f7`) with deep teal brand identity (`#0f766e`).
- **Neumorphic Utilities** (`src/app/globals.css`):
  - `.neumo-card`: Elevated cards with dual ambient shadows.
  - `.neumo-card-pressed`: Pressed state for active elements.
  - `.neumo-inset`: Inset shadow style for inputs and search bars.
- **Design Engineering**: Tactile interaction feedback (`active:scale-[0.98]`, explicit transition properties like `transition-[transform,box-shadow] 150ms ease-out`, accessible `:focus-visible:ring-2`).

## Naming & Organization
- Component files use PascalCase (`DepartmentDashboardClient.tsx`, `LogForm.tsx`, `Sparkline.tsx`).
- Utilities and helper files use camelCase or kebab-case (`attention.ts`, `engine.ts`, `dates.ts`).
- Server functions and API route handlers separated clearly into `src/server/`.
