import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";
import { AutomationSettingsSchema } from "@/lib/automations";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user || user.role !== "HOD" || !sameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const parsed = AutomationSettingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choose valid automation intervals." }, { status: 400, headers });
  await prisma.$transaction(async (tx) => {
    await tx.automationSettings.upsert({ where: { departmentId: user.departmentId }, create: { departmentId: user.departmentId, ...parsed.data }, update: parsed.data });
    await tx.auditEvent.create({ data: { actorId: user.id, action: "automation.settings", recordId: user.departmentId } });
  });
  return Response.json({ ok: true }, { headers });
}
