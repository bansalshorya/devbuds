# IM-104: scope from the supplied problem statement

Source: `D:/Downloads/13_IM-104_The-ten-minute-weekly-mentor-early-warning-and-a-light-log-for-faculty-mentors.txt`.

The supplied problem statement is the acceptance baseline. Earlier roadmap suggestions are optional unless they directly support these requirements. Keep the existing frontend theme, styles and colors.

| PS requirement | Current implementation | Still needed |
|---|---|---|
| Review 20 mentees and log 3 meetings in under 10 minutes | Phone-first attention list, profiles, existing typed form, voice draft controls and follow-ups | Timed test with a real faculty mentor |
| Every alert names the signals behind it | Six explainable rules with evidence, using attendance, marks, LMS and mentoring records | Validate usefulness with faculty and the supplied dataset |
| Tamil/English voice becomes a structured log with an action and follow-up date | Recording/upload, transcript, draft API, editable summary/actions/dates and explicit save | Configure real AI credentials and benchmark real Tamil/English clips; demo providers are clearly labelled |
| Register matches one of the three sample colleges | Word/Excel download controls and backend exports work | Obtain a supplied register sample and match it; general exports do not yet satisfy exact format acceptance |
| Students see their own records and agreed actions only | Student-scoped reads, role/assignment checks and authorized action completion | Faculty/student acceptance test |
| Department sees coverage rather than private notes | Department coverage display and counts API; no mentoring summaries or action text in its client props | Continue checking this boundary during integration |
| Works on a basic Android phone | Responsive existing UI, small SVG charts, browser recording with typed fallback | Actual basic Android testing over HTTPS |

The PS says department heads see coverage, not private notes. It does not explicitly prohibit names in coverage lists. An aggregate-only redesign is therefore not required just to satisfy this text.

The PS supplies a synthetic dataset, college templates and an ITLF sandbox as inputs. Only CSV fallback/general export can be completed until the actual dataset/API contract/templates are available. Placement training is mentioned in the situation, but the listed supplied dataset contains attendance, marks and LMS activity; do not invent placement data.

## Defer for now

PWA installation/offline caching, custom-threshold controls, explicit weekly review buttons, extra analytics dashboards, semester reports, production SSO and external notification integrations are not listed acceptance requirements. Do not expand the interface for them during the core PS implementation.

Existing backend work can remain; this scope does not require deleting useful code. The current additions only reconnect voice logging and register downloads alongside the already connected follow-up completion controls.

## Honest demo status

The current environment uses mocked transcription and extraction. A mock speech result is a sample, not recognition of the recording. Do not claim live speech accuracy, the ten-minute result, Android validation or an exact college register match until those tests/inputs are available. Use `docs/acceptance-test.md` for the faculty and speech test procedure; PWA-specific checks in that older broader protocol are deferred.
