# Vercel login failure and deployment checks

## Confirmed production failure

The deployment returned Prisma `P2021` at `prisma.rateLimitBucket.upsert()` because `public.RateLimitBucket` was missing. A successful `/api/health` department count does not prove that all required tables exist. Login must enforce its rate limit; it must not bypass the missing table.

## Repair the existing database

In the database provider's SQL editor, select the **production database used by Vercel's Production `DATABASE_URL`**. Run the contents of [`20261030-production-schema.sql`](../prisma/repairs/20261030-production-schema.sql). This transaction adds the missing rate-limit, audit, and weekly-review tables, their indexes, and the alert-settings columns. It preserves existing records and supports re-running. Review the target database before executing it; the script targets the `public` schema used in the observed error.

This is for the older database created manually from `deploy.sql`. If the database is already managed by Prisma migrations, use `npm run db:deploy` in the deployment pipeline instead. Do not run the seed script or reset the production database to fix login. The repair SQL does not mark migrations as applied; baseline a manually created database against the actual schema before adopting Prisma Migrate for future releases.

After repairing the database, retry login. The table repair takes effect without an app redeploy. Redeploy the updated code to get safe error responses, server timing, and deployment checks.

## Required Vercel configuration

Set these in the project's **Production** environment and redeploy after changing them:

- `DATABASE_URL`: hosted PostgreSQL connection string. Use the provider's pooled runtime connection when available; local `.env` is not uploaded to Vercel.
- `JWT_SECRET`: a random secret of at least 32 characters.
- `DEMO_MODE=true` and `DEMO_OTP=123456` for the advertised demo accounts. Real authentication is a separate integration.
- The Gemini provider variables when real transcription is enabled.

The project uses `npm run vercel-build`: generate Prisma Client, run a read-only configuration/schema check, then build Next.js. Missing tables stop deployment with their column names, before the app can be promoted with a broken login. This script never resets, seeds, or automatically modifies production data. Apply reviewed migrations in a release step before building; keep preview databases isolated from production.

Run `npm run deploy:check` against the intended database to verify all model tables and columns, rather than relying only on the shallow health endpoint. The check does not validate indexes or migration history.

## Delay and diagnostics

- Login no longer waits for expired rate-limit cleanup. Next.js `after` runs that housekeeping after the response; checking and incrementing the current limit remains awaited.
- Login performs one authenticated document navigation instead of racing a router push and refresh, which could duplicate dashboard loads.
- Independent mentor settings and roster queries run concurrently. The roster only fetches fields used by the dashboard instead of loading saved meeting summaries and entire user records for every student.
- Login requests time out visibly after 20 seconds. Server errors return JSON with a safe error code. Vercel logs record only the failing step, Prisma code, and elapsed time; they omit raw query inputs, mobile numbers, OTPs, and credentials.
- Production is confirmed to use Supabase Mumbai. `vercel.json` pins functions to Mumbai (`bom1`) to keep database traffic within that region. Before this change, live API response identifiers included `iad1` and measurements showed roughly 5 seconds for login, 15.5 seconds to finish the mentor dashboard, and 3.6 seconds for the database health endpoint. These are pre-fix measurements from one run, not a speed guarantee after deployment.
- Prisma 6's `relationJoins` preview feature is enabled. Explicit joined reads on the dashboard, student profile, student history, and session lookup fetch related records in one database query instead of making a separate trip per relationship. Threshold inheritance also joins the department in the same query while preserving mentor overrides. Regenerate Prisma Client with `npx prisma generate` after pulling this change; no database migration is needed for the query strategy.
- In Supabase's Connect dialog, select the **Transaction pooler** for the Mumbai project when configuring Vercel's runtime `DATABASE_URL`. For this Prisma 6 client, use the provider's documented `pgbouncer=true` option with transaction pooling. Do not send or commit the URL. Keep migration/administration connections separate according to Supabase's Prisma guide. Verify the deployed function region and retime login after redeploying; database cold starts, pooling, and network distance can still affect latency.

References: [Vercel function regions](https://vercel.com/docs/functions/configuring-functions/region), [Prisma migration deployment](https://docs.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate), and the installed Next.js `after` documentation.
