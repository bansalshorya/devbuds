# Roadmap: DevBuds

**Scope override:** the owner supplied the actual IM-104 statement and requested the required features first. Use `docs/problem-statement-scope.md` as the acceptance baseline; optional enhancements in this older roadmap are deferred.

**Milestone:** v1 Enhancements & Hardening
**Created:** 2026-10-29

**Frontend rollback, 2026-10-30:** the owner requested original frontend screens and forms. New frontend controls/PWA have been reverted while backend endpoints, migrations and tests remain. The previous completion snapshot below describes the pre-rollback state; current UI-dependent requirements have been reopened.

**Status, 2026-10-30:** Phases 1 and 3 are implemented. Phase 2 has aggregate Excel/browser PDF reporting, subject overviews and six calendar months of trends; semester-specific data remains pending. Phase 4 automated checks and the isolated local integration verifier pass. Live speech benchmarking, actual faculty timing and Android hardware checks are still required; see `docs/acceptance-test.md`.

## Phases

### Phase 1: Alert Engine & Threshold Customization
**Goal:** Enhance the early warning detection engine and HOD aggregation dashboards with custom alert rules and threshold configurations.
**Mode:** mvp
**Requirements:** ALERT-01, ALERT-02, ALERT-03
**Success Criteria:**
1. Mentors can configure custom attendance, marks, and LMS activity thresholds.
2. System accurately flags and highlights students crossing risk thresholds in real-time.
3. HOD dashboard summarizes department-wide at-risk statistics clearly.

### Phase 2: Analytics, Charts & Export Reports
**Goal:** Provide robust reporting and data visualization tools for faculty and department heads.
**Mode:** mvp
**Requirements:** RPT-01, RPT-02
**Success Criteria:**
1. Users can export attendance and performance reports to Excel and PDF formats.
2. Department dashboard features clear graphical trend analysis across subjects and semesters.

### Phase 3: Student Portal & Follow-up Actions
**Goal:** Empower students with full visibility into their mentoring records and actionable follow-ups.
**Mode:** mvp
**Requirements:** PORT-01, PORT-02
**Success Criteria:**
1. Students can view personal meeting notes, session history, and pending follow-up items.
2. Students can update follow-up statuses or submit feedback on action items.

### Phase 4: Testing, Verification & Hardening
**Goal:** Ensure high reliability, test coverage, and end-to-end workflow stability.
**Mode:** mvp
**Requirements:** TEST-01, TEST-02
**Success Criteria:**
1. Vitest unit and integration tests cover the alert engine, server actions, and key utility functions.
2. End-to-end user flows across mentor, student, and HOD roles verify successfully without errors.
