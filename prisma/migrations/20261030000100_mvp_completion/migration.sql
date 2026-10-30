ALTER TABLE "Department" ADD COLUMN "alertThresholds" JSONB;
ALTER TABLE "User" ADD COLUMN "alertThresholds" JSONB;

CREATE TABLE "WeeklyReview" (
  "id" TEXT NOT NULL,
  "mentorId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "weekStart" DATE NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WeeklyReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WeeklyReview_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WeeklyReview_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "WeeklyReview_mentorId_studentId_weekStart_key" ON "WeeklyReview"("mentorId", "studentId", "weekStart");
CREATE INDEX "WeeklyReview_mentorId_weekStart_idx" ON "WeeklyReview"("mentorId", "weekStart");

CREATE TABLE "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");
