import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user || !sameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const body = await req.json().catch(() => ({}));
  if (body?.action === "retry") {
    const result = await prisma.automationJob.updateMany({ where: { id: (await params).id, userId: user.id, departmentId: user.departmentId, kind: "register", status: "failed" }, data: { status: "pending", result: Prisma.DbNull, dueAt: new Date(), startedAt: null, finishedAt: null } });
    return Response.json(result.count ? { ok: true } : { error: "Failed register not found." }, { status: result.count ? 200 : 404, headers });
  }
  const result = await prisma.automationJob.updateMany({ where: { id: (await params).id, userId: user.id, departmentId: user.departmentId, status: "pending" }, data: { status: "cancelled", input: {}, finishedAt: new Date() } });
  return Response.json(result.count ? { ok: true } : { error: "Pending task not found" }, { status: result.count ? 200 : 404, headers });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user || user.role !== "MENTOR") return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const job = await prisma.automationJob.findFirst({ where: { id: (await params).id, userId: user.id, departmentId: user.departmentId, kind: "register", status: "completed" } });
  if (!job?.artifact) return Response.json({ error: "Register not available." }, { status: 404, headers });
  const result = job.result as { studentIds?: string[] } | null;
  if (!Array.isArray(result?.studentIds) || result.studentIds.some((id) => typeof id !== "string")) return Response.json({ error: "Register metadata is unavailable." }, { status: 409, headers });
  const assignments = await prisma.mentorAssignment.count({ where: { mentorId: user.id, studentId: { in: result.studentIds }, student: { departmentId: user.departmentId } } });
  if (assignments !== result.studentIds.length) return Response.json({ error: "Assignments changed since generation. Use the current register export on your dashboard." }, { status: 409, headers });
  return new Response(new Uint8Array(job.artifact), { headers: { ...headers, "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="monthly-mentoring-register.xlsx"', "X-Content-Type-Options": "nosniff" } });
}
