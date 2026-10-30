-- Repair for deployments created using the older deploy.sql.
-- Run in the SQL editor for the SAME PostgreSQL database used by Vercel DATABASE_URL.
-- Adds missing objects only. Existing users, meetings, and follow-ups are preserved.
-- This does not baseline or modify Prisma migration history.
BEGIN;

ALTER TABLE public."Department" ADD COLUMN IF NOT EXISTS "alertThresholds" JSONB;
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS "alertThresholds" JSONB;

CREATE TABLE IF NOT EXISTS public."RateLimitBucket" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "RateLimitBucket_expiresAt_idx" ON public."RateLimitBucket"("expiresAt");

CREATE TABLE IF NOT EXISTS public."AuditEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "AuditEvent_actorId_createdAt_idx" ON public."AuditEvent"("actorId", "createdAt");

CREATE TABLE IF NOT EXISTS public."WeeklyReview" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "mentorId" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES public."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "weekStart" DATE NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyReview_mentorId_studentId_weekStart_key" ON public."WeeklyReview"("mentorId", "studentId", "weekStart");
CREATE INDEX IF NOT EXISTS "WeeklyReview_mentorId_weekStart_idx" ON public."WeeklyReview"("mentorId", "weekStart");

COMMIT;
