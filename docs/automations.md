# DevBuds automation workflows

## What is implemented

Open **Automation Hub** from the mentor dashboard, student portal, or department dashboard.

| Workflow | Behavior | Who sees it |
| --- | --- | --- |
| Weekly mentor agenda | Prepares suggested conversations using current explainable alerts, meeting gaps, and overdue commitments. Refreshes the current week's agenda on daily runs. | Assigned mentor |
| Academic data sync | Validates and queues attendance, marks, or LMS CSV batches for a scheduled time. Uses existing permission-scoped upserts. | HOD schedules and reviews imports |
| Missed-meeting follow-up | Flags students whose recorded mentoring gap exceeds the department interval; resolves the notice once a recent meeting exists. | Student and assigned mentor |
| Student check-ins | Requests a weekly progress/support response, lets the student update it, and brings the latest response into the meeting preparation card. | Student and currently assigned mentors |
| Weekly digest | Reports the previous Monday–Sunday period's meetings and action completions, with current open actions and upcoming deadlines. | Mentor |
| Repeated discussion topics | Finds predefined English/Tamil topic keywords across at least two of the latest 12 notes; includes exact excerpts and links to source meetings. | Assigned mentor |
| Monthly registers | Generates an Excel register for the previous calendar month once per mentor/month, for review and download. | Mentor |
| Overdue escalation | Flags commitments overdue beyond the configured number of days. Flags resolve after completion or a deadline change. No automatic discipline or student ranking. | Assigned mentor |
| Data-quality checks | Reports missing/stale attendance, marks, and LMS data, impossible values, future dates, and duplicate source keys. Import validation rejects malformed/duplicate rows before scheduling. | HOD receives aggregate counts |
| Deployment monitoring | Checks the login page, login validation endpoint, database/schema readiness, and response time. Opens one GitHub issue when checks fail and closes it after recovery. | Repository administrators/watchers |

All in-app updates remain in DevBuds. Email, SMS, and WhatsApp services are not required or configured. Existing follow-up reminders and calendar downloads continue separately.

## Production activation

1. Apply the new additive migration `20261030000200_automation_workflows` to the production database using your reviewed Prisma migration process (`npm run db:deploy`). If this database was created manually from SQL and has no migration history, baseline it against its actual schema before using Prisma Migrate. Do not reset or seed production. The earlier login repair alone does not create these new automation tables.
2. Set a new random **CRON_SECRET** of at least 32 characters in Vercel's Production environment. Keep it server-side. The Vercel build preflight rejects an absent/short scheduler secret.
3. Deploy the code. The configured Vercel cron calls `/api/cron/automations` daily at `03:30 UTC`, approximately **9 AM India time**. On Hobby, daily timing is best effort and can vary within the hour. Requests without the exact Bearer secret are rejected.
4. Sign in as HOD, open Automation Hub, configure the meeting-gap, overdue-escalation, and stale-data intervals, then choose **Run now** for initial updates. Default intervals are 21, 7, and 14 days respectively.
5. Push the GitHub Actions workflow and enable Actions. `.github/workflows/monitor.yml` checks every 30 minutes, subject to GitHub scheduling availability. Set repository variable `DEVBUDS_URL` if the deployment differs from `https://devbuds-five.vercel.app`. The workflow uses the repository's built-in token with Issues write permission. Watch repository issues to receive GitHub notifications. It creates no issue while the monitored state remains healthy, no repeated comments during an unchanged incident, and one recovery comment when it closes an incident.

The external monitor must run outside the deployed app. DevBuds cannot report its own outage reliably while its server is unavailable. This monitor does not sign in or submit a student's credentials: it validates an empty login request and checks public service readiness.

## Scheduled academic imports

The implemented connector is **scheduled file upload**, because no college-system API contract or credentials have been supplied. Upload files in HOD → Automation Hub → Schedule academic data sync. A direct ERP/LMS pull integration remains dependent on the actual system's API and access.

- Batch limits: 100 rows and 100 KB, with at most 20 waiting import jobs per department.
- Headers match the existing CSV importer:
  - Attendance: `rollNo,subject,weekStart,attended,total`
  - Marks: `rollNo,subject,assessment,assessedOn,score,maxScore`
  - LMS: `rollNo,activityOn,events`
- Use `YYYY-MM-DD` dates. Choose the earliest run time using the device's local timezone; the request stores an absolute timestamp.
- Jobs run on the first daily run after that time, or an HOD manual run. This is not a minute-precise scheduler.
- File validation rejects duplicate keys within a batch. Existing matching database keys are updated rather than duplicated, which also makes an interrupted import safe to retry.
- Repeating the same scheduling request (same administrator, content, type, and due time) returns the existing job instead of creating a duplicate.
- Permission checks run again at execution. Unknown or unauthorized roll numbers are reported as row errors. Valid rows can be applied even if other rows fail; review inserted/updated counts before resubmitting a corrected file.
- Pending jobs can be cancelled. Completed/failed jobs discard their original CSV text; resubmit a corrected import if needed. Failed register-generation jobs have a retry control.

## Privacy, evidence, and retention

- Check-ins use the authenticated student's identity, never a student ID supplied by the browser.
- Mentors can read check-ins and student-specific notices only for current assignments in their department. Stored agendas are filtered again on read after reassignment.
- HOD notices contain aggregate academic-data issue counts, without private meeting summaries or check-in text.
- A stored register is blocked if any included student is no longer assigned to its mentor; use the current scoped register export instead.
- Repeated topics are keyword matches, including positive mentions such as improved attendance. They are not diagnoses, inferred sentiment, or a risk score. Always review the linked source context.
- Notices are retained for 90 days. Completed job inputs/results/artifacts are cleared after 90 days. Original meetings and follow-ups are not deleted by this maintenance.
- Academic snapshots, agendas, and digests describe data available at their run time. Weekly digest meeting counts use at most the latest 100 saved meetings per student; monthly exports query the complete month with the existing 2,000-meeting/5,000-row limits.

## Reliability and scale

- Stable notice/job keys prevent duplicate weekly messages and monthly files on repeat runs.
- An atomic database lease prevents overlapping department runs. It expires after 30 minutes; interrupted running jobs can then be reclaimed.
- The worker claims jobs atomically and processes up to five due jobs per pass. Each run has a time budget and records completed, partial, disabled, or failed status. Departments and mentors rotate to reduce starvation; due jobs receive a pass before agenda generation as well as afterward when time remains.
- The daily worker is intended for this small mentoring deployment. Large departments, long imports, or many simultaneous reports need a dedicated durable worker with finer-grained checkpoints and more frequent scheduling. Review partial/failed runs rather than assuming everything finished.
- Failed cron HTTP responses are observable in Vercel Logs; the HOD hub shows run history. The external monitor checks availability/schema/latency, not every third-party AI request or whether each individual job completed. Review run history for task-specific failures.
- Health responses expose readiness flags and duration, never connection strings, student records, or raw Prisma errors.

## Verification

```powershell
npm run typecheck
npm test
npm run test:monitor
npx next build --webpack
npm run start -- --port 3002
# In a second terminal, against localhost and a local database only:
npm run test:automations
```

The fixture verifier creates its own department/users, checks jobs, deduplication, leases, all role-specific hub pages, check-in persistence, meeting preparation, and reassignment privacy, then removes only its temporary fixtures. It refuses remote databases and remote app URLs. It does not call external AI or send messages.

Verification completed locally: 142 unit/route tests, 27 end-to-end automation fixture checks, TypeScript, targeted lint, and the production build passed. The monitor verifier uses a temporary local HTTP service to test healthy, unavailable, recovered, and slow states; it creates no GitHub issues. Browser visual review and production activation remain separate steps.

References: [Vercel cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs) and [Hobby scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
