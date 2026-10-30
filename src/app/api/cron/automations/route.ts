import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/server/db/client";
import { runDepartmentAutomations } from "@/server/automations/runner";

export const maxDuration = 60;
export async function GET(req: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || secret.length < 32 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const deadline = Date.now() + 45000;
  try {
    const [departments, runs] = await Promise.all([
      prisma.department.findMany({ select: { id: true } }),
      prisma.automationRun.groupBy({ by: ["departmentId"], _max: { startedAt: true } }),
    ]);
    const last = new Map(runs.map((r) => [r.departmentId, r._max.startedAt?.getTime() ?? 0]));
    departments.sort((a, b) => (last.get(a.id) ?? 0) - (last.get(b.id) ?? 0));
    let completed = 0, failed = 0, skipped = 0;
    for (const department of departments) {
      if (Date.now() > deadline - 5000) { skipped++; continue; }
      try { await runDepartmentAutomations(department.id, new Date(), deadline); completed++; } catch { failed++; }
    }
    return Response.json({ completed, failed, deferred: skipped }, { status: failed ? 503 : 200, headers });
  } catch { return Response.json({ error: "Scheduler could not access the database." }, { status: 503, headers }); }
}
