-- DevBuds automation setup for the existing Supabase database.
-- Run in the SQL editor of the project used by Vercel Production DATABASE_URL.
-- Creates missing automation tables and indexes; preserves existing records.
-- Rerunnable when the tables are absent or already match this migration.
-- Uses public schema; does not change Prisma migration history.

BEGIN;

CREATE TABLE IF NOT EXISTS public."AutomationSettings" (
  "departmentId" TEXT PRIMARY KEY, "enabled" BOOLEAN NOT NULL DEFAULT true,
  "meetingGapDays" INTEGER NOT NULL DEFAULT 21, "escalationDays" INTEGER NOT NULL DEFAULT 7,
  "staleDataDays" INTEGER NOT NULL DEFAULT 14, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS public."AutomationNotice" (
  "id" TEXT PRIMARY KEY, "key" TEXT NOT NULL UNIQUE, "departmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL, "studentId" TEXT, "kind" TEXT NOT NULL, "title" TEXT NOT NULL,
  "body" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3), "resolvedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "AutomationNotice_userId_createdAt_idx" ON public."AutomationNotice"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AutomationNotice_departmentId_kind_idx" ON public."AutomationNotice"("departmentId", "kind");
CREATE TABLE IF NOT EXISTS public."StudentCheckIn" (
  "id" TEXT PRIMARY KEY, "studentId" TEXT NOT NULL, "weekStart" DATE NOT NULL,
  "progress" TEXT NOT NULL DEFAULT '', "support" TEXT NOT NULL DEFAULT '',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "respondedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "StudentCheckIn_studentId_weekStart_key" ON public."StudentCheckIn"("studentId", "weekStart");
CREATE INDEX IF NOT EXISTS "StudentCheckIn_studentId_requestedAt_idx" ON public."StudentCheckIn"("studentId", "requestedAt");
CREATE TABLE IF NOT EXISTS public."AutomationJob" (
  "id" TEXT PRIMARY KEY, "key" TEXT NOT NULL UNIQUE, "departmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL, "kind" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending',
  "dueAt" TIMESTAMP(3) NOT NULL, "input" JSONB NOT NULL, "result" JSONB, "artifact" BYTEA,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3), "finishedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "AutomationJob_status_dueAt_idx" ON public."AutomationJob"("status", "dueAt");
CREATE INDEX IF NOT EXISTS "AutomationJob_userId_createdAt_idx" ON public."AutomationJob"("userId", "createdAt");
CREATE TABLE IF NOT EXISTS public."AutomationLease" ("key" TEXT PRIMARY KEY, "holder" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE IF NOT EXISTS public."AutomationRun" (
  "id" TEXT PRIMARY KEY, "departmentId" TEXT NOT NULL, "status" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "finishedAt" TIMESTAMP(3), "summary" JSONB
);
CREATE INDEX IF NOT EXISTS "AutomationRun_departmentId_startedAt_idx" ON public."AutomationRun"("departmentId", "startedAt");

COMMIT;
