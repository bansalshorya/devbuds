import { prisma } from "@/server/db/client";

export type AutomationUser = { id: string; role: string; departmentId: string; student?: { id: string } | null };

export async function automationScope(user: AutomationUser) {
  if (user.role === "STUDENT") return user.student ? [user.student.id] : [];
  if (user.role === "MENTOR") {
    const assignments = await prisma.mentorAssignment.findMany({ where: { mentorId: user.id, student: { departmentId: user.departmentId } }, select: { studentId: true } });
    return assignments.map((a) => a.studentId);
  }
  return [];
}

export async function automationInbox(user: AutomationUser) {
  const students = await automationScope(user);
  const notices = await prisma.automationNotice.findMany({
    where: { userId: user.id, departmentId: user.departmentId, OR: [{ studentId: null }, { studentId: { in: students } }] },
    orderBy: { createdAt: "desc" }, take: 80,
  });
  const allowed = new Set(students);
  return notices.map((n) => {
    let body = n.body;
    if (n.kind === "agenda" && body && typeof body === "object" && !Array.isArray(body) && Array.isArray(body.items)) {
      body = { ...body, items: body.items.filter((item) => item && typeof item === "object" && !Array.isArray(item) && typeof item.studentId === "string" && allowed.has(item.studentId)) };
    }
    return { ...n, body };
  });
}
