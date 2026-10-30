import { revalidatePath } from "next/cache";
import { MentorAssignmentSchema } from "@/lib/schemas";
import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteContext) {
  const hod = await getCurrentUser();
  if (!hod || hod.role !== "HOD") {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!sameOrigin(req)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  const parsed = MentorAssignmentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Choose a valid faculty member" }, { status: 400 });
  }

  const { id } = await params;
  const student = await prisma.user.findFirst({
    where: {
      id,
      departmentId: hod.departmentId,
      role: "STUDENT",
      student: { isNot: null },
    },
    select: { student: { select: { id: true } } },
  });
  if (!student?.student) {
    return Response.json({ error: "Student not found in your department" }, { status: 404 });
  }

  const { mentorId } = parsed.data;
  if (mentorId) {
    const mentor = await prisma.user.findFirst({
      where: { id: mentorId, departmentId: hod.departmentId, role: "MENTOR" },
      select: { id: true },
    });
    if (!mentor) {
      return Response.json({ error: "Faculty member not found in your department" }, { status: 404 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.mentorAssignment.deleteMany({ where: { studentId: student.student!.id } });
    if (mentorId) {
      await tx.mentorAssignment.create({
        data: { studentId: student.student!.id, mentorId },
      });
    }
  });

  revalidatePath("/department");
  return Response.json({ ok: true });
}
