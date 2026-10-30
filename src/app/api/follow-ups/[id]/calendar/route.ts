import { getCurrentUser } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { followUpCalendar } from "@/server/follow-ups/calendar";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store" };
  const user = await getCurrentUser();
  if (!user || !["MENTOR", "STUDENT"].includes(user.role) || (user.role === "STUDENT" && !user.student)) {
    return Response.json({ error: "Not allowed" }, { status: 403, headers });
  }
  const { id } = await params;
  const scope = user.role === "STUDENT" ? { studentId: user.student!.id }
    : { mentorId: user.id, student: { assignments: { some: { mentorId: user.id } } } };
  const action = await prisma.followUp.findFirst({ where: { id, ...scope, completedAt: null } });
  if (!action) return Response.json({ error: "Open follow-up not found" }, { status: 404, headers });
  return new Response(followUpCalendar(action), { headers: {
    ...headers, "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": 'attachment; filename="devbuds-follow-up.ics"',
    "X-Content-Type-Options": "nosniff",
  } });
}
