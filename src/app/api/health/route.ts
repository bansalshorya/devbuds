import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";

export async function GET() {
  const started = performance.now();
  const headers = { "Cache-Control": "private, no-store" };
  const checks = { database: false, schema: false, loginConfiguration: (process.env.JWT_SECRET?.length ?? 0) >= 32 && process.env.DEMO_MODE === "true" && !!process.env.DEMO_OTP };
  try {
    const schema = new URL(process.env.DATABASE_URL!).searchParams.get("schema") || "public";
    const columns = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = ${schema}`;
    checks.database = true;
    const present = new Set(columns.map((c) => `${c.table_name}.${c.column_name}`));
    checks.schema = Prisma.dmmf.datamodel.models.every((m) => m.fields.filter((f) => f.kind !== "object").every((f) => present.has(`${m.dbName || m.name}.${f.dbName || f.name}`)));
  } catch { /* The public readiness response never contains connection strings or schema details. */ }
  const ok = Object.values(checks).every(Boolean);
  return Response.json({ ok, checks, automationSchedulerConfigured: (process.env.CRON_SECRET?.length ?? 0) >= 32, durationMs: Math.round(performance.now() - started) }, { status: ok ? 200 : 503, headers });
}
