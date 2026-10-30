CREATE TABLE "AutomationSettings" (
  "departmentId" TEXT PRIMARY KEY, "enabled" BOOLEAN NOT NULL DEFAULT true,
  "meetingGapDays" INTEGER NOT NULL DEFAULT 21, "escalationDays" INTEGER NOT NULL DEFAULT 7,
  "staleDataDays" INTEGER NOT NULL DEFAULT 14, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "AutomationNotice" (
  "id" TEXT PRIMARY KEY, "key" TEXT NOT NULL UNIQUE, "departmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL, "studentId" TEXT, "kind" TEXT NOT NULL, "title" TEXT NOT NULL,
  "body" JSONB NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3), "resolvedAt" TIMESTAMP(3)
);
CREATE INDEX "AutomationNotice_userId_createdAt_idx" ON "AutomationNotice"("userId", "createdAt");
CREATE INDEX "AutomationNotice_departmentId_kind_idx" ON "AutomationNotice"("departmentId", "kind");
CREATE TABLE "StudentCheckIn" (
  "id" TEXT PRIMARY KEY, "studentId" TEXT NOT NULL, "weekStart" DATE NOT NULL,
  "progress" TEXT NOT NULL DEFAULT '', "support" TEXT NOT NULL DEFAULT '',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "respondedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "StudentCheckIn_studentId_weekStart_key" ON "StudentCheckIn"("studentId", "weekStart");
CREATE INDEX "StudentCheckIn_studentId_requestedAt_idx" ON "StudentCheckIn"("studentId", "requestedAt");
CREATE TABLE "AutomationJob" (
  "id" TEXT PRIMARY KEY, "key" TEXT NOT NULL UNIQUE, "departmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL, "kind" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'pending',
  "dueAt" TIMESTAMP(3) NOT NULL, "input" JSONB NOT NULL, "result" JSONB, "artifact" BYTEA,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3), "finishedAt" TIMESTAMP(3)
);
CREATE INDEX "AutomationJob_status_dueAt_idx" ON "AutomationJob"("status", "dueAt");
CREATE INDEX "AutomationJob_userId_createdAt_idx" ON "AutomationJob"("userId", "createdAt");
CREATE TABLE "AutomationLease" ("key" TEXT PRIMARY KEY, "holder" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "AutomationRun" (
  "id" TEXT PRIMARY KEY, "departmentId" TEXT NOT NULL, "status" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "finishedAt" TIMESTAMP(3), "summary" JSONB
);
CREATE INDEX "AutomationRun_departmentId_startedAt_idx" ON "AutomationRun"("departmentId", "startedAt");
