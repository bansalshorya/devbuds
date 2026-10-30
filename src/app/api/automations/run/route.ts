import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";
import { allowRequest } from "@/server/security/rate-limit";
import { runDepartmentAutomations } from "@/server/automations/runner";

export const maxDuration = 60;
export async function POST(req: Request) {
  const user = await getCurrentUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user || user.role !== "HOD" || !sameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  try {
    if (!await allowRequest("automations", user.id, 4, 3600)) return Response.json({ error: "Run at most four times per hour." }, { status: 429, headers });
    return Response.json(await runDepartmentAutomations(user.departmentId), { headers });
  } catch { return Response.json({ error: "Run failed. Check the automation tables and database connection." }, { status: 503, headers }); }
}
