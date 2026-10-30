# Implementation status

## Current scope: supplied IM-104 problem statement

See `problem-statement-scope.md` for the acceptance checklist. Voice recording/transcript/draft controls and Word/Excel register downloads are now connected in the existing mentor screens, alongside follow-up completion. The existing global theme/layout/colors are retained. These use the existing backend; there are no new database migrations for this step. Live AI remains unconfigured, and general register exports still require adaptation to an actual supplied college sample. Broader PWA/settings/review/analytics suggestions are deferred.

Earlier rollback and implementation entries below are historical snapshots, not the current feature scope. In particular, the actual PS requires department coverage without private notes; it does not explicitly require removing names from coverage lists.

## Follow-up completion reconnected

At the owner's request, Mark complete controls are now connected to the retained backend in the mentor follow-up list, mentor student profile and student action list. The shared control uses the existing button component, colors and rounded styling; global CSS, layout, navigation and theme are unchanged. Saving, disabled/completed feedback, timeout/error handling, retry and server refresh are included. Other reverted frontend features remain reverted.

Verification: 81 automated tests, 23 backend integration checks, TypeScript and the production build pass. Browser checks completed three temporary actions across all three screens, confirmed persistence after reload, and exercised a real API error followed by a successful retry. All temporary records were removed. Lint has no errors and the eight existing warnings. The recovery snapshot from the rollback remains available.

## Frontend rollback, 30 October 2026

The owner requested that all frontend changes from this chat be undone. Original tracked screens, forms, layout and styles have been restored, and the pre-existing CSV import page is preserved. Added voice, export, follow-up completion, weekly review, report and threshold controls, PWA assets, manifest, service worker and offline screen have been removed. Recovery copies are under `.undo-backups/frontend-20261030` with source files stored as `.bak`.

Backend endpoints, PostgreSQL migrations, rule configuration, weekly review records, CSV validation, request limits, audit events, backend tests and the build fix remain. The original department UI again includes its original individual coverage lists; only the department coverage API is aggregate-only. There is no longer a claim that the original UI meets the aggregate-only brief.

The inventory below describes backend capabilities unless explicitly marked as reverted. Follow-up completion is connected as described above; other new controls remain reverted.

## Locally implemented

- Six explainable alert rules, with personal mentor thresholds and department defaults persisted in PostgreSQL.
- Weekly mentee review records using Monday boundaries in Asia/Kolkata; progress UI reverted.
- Mentor and student records, reviewed voice/typed drafts, confirmed meeting saves and retry-safe follow-up completion.
- General Word/Excel mentoring register and aggregate Excel performance APIs; new download controls and browser PDF UI reverted.
- Aggregate-only HOD API, distinct assigned-student denominator, department isolation, six calendar months of coverage/academic calculations; original HOD UI restored.
- Attendance, marks and LMS CSV import with row-level validation, permission checks, impossible-value checks and repeat-safe source keys.
- LMS data remains available to server queries; added activity history, percentage presentation and missing-data UI were reverted.
- PWA, icons, safe-area styling, offline page and service worker were reverted.
- Durable login and AI request limits, metadata-only audit events for login/thresholds/confirmed meetings/completion, and a minimum 32-character session signing secret.
- Unit/route tests and a localhost integration verifier that creates and cleans its own fixtures. Removed-PWA tests and reverted-page assertions were removed from the verifier.

## External inputs or human validation still required

The owner confirmed that no college register sample or ITLF sandbox documentation is currently available.

| Item | What is needed |
|---|---|
| Exact college register layout | One supplied college sample and field mapping; current exports use a general template |
| ITLF sandbox adapter | Documented API contract, access and sample responses; CSV fallback works |
| Live speech and extraction | Configure OPENAI_API_KEY and real providers, then benchmark English, Tamil and mixed clips |
| Ten-minute criterion | Run the faculty test in acceptance-test.md with a real mentor and 20 mentees |
| Android hardware verification | An actual basic Android phone over HTTPS; desktop checks are insufficient |
| Semester-specific analytics | Actual semester boundaries/data; current charts explicitly use calendar months |
| Production institutional login | College-approved SSO/identity provider configuration; demo OTP remains a demonstration feature |
| Public deployment | Hosting destination, HTTPS, database access and secrets; local production build can run now |

## Verification commands

After the rollback, 81 Vitest tests, 23 live backend integration checks and the production build pass. Lint has no errors and eight warnings from the restored original/shared components. All ten original tracked frontend files match Git, and the pre-existing import page matches its preserved source. Seven removed-PWA tests and two reverted-frontend checks are excluded; the retained backend checks still verify access, persistence and exports.

1. `npm run db:migrate` for development migrations, or `prisma migrate deploy` for reviewed existing migrations.
2. `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
3. `npm run start -- --port 3001`, then `npm run test:integration` in a second terminal.

The live verifier is deliberately restricted to localhost, DEMO_MODE=true and both providers set to mock. It tests application/database behavior without invoking external AI. It creates unique verification departments/users/records and removes those fixtures in a finally block. Durable rate-limit buckets retain only hashed keys and are removed after expiry during later traffic.

Transcription remains synchronous with bounded request time. Private records and drafts are not persisted in the service worker. Operational production work still includes monitoring, backups, secret rotation and an approved data-retention policy; these must be agreed for a college pilot.
