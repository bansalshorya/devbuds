# DevBuds — Features Added Later

Updated: 30 October 2026

This file records the features and improvements added after the original mentoring screens. It describes the repository implementation; availability on the public website depends on deploying the corresponding code, applying the database changes, and configuring the required services. Older rollback notes in the README and implementation-status document describe earlier snapshots.

## 1. Voice recording and audio uploads

- Mentors can record a conversation directly in the browser.
- Recording stops automatically at 90 seconds.
- Mentors can upload an existing audio file under 3 MB instead of recording.
- An audio preview lets the mentor listen before transcription.
- Microphone permission, empty recording, unsupported format, size, and timeout errors have feedback.
- Typed notes remain available when recording or transcription fails.
- Recordings are not saved to the application's database or filesystem.

**Where:** Mentor → student profile → Log This Mentoring Session → Voice note.

## 2. Real AI transcription

- Connected real Gemini transcription alongside the existing optional OpenAI provider.
- Replaced the unavailable `gemini-2.5-flash` default with `gemini-3.1-flash-lite`.
- Demo transcription remains clearly labelled and inserts a sample only when explicitly configured.
- Added specific messages for invalid API keys, access restrictions, unavailable models, quota/rate limits, rejected requests, timeouts, and connection failures.
- Provider errors are mapped to safe messages instead of exposing raw credentials or request content.

**Requires:** Server-side provider selection and a valid API key. Local `.env` values must also be configured separately in the hosting environment.

## 3. Tamil / English output selection

- The language selector now means **Output language**, rather than the language being spoken.
- Recordings may contain Tamil, English, or a mixture of both.
- Selecting **English** requests an English transcript, translating Tamil speech as needed.
- Selecting **Tamil** requests Tamil-script text, translating English speech as needed.
- Generated summaries, topics, and action descriptions follow the selected language too.
- Re-transcribing replaces the previous transcript rather than appending a second language version.
- Changing the selector requires another transcription request to update an existing transcript.
- The optional OpenAI path detects the source language before rendering the transcript in the chosen output language.

**Example:** Tamil audio + English selected → English transcript and English draft.

## 4. Editable meeting drafts

- Transcripts or typed recaps can be turned into an editable draft.
- Drafts contain a discussion summary, topics, and explicitly agreed actions.
- Draft generation does not create a saved meeting record.
- Mentors review and edit the summary, actions, and dates before saving.
- Follow-up dates are resolved in code from supported date phrases actually present in the source text.
- Missing or ambiguous dates remain blank for manual review.
- Failed draft generation preserves the transcript for retry or manual editing.

**Where:** Voice note → Transcript or typed recap → Create editable draft.

## 5. Recording quality checks

- Audio is checked locally after recording or upload, before transcription.
- Warns about little or no sound, low volume, likely clipping/distortion, and clips shorter than one second.
- Shows the decoded recording duration.
- Uses the strongest audio channel so a silent stereo channel does not hide sound on the other channel.
- Provides **Transcribe anyway** when the mentor wants to proceed despite a warning.
- If the browser cannot analyze the recording, playback and transcription remain available.
- Audio quality analysis itself does not send the recording to an external service.

**Limit:** These are signal-level checks. They do not prove that speech is clear, detect every background-noise problem, or guarantee accurate transcription.

## 6. Follow-up completion

- Mentors and students can mark an authorized agreed action complete.
- Completion is timestamped and preserved on repeated requests.
- Controls show saving, completed, and error states with retry support.
- Lists refresh after completion.
- Completed commitments remain visible in the progress timeline.

**Where:** Mentor follow-up list, mentor student profile, and student action list.

## 7. In-app follow-up reminders

- Reminder panels appear on the mentor dashboard, mentor student profile, and student portal.
- Highlight overdue commitments and actions due within the next seven days.
- Labels include **Due today**, **Due tomorrow**, days remaining, and days overdue.
- Show overdue and upcoming counts and sort reminders by deadline.
- Date boundaries use India time.
- Reminders refresh every minute while the page is visible and when the user returns to it.
- Completing an action removes it from the reminder list.

**Delivery:** In-app reminders only; email and WhatsApp delivery were not added.

## 8. Calendar reminders

- **Add to calendar** downloads a private `.ics` file for an open follow-up.
- Calendar events are scheduled for 9 AM India time on the due date.
- The file includes alerts one day before and when due.
- Calendar text supports Tamil, escaped special characters, and UTF-8 line folding.
- Access is restricted to the authorized student or the action's mentor for a currently assigned student.
- Completed or inaccessible actions cannot be downloaded through the calendar endpoint.

**Limits:** Users must import the file and enable notifications in their calendar app. Imported events are snapshots and do not sync with later completion or changes in DevBuds. Past deadlines do not generate future calendar alerts.

## 9. Student progress timeline

- Replaced the simple conversation history with a chronological timeline.
- Shows meeting dates, summaries, output languages, topics, and associated commitments.
- Shows each action's current pending/completed status.
- Adds separate dated milestones for completed actions.
- Provides counts for meetings, completed actions, and still-open actions.
- Includes an empty state before the first saved conversation.

**Where:** Mentor → student profile, and the student portal.

## 10. Meeting preparation cards

- Added **Prepare for this meeting** to mentor student profiles.
- Brings together the latest saved conversation, unfinished commitments, and their deadlines.
- Includes current attention alerts as discussion points.
- Shows the latest recorded weekly attendance and the percentage-point change from the previous recorded week, when available.
- Provides guidance for a first meeting or when no actions are outstanding.
- Links directly to the meeting notes form.

**How it works:** Preparation uses existing records; it does not invent an AI-generated student assessment.

## 11. Word / Excel mentoring register downloads

- Mentors can download general mentoring registers as Word or Excel files.
- Exports can be filtered by student and date range.
- Include confirmed meetings, agreed actions, due dates, and completion status.
- Restrict records to the authenticated mentor and currently assigned mentees.

**Limit:** The export uses a general template. Matching a specific college's register still requires its sample layout.

## 12. Login reliability and production database repair

- Diagnosed the deployed login failure as Prisma `P2021`: the production database lacked `RateLimitBucket`.
- Added a rerunnable SQL repair for the missing rate-limit, audit, weekly-review, and alert-settings objects, preserving existing records.
- Login now returns useful JSON errors for missing schema, missing configuration, and temporary service failures.
- Checks login configuration before doing database work.
- Keeps rate limiting enforced if the database fails.
- Adds safe diagnostics with the failing step, Prisma error code, and elapsed time.
- Adds `Server-Timing` information to login responses.
- Adds a 20-second client timeout and prevents duplicate submissions.
- Keeps the button disabled with **Opening your portal…** after successful authentication.

**Repair instructions:** [Vercel deployment and database repair](vercel-deployment.md).

## 13. Performance improvements

- Pins Vercel Functions to Mumbai (`bom1`) to match the confirmed Supabase Mumbai database location.
- Enables Prisma's joined relation queries for the mentor dashboard, student profile, student history, and session lookup.
- Joins department threshold settings into the mentor settings query while preserving mentor overrides.
- Runs independent roster and settings reads concurrently.
- Fetches only the fields needed by the mentor dashboard instead of full user records and saved meeting summaries.
- Moves expired rate-limit cleanup after the login response while still awaiting enforcement of the current limit.
- Uses one authenticated navigation after login instead of racing a router push and refresh.

**Measured locally:** Dashboard retrieval dropped from nine database queries to two, with matching results for 20 demo students. This is a query-count comparison, not a verified production speedup. The latest changes must be deployed before production timing can be reassessed.

## 14. Deployment checks

- Added `npm run deploy:check` to validate required configuration and the database's model tables/columns without changing records.
- Added a Vercel build command that regenerates Prisma Client, runs the preflight check, and builds the app.
- Missing schema now stops the configured deployment build instead of becoming a broken live login.
- Added `npm run db:deploy` for reviewed Prisma migration deployment.
- Documented production environment variables, database repair, connection pooling, and regional configuration.

**Limit:** The preflight checks columns and configuration, not indexes or migration history. It does not automatically migrate, reset, or seed production.

## 15. Animated GitHub introduction

- Added a repository-local SVG banner to the README introducing DevBuds.
- Illustrates **Notice → Talk → Follow through**.
- Includes staggered text/card entrances, animated signal bars, a voice waveform, a moving progress marker, pulsing checkpoints, and drifting particles.
- Keeps informational text steady after entry.
- Includes a reduced-motion fallback and descriptive alternative text.
- Uses no external animation service or runtime dependency.

**Asset:** [Animated DevBuds introduction](assets/devbuds-intro.svg).

## Other supporting backend capabilities retained during development

- Configurable mentor alert thresholds with department defaults.
- Weekly mentee review records using Monday boundaries in India time.
- Validated attendance, marks, and LMS CSV imports with permission checks and repeat-safe source keys.
- Aggregate department coverage and academic reporting APIs.
- Durable login/AI request limits and metadata-only audit events.
- Retry-safe confirmed meeting saves and role/assignment checks for private records.

These backend capabilities should not be read as a claim that every settings, review, or analytics control is exposed in the current interface. Some broader frontend additions were reverted or deferred earlier.

## 16. Automation workflows

Added an Automation Hub with weekly mentor agendas, scheduled academic CSV imports, missed-meeting follow-ups, student check-ins, weekly digests, repeated-topic evidence, monthly registers, overdue escalation, data-quality reports, and an external deployment monitor. See [automation setup and limits](automations.md) for role permissions, scheduling, the new migration, and production activation.

## Verification and remaining work

The latest recorded validation passed **142 automated tests**, type checking, targeted lint, and a Webpack production build. Local production-mode login and mentor dashboard requests also succeeded. Live synthetic Tamil speech was tested with both Tamil and English output during the transcription work.

Still requires external configuration or validation:

- Redeployment of changes that are not yet on the public site.
- Correct production database schema, provider credentials, and hosting environment variables.
- Production performance measurements after redeployment.
- Real faculty acceptance testing and basic Android-device checks.
- A specific college register sample for an exact export layout.
- Institutional authentication for real college use; the advertised OTP login remains a demo flow.
