# Discussion Log: Phase 1 - Alert Engine & Threshold Customization

- **Date**: 2026-10-29
- **Phase**: Phase 1
- **Focus**: Alert Engine & Threshold Customization

## Summary of Discussions
1. **Threshold Customization (ALERT-01)**: Decided to move from static config in `src/server/alerts/config.ts` to customizable threshold settings accessible by mentors/admins.
2. **Real-time Badges & Notifications (ALERT-02)**: Leverage existing `evaluateStudent` engine with visual severity badges.
3. **HOD Aggregation (ALERT-03)**: Enhance HOD dashboard (`DepartmentDashboardClient.tsx`) to summarize department-wide at-risk statistics clearly.

## Deferred Ideas
- Automated SMS/Email alerts to parents (Deferred to v2 / INT-02)
