import { z } from "zod";
import { getAssignedMentor } from "@/server/auth/mentor";
import { sameOrigin } from "@/server/auth/origin";
import { prisma } from "@/server/db/client";
import { kolkataWeekStart } from "@/lib/weeks";

export async function POST(req: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!sameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const input = z.object({ studentId: z.string().min(1) }).strict().safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Choose a student" }, { status: 400, headers });
  const user = await getAssignedMentor(input.data.studentId);
  if (!user) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const review = await prisma.weeklyReview.upsert({
    where: { mentorId_studentId_weekStart: { mentorId: user.id, studentId: input.data.studentId, weekStart: kolkataWeekStart() } },
    create: { mentorId: user.id, studentId: input.data.studentId, weekStart: kolkataWeekStart() }, update: {},
  });
  return Response.json({ reviewedAt: review.reviewedAt }, { headers });
}
