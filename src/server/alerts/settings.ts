import { prisma } from "../db/client";
import { configuredThresholds } from "../../lib/thresholds";

export async function getThresholds(mentorId: string, departmentId?: string) {
  const user = await prisma.user.findUnique({
    relationLoadStrategy: "join",
    where: { id: mentorId },
    select: { alertThresholds: true, departmentId: true, department: { select: { alertThresholds: true } } },
  });
  if (user?.alertThresholds) return configuredThresholds(user.alertThresholds);
  if (user && (!departmentId || departmentId === user.departmentId)) return configuredThresholds(user.department.alertThresholds);
  const department = await prisma.department.findUnique({ where: { id: departmentId ?? user?.departmentId ?? "" }, select: { alertThresholds: true } });
  return configuredThresholds(department?.alertThresholds);
}
