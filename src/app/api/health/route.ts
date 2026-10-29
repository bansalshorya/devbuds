import { prisma } from "@/server/db/client";

export async function GET() {
  const departments = await prisma.department.count();
  return Response.json({ ok: true, departments });
}