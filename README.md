# Ten-Minute Mentor

> **PS-first scope:** work now follows the supplied IM-104 statement, documented in [docs/problem-statement-scope.md](docs/problem-statement-scope.md). Voice logging and register downloads are connected using the existing style; optional PWA, threshold, weekly-review and analytics controls remain deferred. Live AI, a supplied college register sample, and real faculty/Android validation are still pending.

> **Current interface:** frontend changes from this chat were reverted at the owner's request on 30 October 2026. Original screens and the pre-existing CSV import page are restored. New backend APIs, database changes, validation and security work remain; the new recording, export, completion, review, report and threshold controls and PWA were removed. The feature roadmap below is not a claim that those controls are currently present.

> **Follow-up update:** completion controls have since been reconnected on the mentor follow-up list, mentor student profile and student action list using the existing theme and styles. They show saving/error feedback and refresh the list after completion. Other reverted frontend additions remain removed.

> **Working title.** Rename freely.
> Early warning and a light log for faculty mentors. Built for **Deviathon**, problem statement **IM-104** (Integraminds, Tech for Impact, Software track).

A faculty mentor opens one screen, sees which students need a conversation and **why**, then records the outcome by voice in Tamil or English. Follow-ups and the accreditation mentoring register are generated automatically.

---

## 1. The problem

Most colleges assign each faculty member about 20 mentees and expect regular meetings, partly because accreditation reviews ask for evidence of mentoring. In practice:

- The signals that a student needs help (attendance, internal assessment marks, LMS activity) sit in separate systems, and nobody combines them. Mentors find out at the end of the semester, when the student is detained or has a backlog.
- Mentors teach full timetables and cannot dig through four systems for twenty students.
- The mentoring record is a paper register or a form filled in the week before an audit. It is written for auditors, not to help students.
- Students never see their own mentoring record or what was agreed.

## 2. What we are building

A **phone-first progressive web app (PWA)** with three role-based views:

| View | User | Device | Purpose |
|---|---|---|---|
| **Mentor** | Faculty mentor | Phone | Weekly attention list, student profiles, voice logging, follow-ups, register export |
| **Student** | Mentee | Phone | Their own mentoring history, agreed actions and next follow-up date |
| **Department** | Head of department / IQAC coordinator | Laptop | Aggregate coverage only: students reached, meetings logged, pending follow-ups |

### Core capabilities

1. **Attention list.** Combines attendance, internal marks and LMS activity into a short "who needs a conversation this week" list.
2. **Evidence for every alert.** Each alert names the signals behind it (for example "attendance 68% in 3 subjects, internal marks down 18 points") and shows the trend over time.
3. **Voice-to-record.** Tamil and English voice notes become an editable meeting summary with actions and a follow-up date. A typed note is always available as a fallback.
4. **Privacy by design.** Private student records and an aggregate-only department view.
5. **Register export.** The mentoring register comes out as a by-product in the format of at least one of the three sample colleges.

### Definition of done (from the brief)

- [ ] In a user test, a mentor reviews 20 mentees and logs 3 meetings in **under 10 minutes**.
- [x] Every alert names the signals behind it.
- [ ] Tamil and English voice notes become structured logs with an action and a follow-up date.
- [ ] The mentoring register is generated in the format of at least one of the three sample colleges.
- [x] Students see their own record, and no student sees anyone else's (server restrictions and isolated-role integration checks).

### How it is judged

Usefulness to a real faculty mentor matters most. The sponsor will run a short test with faculty. The winning team gets a paid pilot inside the Integraminds platform, and every finalist gets internship interviews.

---

## 3. Guardrails (non-negotiable)

| Area | Rule | How we meet it |
|---|---|---|
| **Technology** | Explainable rules or models only. No unexplained risk scores. | Transparent rule engine. No ML model, no hidden numeric score. The list is ordered by rule severity and recency, and every rule shows its reason in plain language. |
| **Privacy** | No student ranking or comparison shown to other students. Heads of department see coverage, not private notes. | Role-based access enforced on the server. The department API returns counts only. Students can only query their own record. |
| **Deployment** | Works on a basic Android phone. | Lightweight bundle, no heavy chart libraries, tested on a low-end Android in daylight. |

---

## 4. How it works

```mermaid
flowchart LR
  A["College data: attendance, marks, LMS"] --> B["Import and validation"]
  B --> C["Rule engine"]
  C --> D["Attention list with evidence"]
  D --> E["Mentor meets student"]
  E --> F["Voice or typed note"]
  F --> G["Transcription and structured draft"]
  G --> H["Mentor reviews and saves"]
  H --> I["Follow-ups and student view"]
  H --> J["Mentoring register export"]
  H --> K["Department coverage counts"]
```

### Alert rules (explainable, configurable thresholds)

Starting rule set. Thresholds are defaults and will be tuned with faculty input.

| Rule | Example reason shown to the mentor |
|---|---|
| Low attendance in one or more subjects | "Attendance 68% in 3 subjects" |
| Sharp attendance drop over recent weeks | "Attendance fell from 82% to 61% in 3 weeks" |
| Internal marks decline | "Internal marks down 18 points since last test" |
| LMS inactivity | "No LMS activity in 14 days" |
| Overdue follow-up | "Follow-up from 12 Oct is 9 days overdue" |
| Not met recently | "Not met in 5 weeks" |

Placement-training attendance is mentioned in the brief as a signal, but it is not in the supplied dataset. Treat it as a stretch rule.

### Voice logging flow

1. The mentor picks a language (Tamil or English) and records. A typed note is always available.
2. Audio is transcribed to text.
3. An LLM extracts a structured draft: summary, topics, actions, follow-up date. Output is validated against a strict schema.
4. Relative dates ("next Friday") are resolved in code against the meeting date, and the mentor confirms them in a date picker.
5. The mentor edits and confirms. **Nothing is saved until the mentor confirms.**
6. If transcription or extraction fails, the mentor still gets the raw transcript or a blank form. The log is never lost.

---

## 5. Screens

1. **Mentor home** shows students needing attention with reasons, overdue follow-ups and weekly review progress.
2. **Student profile** shows attendance, marks and activity trends, previous conversations and agreed actions.
3. **Log conversation** has Tamil/English selection, a record button, a typed-note alternative and an editable AI draft.
4. **Follow-ups and register** shows due actions, completion controls and register export.
5. **Student view** shows their mentoring history, next action and follow-up date.
6. **Department view** shows aggregate coverage: students reached, meetings logged and pending follow-ups.

Mentor navigation: bottom tabs **This Week · Students · Follow-ups**.

---

## 6. Tech stack (proposed)

> The original proposal is retained below. Current implementation and outstanding external inputs are tracked in [docs/implementation-status.md](docs/implementation-status.md).

| Layer | Choice | Why |
|---|---|---|
| **App framework** | Next.js (App Router) + TypeScript, one codebase for UI and API | One directory, one install, one deploy. Server rendering keeps client JavaScript small for low-end phones. |
| **UI** | Tailwind CSS, Radix UI primitives (restyled), TanStack Query | Accessible sheets, dialogs and forms without a stock look. |
| **PWA** | Web app manifest + service worker (e.g. Serwist), MediaRecorder API for audio | Installable on Android with no app store. |
| **Charts** | Inline SVG sparklines | Avoids heavy chart libraries on basic phones. |
| **Backend** | Next.js route handlers (`src/app/api`) calling server-only modules, Zod for validation | Same language and types as the frontend, so API shapes cannot drift. |
| **Database** | PostgreSQL with Drizzle or Prisma | Relational model fits students, meetings and follow-ups. |
| **Data import** | CSV parser (e.g. Papa Parse) for the synthetic dataset, adapter for the ITLF classroom engagement export (sandbox) with CSV fallback | The brief supplies a dataset and a sandbox API. |
| **Auth** | Signed JWT identity in an httpOnly cookie; current role loaded from PostgreSQL | Role and assignment checks happen server-side. |
| **Speech-to-text** | To be chosen after a Tamil/English benchmark. Candidates include Sarvam AI, Whisper (hosted or self-run) and Google Speech-to-Text | Tamil accuracy, including Tamil-English mixed speech, decides this. |
| **Note extraction** | LLM with JSON-schema output, validated with Zod | Structured, editable output with a safe failure path. |
| **Register export** | `docx` and `exceljs` packages (PDF if the chosen format needs it) | Match one of the three supplied college formats exactly. |
| **Testing** | Vitest, Playwright, Lighthouse, real-device check | Covers integration tests and the 10-minute user test. |
| **Hosting** | One Next.js Node deployment and PostgreSQL | Short recordings use awaited provider requests with a 45-second timeout; the host must support the routes' 60-second duration and payload limits. |

**Login for the demo:** mobile number plus OTP with a fixed test OTP. This is a stand-in. A real college deployment would use institutional email or SSO.

---

## 7. Design principles

The product should look designed, not templated.

- **Light theme only.** Faculty use phones in bright classrooms.
- **Design tokens first.** One accent color (deep teal or blue), a gray scale for everything else, and red/amber/green reserved for alert severity only. One spacing scale (4/8/12/16/24), one corner radius, thin borders instead of shadows.
- **Compact rows, not big cards.** The student list is a scannable row: status dot, name, one-line reason, last-met date. This is what makes 20 students in 10 minutes possible.
- **Tamil-ready typography.** Pair the Latin font with **Noto Sans Tamil** so Tamil text never falls back to a system font.
- **Large touch targets** (48px minimum) and 16px+ base text.
- **Real content.** Realistic Tamil and English student names and believable alert reasons, never "John Doe".
- **Design the unhappy states.** Empty list, loading, offline, microphone permission denied, transcription failed, wrong AI draft.
- **Plain, warm language.** No slang, no marketing copy.
- **One icon set** (Lucide or Material). No emojis as icons.

---

## 8. Team and responsibilities

| Role | Owner | Responsibilities |
|---|---|---|
| **Frontend developer** | _name_ | Responsive screens, navigation, recording controls, forms, API integration |
| **Backend developer** | _name_ | Database, login and access rules, data import, explainable alerts, meeting records, follow-ups, register export |
| **Product and evaluation lead (researcher)** | _name_ | Faculty interviews, workflow and wireframes, realistic sample data, rule justification, register requirements, usability testing, pitch evidence |
| **AI integration and testing developer** | _name_ | Tamil/English transcription, structured-note extraction, AI failure handling, integration tests, deployment checks |

---

## 9. 48-hour plan

| Hours | Focus |
|---|---|
| **0-4** | Agree on screens, data fields, API responses and one demo story |
| **4-16** | Frontend runs on sample responses. Backend builds data model and alerts. AI dev proves Tamil/English transcription. Researcher prepares scenarios and 20 realistic mentees |
| **16-28** | Connect the full journey: student alert → voice recap → reviewed record → follow-up |
| **28-38** | Student and department views, access checks, register export |
| **38-44** | Timed faculty tests, basic Android check, fix failures |
| **44-48** | Freeze features, rehearse the demo, prepare the final presentation |

**Demo story (draft):** A mentor opens the app on a phone, sees an alert for a student whose attendance and internal marks have both dropped, opens the evidence, records a 30-second Tamil voice note, reviews the AI draft, saves it, and exports the register. The student then opens their own page and sees the agreed action.

---

## 10. Out of scope

Deliberately excluded to keep the 48-hour build focused:

- Predictive ML risk scores (the brief requires explainable rules only)
- Student ranking or any peer comparison
- A student wellbeing or mood check-in (not in the brief)
- Real SSO or production LMS integration beyond the supplied sandbox
- A native mobile app

---

## 11. Open questions

- [ ] Which of the three sample college register formats do we target first?
- [ ] Do we get access to the ITLF classroom engagement sandbox early enough to integrate, or do we start from the synthetic dataset and CSV?
- [ ] Which speech-to-text service gives the best Tamil accuracy on our test clips?
- [ ] Is audio deleted right after transcription? (Recommended: yes, keep only the confirmed text.)
- [ ] Will the student view be English only, or do we add Tamil labels?

---

## 12. Planned project structure

One Next.js app, one directory, one `package.json`. The UI and the API live side by side.

```
ten-minute-mentor/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── mentor/          # This Week, Students, Log conversation, Follow-ups
│   │   ├── student/         # student view
│   │   ├── department/      # department view
│   │   ├── login/
│   │   └── api/             # route handlers (the backend endpoints)
│   ├── components/          # shared UI components
│   ├── server/              # server-only code, never shipped to the browser
│   │   ├── db/              # schema, migrations, queries
│   │   ├── auth/            # JWT, role checks
│   │   ├── alerts/          # explainable rule engine
│   │   ├── import/          # synthetic dataset and ITLF adapters
│   │   ├── ai/              # transcription, note extraction, failure handling
│   │   └── register/        # register export
│   └── lib/                 # shared types, validation schemas, design tokens
├── data/                    # synthetic dataset, register templates
├── public/                  # PWA manifest, icons
├── tests/
├── docs/                    # wireframes, design tokens, rule justification
└── README.md
```

**Who works where (to avoid merge conflicts):**

- Frontend developer: `src/app/mentor`, `student`, `department`, `login`, and `src/components`
- Backend developer: `src/app/api`, `src/server/db`, `auth`, `alerts`, `import`, `register`
- AI integration developer: `src/server/ai` and `tests`
- Agree the request and response types in `src/lib` first. Both sides import them, so the API shapes cannot drift.

## 13. Getting started

```bash
npm install
cp .env.example .env
# Set DATABASE_URL and a random JWT_SECRET of at least 32 characters.
npx prisma migrate deploy
npm run db:seed
npm run dev
```

`db:seed` is for a disposable demo database; inspect it before running against existing data. On Windows use `Copy-Item .env.example .env` when creating a fresh environment. Do not overwrite existing secrets. For a production-build check run `npm run build`, then `npm run start -- --port 3001`. The application is not publicly deployed by these commands.

### Remaining-step completion

The backend provides persisted mentor/department alert settings, weekly review records, aggregate department coverage and academic trends, and performance Excel downloads. Login/AI requests have durable rate limits and important mutations write metadata-only audit events. Import supports up to 5000 rows and 3 MB per file. Mentoring register Word/Excel exports remain separate from performance reports. The frontend was subsequently reverted, so the added UI controls, browser PDF printing and PWA are not part of the current interface.

See [implementation status](docs/implementation-status.md) for external prerequisites and [faculty acceptance test](docs/acceptance-test.md) for the ten-minute and real-device protocol. `npm run test:integration` verifies the running localhost app across mentor, student, HOD and cross-department boundaries with temporary fixtures. It requires demo mode and mocked AI providers.

---

## Implemented backend logging, follow-ups and register downloads

- Authorized mentor APIs accept Tamil/English audio uploads under 3 MB and produce an editable structured draft. Draft generation never creates a meeting. The new recording/draft interface was reverted; the original typed meeting form remains.
- AI date phrases are resolved against the selected meeting date in code. Supported phrases include ISO dates, today/tomorrow, English weekdays, offsets such as "in 3 days", and common Tamil equivalents. Unsupported, ambiguous or missing dates stay blank and must be supplied by the mentor. Recording/transcription failures leave the manual form available; extraction failures retain the transcript. Unsaved drafts and recordings live only in the current tab.
- The follow-up completion API allows mentors and students to complete authorized actions. Completion is timestamped and retry-safe. Mark complete buttons are now available on the original mentor and student screens with matching styles, saving/error states and retry support.
- The register API generates Excel or Word files, optionally filtered by an inclusive date range. Only that mentor's confirmed meetings for currently assigned mentees are exported. Each action includes its due date and completion status. The added download controls were reverted. Files use a general template; matching a supplied college's exact format remains pending receipt of its sample. Original department summary CSVs are a separate feature.

### AI configuration

The `.env.example` defaults to explicitly labelled demo providers. Demo transcription inserts a sample rather than recognizing audio; demo extraction copies the note and leaves actions for manual entry. These providers run only with `DEMO_MODE=true`.

To use real transcription and extraction, set these server-side variables in `.env` and restart the server:

```dotenv
TRANSCRIBER="gemini"
EXTRACTOR="gemini"
GEMINI_API_KEY="your-google-ai-studio-key"
GEMINI_MODEL="gemini-2.5-flash"
```

Create the key in [Google AI Studio](https://aistudio.google.com/api-keys). The integration uses Gemini's [audio understanding](https://ai.google.dev/gemini-api/docs/audio) and [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output), with schema validation before displaying a draft. Audio clips are sent inline because this app limits them to 3 MB, below Gemini's documented 20 MB inline-request limit. Models are configurable with `GEMINI_MODEL`, or separately with `GEMINI_TRANSCRIPTION_MODEL` and `GEMINI_EXTRACTION_MODEL`. The previous OpenAI provider remains available by setting `TRANSCRIBER="openai"`, `EXTRACTOR="openai"`, and the corresponding OpenAI variables from `.env.example`.

Recording requires HTTPS or localhost and microphone permission. Each speech/extraction request is awaited with a 45-second provider timeout; this implementation does not claim durable background processing. Hosting must support the routes' 60-second duration and audio payload size.

The app does not write audio or unconfirmed transcripts to its database or filesystem, and extraction requests disable response storage. Audio/transcripts are sent to the configured provider; that provider's retention policy applies separately. Do not expose the API key using a `NEXT_PUBLIC_` variable. Live Tamil/mixed-speech accuracy and device timing still require testing with real clips and credentials.

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` to verify the implementation. Workflow tests use mocked database/provider boundaries; they do not call a live AI service or modify college data.

## Acknowledgements

Problem statement IM-104 by **Integraminds**, via **Deviathon**.
