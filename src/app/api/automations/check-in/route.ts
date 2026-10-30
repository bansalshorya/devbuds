import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";
import { CheckInSchema } from "@/lib/automations";
import { kolkataWeekStart } from "@/lib/weeks";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user || user.role !== "STUDENT" || !user.student || !sameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const parsed = CheckInSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Describe your progress in 3–1000 characters; keep support requests under 1000 characters." }, { status: 400, headers });
  const studentId = user.student.id;
  const weekStart = kolkataWeekStart();
  await prisma.$transaction(async (tx) => {
    await tx.studentCheckIn.upsert({ where: { studentId_weekStart: { studentId, weekStart } }, create: { studentId, weekStart, ...parsed.data, respondedAt: new Date() }, update: { ...parsed.data, respondedAt: new Date() } });
    await tx.automationNotice.updateMany({ where: { userId: user.id, studentId, kind: "checkin", resolvedAt: null }, data: { resolvedAt: new Date() } });
    await tx.auditEvent.create({ data: { actorId: user.id, action: "checkin.submit", recordId: studentId } });
  });
  return Response.json({ ok: true }, { headers });
}
