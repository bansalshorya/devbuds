# Phase 1 Context: Alert Engine & Threshold Customization

## Domain Boundary
Enhancing the early warning detection engine and HOD aggregation dashboards with custom alert rules and threshold configurations, allowing faculty mentors to adjust risk parameters and providing HODs with department-wide visibility into at-risk students.

## Locked Requirements (from SPEC / Roadmap)
- **ALERT-01**: Mentors can configure custom alert threshold rules for attendance, internal marks, and LMS activity.
- **ALERT-02**: System automatically dispatches notifications/badges for students crossing risk thresholds.
- **ALERT-03**: HOD dashboard displays aggregated department-wide at-risk student metrics.

## Implementation Decisions & Design Choices

### 1. Threshold Customization Interface & Storage
- **Choice**: Store custom thresholds per mentor or department in database settings (or config table / JSON storage in DB) rather than static hardcoded `ALERT_CONFIG` in `src/server/alerts/config.ts`, while maintaining fallback defaults.
- **UI Interaction**: Add a threshold configuration modal or settings panel on the Mentor dashboard where mentors can adjust values (e.g. low attendance %, marks drop points, LMS inactivity days).

### 2. Notification & Risk Badging (ALERT-02)
- **Choice**: Real-time badge indicators (High/Medium/Low severity) derived dynamically via `evaluateStudent` and `sortByAttention` in `src/server/alerts/engine.ts`.
- **Display**: Highlight at-risk students with prominent visual badges and alert reasons across mentor and student detail views.

### 3. Department-Wide HOD Aggregation (ALERT-03)
- **Choice**: Aggregate student alert counts, severity breakdowns, and subject-wise risk distribution across all department students in `src/app/department/page.tsx` and `DepartmentDashboardClient.tsx`.

## Canonical References
- `src/server/alerts/config.ts` — Existing static alert configuration thresholds
- `src/server/alerts/engine.ts` — Rule evaluation logic (attendance, marks, LMS, follow-ups, meetings)
- `src/server/alerts/attention.ts` — Student data fetching and attention sorting
- `src/app/department/page.tsx` — HOD dashboard page
- `src/components/DepartmentDashboardClient.tsx` — HOD dashboard client component

## Deferred Ideas
- Automated email/SMS notifications to parents (Deferred to v2 / INT-02)
