import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";
import { validateScheduledCsv } from "@/server/automations/imports";

const Input = z.object({ type: z.enum(["attendance", "marks", "lms"]), csv: z.string().min(1).max(100000), dueAt: z.iso.datetime({ offset: true }) }).strict();
export async function POST(req: Request) {
  const user = await getCurrentUser();
  const headers = { "Cache-Control": "private, no-store" };
  if (!user || user.role !== "HOD" || !sameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  // Bound raw request bytes before JSON parsing, including chunked bodies.
  const reader = req.body?.getReader();
  if (!reader) return Response.json({ error: "Upload CSV data." }, { status: 400, headers });
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 150000) { await reader.cancel(); return Response.json({ error: "Batch is too large." }, { status: 413, headers }); } chunks.push(value); }
  let raw: unknown;
  try { raw = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { raw = null; }
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Choose a CSV type and a valid scheduled time." }, { status: 400, headers });
  const errors = validateScheduledCsv(parsed.data.csv, parsed.data.type);
  const dueAt = new Date(parsed.data.dueAt);
  if (errors.length || dueAt.getTime() < Date.now() - 60000 || dueAt.getTime() > Date.now() + 90 * 86400000) return Response.json({ error: errors.join(" ") || "Schedule within the next 90 days." }, { status: 400, headers });
  const key = `import:${createHash("sha256").update(JSON.stringify([user.departmentId, user.id, parsed.data.type, parsed.data.csv, dueAt.toISOString()])).digest("hex")}`;
  const existing = await prisma.automationJob.findUnique({ where: { key }, select: { id: true } });
  if (existing) return Response.json({ id: existing.id, duplicate: true }, { headers });
  const pending = await prisma.automationJob.count({ where: { departmentId: user.departmentId, kind: "import", status: { in: ["pending", "running"] } } });
  if (pending >= 20) return Response.json({ error: "At most 20 import batches can be waiting. Process or cancel existing batches first." }, { status: 429, headers });
  const job = await prisma.automationJob.upsert({ where: { key }, create: { key, departmentId: user.departmentId, userId: user.id, kind: "import", dueAt, input: { type: parsed.data.type, csv: parsed.data.csv } }, update: {} });
  return Response.json({ id: job.id }, { status: 201, headers });
}
