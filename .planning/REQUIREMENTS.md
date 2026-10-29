# Requirements: DevBuds

**Defined:** 2026-10-29
**Core Value:** Real-time Early Warning Engine flagging at-risk students and empowering mentors with actionable session logging and follow-ups.

## v1 Requirements

### Alerts & Early Warning
- [ ] **ALERT-01**: Mentors can configure custom alert threshold rules for attendance, internal marks, and LMS activity
- [ ] **ALERT-02**: System automatically dispatches notifications/badges for students crossing risk thresholds
- [ ] **ALERT-03**: HOD dashboard displays aggregated department-wide at-risk student metrics

### Analytics & Reporting
- [ ] **RPT-01**: Mentors and HODs can export student performance and attendance reports to Excel/PDF
- [ ] **RPT-02**: Department dashboard provides graphical trend analysis of student progress across semesters

### Student Portal & Interaction
- [ ] **PORT-01**: Students can view their personal mentoring notes, session history, and pending follow-ups
- [ ] **PORT-02**: Students can mark follow-up action items as completed or submit feedback

### Quality & Testing
- [ ] **TEST-01**: Comprehensive Vitest unit and integration test coverage for alert engine and server actions
- [ ] **TEST-02**: End-to-end user workflow verification across mentor, student, and HOD roles

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
| ALERT-01 | Phase 1 | Pending |
| ALERT-02 | Phase 1 | Pending |
| ALERT-03 | Phase 1 | Pending |
| RPT-01 | Phase 2 | Pending |
| RPT-02 | Phase 2 | Pending |
| PORT-01 | Phase 3 | Pending |
| PORT-02 | Phase 3 | Pending |
| TEST-01 | Phase 4 | Pending |
| TEST-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-29*
*Last updated: 2026-10-29 after initial definition*
