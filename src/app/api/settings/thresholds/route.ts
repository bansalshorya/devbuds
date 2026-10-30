import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";
import { prisma } from "@/server/db/client";
import { getThresholds } from "@/server/alerts/settings";
import { configuredThresholds, ThresholdSchema } from "@/lib/thresholds";

const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["MENTOR", "HOD"].includes(user.role)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const department = user.role === "HOD" ? await prisma.department.findUnique({ where: { id: user.departmentId }, select: { alertThresholds: true } }) : null;
  const values = user.role === "HOD" ? configuredThresholds(department?.alertThresholds) : await getThresholds(user.id);
  return Response.json({ values, personalOverride: user.role === "MENTOR" && Boolean(user.alertThresholds) }, { headers });
}
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || !["MENTOR", "HOD"].includes(user.role) || !sameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const body = await req.json().catch(() => null);
  const reset = body && Object.keys(body).length === 1 && body.reset === true;
  const parsed = ThresholdSchema.safeParse(body);
  if (!reset && !parsed.success) return Response.json({ error: parsed.error?.issues[0].message ?? "Invalid thresholds" }, { status: 400, headers });
  const alertThresholds = reset ? (await import("@prisma/client")).Prisma.DbNull : parsed.data!;
  await prisma.$transaction(async (tx) => {
    if (user.role === "MENTOR") await tx.user.update({ where: { id: user.id }, data: { alertThresholds } });
    else await tx.department.update({ where: { id: user.departmentId }, data: { alertThresholds } });
    await tx.auditEvent.create({ data: { actorId: user.id, action: reset ? "thresholds.reset" : "thresholds.update", recordId: user.role === "MENTOR" ? user.id : user.departmentId } });
  });
  return Response.json({ ok: true }, { headers });
}
