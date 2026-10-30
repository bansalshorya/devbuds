import { RegisterQuerySchema } from "@/lib/schemas";
import { getCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { createRegister } from "@/server/register/export";

export async function GET(req: Request) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const parsed = RegisterQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return Response.json({ error: "Choose a valid format and date range" }, { status: 400, headers });
  const { format, studentId, from, to } = parsed.data;
  if (studentId && !await prisma.mentorAssignment.findUnique({ where: { mentorId_studentId: { mentorId: user.id, studentId } }, select: { id: true } })) {
    return Response.json({ error: "Not allowed" }, { status: 403, headers });
  }
  const meetings = await prisma.meeting.findMany({
    where: {
      mentorId: user.id,
      studentId,
      student: { assignments: { some: { mentorId: user.id } } },
      meetingDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) },
    },
    orderBy: [{ meetingDate: "asc" }, { id: "asc" }],
    include: { student: { select: { rollNo: true, user: { select: { name: true } } } }, mentor: { select: { name: true } }, followUps: { orderBy: { dueDate: "asc" } } },
    take: 2001,
  });
  if (meetings.length > 2000 || meetings.reduce((n, m) => n + Math.max(1, m.followUps.length), 0) > 5000) {
    return Response.json({ error: "Too many records. Choose a shorter date range." }, { status: 413, headers });
  }
  try {
    const buffer = await createRegister(meetings, format, `${from ?? "All dates"} to ${to ?? "present"}`);
    return new Response(new Uint8Array(buffer), { headers: {
      ...headers,
      "Content-Type": format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="mentoring-register.${format}"`,
    } });
  } catch {
    return Response.json({ error: "Could not generate the register. Please retry." }, { status: 500, headers });
  }
}
