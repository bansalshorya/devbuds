import { getCurrentUser } from "./session";
import { prisma } from "../db/client";

export async function getAssignedMentor(studentId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") return null;
  const assignment = await prisma.mentorAssignment.findUnique({
    where: { mentorId_studentId: { mentorId: user.id, studentId } },
    select: { id: true },
  });
  return assignment ? user : null;
}
