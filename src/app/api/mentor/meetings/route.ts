import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";
import { MeetingSaveSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!sameOrigin(req)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  const parsed = MeetingSaveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const d = parsed.data;

  const dates = [d.meetingDate, ...d.actions.map((a) => a.dueDate)];
  if (dates.some((x) => Number.isNaN(new Date(x).getTime()))) {
    return Response.json({ error: "One of the dates is not valid" }, { status: 400 });
  }

  // The mentor can only log meetings for their own mentees.
  const assigned = await prisma.mentorAssignment.findFirst({
    where: { mentorId: user.id, studentId: d.studentId },
  });
  if (!assigned) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  // A retry with the same id returns the saved meeting instead of making a duplicate.
  const existing = await prisma.meeting.findUnique({ where: { clientSubmissionId: d.clientSubmissionId } });
  if (existing) {
    if (existing.mentorId !== user.id || existing.studentId !== d.studentId) return Response.json({ error: "Not allowed" }, { status: 403 });
    return Response.json({ id: existing.id, duplicate: true });
  }

  // Meeting and follow-ups are created together or not at all.
  try {
    const meeting = await prisma.$transaction(async (tx) => {
      const record = await tx.meeting.create({
        data: {
          clientSubmissionId: d.clientSubmissionId,
          mentorId: user.id,
          studentId: d.studentId,
          meetingDate: new Date(d.meetingDate),
          language: d.language,
          summary: d.summary,
          topics: d.topics,
          confirmedAt: new Date(),
          followUps: {
            create: d.actions.map((a) => ({
              studentId: d.studentId,
              mentorId: user.id,
              action: a.action,
              dueDate: new Date(a.dueDate),
            })),
          },
        },
      });
      await tx.auditEvent.create({ data: { actorId: user.id, action: "meeting.confirm", recordId: record.id } });
      return record;
    });
    return Response.json({ id: meeting.id });
  } catch (error) {
    // A concurrent retry may win between the lookup and the unique insert.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      const duplicate = await prisma.meeting.findUnique({ where: { clientSubmissionId: d.clientSubmissionId } });
      if (duplicate?.mentorId === user.id && duplicate.studentId === d.studentId) {
        return Response.json({ id: duplicate.id, duplicate: true });
      }
    }
    return Response.json({ error: "Could not save. Your text is still available; please retry." }, { status: 500 });
  }
}
