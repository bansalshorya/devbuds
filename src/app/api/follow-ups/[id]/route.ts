import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store" };
  const user = await getCurrentUser();
  if (!user || !["MENTOR", "STUDENT"].includes(user.role) || (user.role === "STUDENT" && !user.student) || !sameOrigin(req)) {
    return Response.json({ error: "Not allowed" }, { status: 403, headers });
  }
  const { id } = await params;
  const scope = user.role === "STUDENT"
    ? { studentId: user.student?.id ?? "__no_student__" }
    : { mentorId: user.id, student: { assignments: { some: { mentorId: user.id } } } };
  const where = { id, ...scope };
  // A scoped atomic update preserves the first completion time on retries.
  const completed = await prisma.$transaction(async (tx) => {
    const updated = await tx.followUp.updateMany({ where: { ...where, completedAt: null }, data: { completedAt: new Date() } });
    const record = await tx.followUp.findFirst({ where, select: { id: true, completedAt: true } });
    if (updated.count && record) await tx.auditEvent.create({ data: { actorId: user.id, action: "followup.complete", recordId: record.id } });
    return record;
  });
  if (!completed) return Response.json({ error: "Follow-up not found" }, { status: 404, headers });
  return Response.json(completed, { headers });
}
