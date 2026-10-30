import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";

// Read-only preflight. It never migrates, seeds, resets, or logs connection strings.
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters.");
  if (process.env.DEMO_MODE === "true" && !process.env.DEMO_OTP) throw new Error("DEMO_OTP must be set when demo login is enabled.");
  if (process.env.VERCEL && (process.env.CRON_SECRET?.length ?? 0) < 32) throw new Error("CRON_SECRET must contain at least 32 characters for the daily automation scheduler.");
  const url = new URL(process.env.DATABASE_URL);
  if (process.env.VERCEL && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("Vercel needs a hosted PostgreSQL DATABASE_URL, not localhost.");
  const schema = url.searchParams.get("schema") || "public";
  const db = new PrismaClient();
  try {
    const columns = await db.$queryRaw<{ table_name: string; column_name: string }[]>`
      SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = ${schema}
    `;
    const present = new Set(columns.map((column) => `${column.table_name}.${column.column_name}`));
    const missing = Prisma.dmmf.datamodel.models.flatMap((model) => model.fields
      .filter((field) => field.kind !== "object")
      .filter((field) => !present.has(`${model.dbName || model.name}.${field.dbName || field.name}`))
      .map((field) => `${model.dbName || model.name}.${field.dbName || field.name}`));
    if (missing.length) throw new Error(`Database schema is incomplete: ${missing.join(", ")}. Apply pending Prisma migrations, or use the reviewed production repair for an older SQL-created database. See docs/vercel-deployment.md.`);
    console.log("Deployment checks passed: required configuration and database columns are present.");
  } finally { await db.$disconnect(); }
}

main().catch((error: unknown) => {
  // Known preflight messages contain configuration names and schema names only.
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : undefined;
  if (error instanceof Error && (error.message.startsWith("Database schema is incomplete:") || error.message.startsWith("DATABASE_URL ") || error.message.startsWith("JWT_SECRET ") || error.message.startsWith("CRON_SECRET ") || error.message.startsWith("DEMO_OTP ") || error.message.startsWith("Vercel needs "))) {
    console.error(error.message);
  } else console.error(`Deployment check could not connect to the database${code && /^P\d{4}$/.test(code) ? ` (${code})` : ""}. Check database access and connection settings.`);
  process.exitCode = 1;
});
