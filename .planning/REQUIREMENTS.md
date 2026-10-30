# Requirements: DevBuds

**Defined:** 2026-10-29

**Frontend rollback, 2026-10-30:** original screens and forms were restored at the owner's request. Backend endpoints below remain, but new settings, export, completion and review controls and the PWA have been removed. Backend implementation status does not imply the controls exist in the current UI.
**Core Value:** Real-time Early Warning Engine flagging at-risk students and empowering mentors with actionable session logging and follow-ups.

## v1 Requirements

### Alerts & Early Warning
- [ ] **ALERT-01**: Mentors can configure custom alert threshold rules for attendance, internal marks, and LMS activity — backend persistence retained; new frontend controls reverted
- [x] **ALERT-02**: System automatically dispatches notifications/badges for students crossing risk thresholds — implemented as in-app badges on data load/refresh; external push notifications are not included
- [ ] **ALERT-03**: HOD dashboard displays aggregated department-wide at-risk student metrics — aggregate API retained; original dashboard restored

### Analytics & Reporting
- [ ] **RPT-01**: Mentors and HODs can export student performance and attendance reports to Excel/PDF — Excel API retained; report/download/PDF UI reverted
- [ ] **RPT-02**: Department dashboard provides graphical trend analysis of student progress across semesters — six calendar months and subject analytics are implemented; actual semester boundaries/data remain unavailable

### Student Portal & Interaction
- [x] **PORT-01**: Students can view their personal mentoring notes, session history, and pending follow-ups
- [x] **PORT-02**: Students can mark follow-up action items as completed or submit feedback — completion API and matching-style buttons are connected for their own actions

### Quality & Testing
- [x] **TEST-01**: Vitest covers all six alert rules, date handling, validation, authorization, exports, settings, reviews and offline cache privacy
- [ ] **TEST-02**: Backend workflow verification remains; reverted UI and PWA assertions are no longer claimed as complete

## v2 Requirements

### Integration
- **INT-01**: Automated synchronization with institutional LMS and attendance APIs
- **INT-02**: Automated SMS/Email alerts to parents of critical at-risk students

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time video conferencing | External meeting links and summary logging sufficient |
| Automated timetable scheduling | Handled by core institutional ERP systems |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ALERT-01 | Phase 1 | Backend retained; settings UI reverted |
| ALERT-02 | Phase 1 | Implemented: in-app badges |
| ALERT-03 | Phase 1 | Aggregate API retained; original UI restored |
| RPT-01 | Phase 2 | Excel API retained; new export/PDF UI reverted |
| RPT-02 | Phase 2 | Partial: calendar-month trends; semester inputs pending |
| PORT-01 | Phase 3 | Implemented |
| PORT-02 | Phase 3 | Completion API and original-style buttons connected |
| TEST-01 | Phase 4 | Automated checks passing |
| TEST-02 | Phase 4 | 23 backend integration checks pass; new UI reverted |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-29*
*Last updated: 2026-10-30. See docs/implementation-status.md and docs/acceptance-test.md for external inputs and human validation still pending.*
