# Build and test results

Verified locally on 30 October 2026.

| Check | Result |
| --- | --- |
| `npm run build` | Passed; production build uses `next build --webpack` |
| `npm test` | Passed: 142 tests across 12 test files |
| `npm run typecheck` | Passed after build generated the route types |
| `npm run lint` | Passed with zero errors and six existing warnings |
| `npm run test:monitor` | Passed: healthy, failed, recovered, and slow-response checks |
| `scripts/verify-workflow.ts` against the built localhost app | Passed: 24 integration checks |
| `scripts/verify-automations.ts` against the built localhost app | Passed: 27 automation workflow checks |
| CI and monitoring workflow YAML | Parsed successfully |

The local integration runs used their own temporary database fixtures and mocked AI providers. Their fixtures were removed and the temporary production server was stopped. These checks do not assert live speech accuracy or production deployment status.

The default build command and the Vercel build command now share the verified Webpack path. Type checking should run after a build (or type generation), rather than concurrently with a build that rewrites `.next/types`.

`.github/workflows/ci.yml` adds automatic checks on pushes and pull requests using PostgreSQL 17, Node.js 24, mocked AI providers, a production build, and both integration suites. This workflow has been validated locally; its first GitHub-hosted run will happen after the file is pushed. No production database or Vercel deployment was modified by this verification.
