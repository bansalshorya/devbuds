import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";
import { automationScope } from "@/server/automations/access";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user || !sameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const students = await automationScope(user);
  const result = await prisma.automationNotice.updateMany({ where: { id: (await params).id, userId: user.id, departmentId: user.departmentId, OR: [{ studentId: null }, { studentId: { in: students } }] }, data: { readAt: new Date() } });
  return Response.json(result.count ? { ok: true } : { error: "Notice not found" }, { status: result.count ? 200 : 404, headers });
}
