import { prisma } from "../db/client";
import { configuredThresholds } from "../../lib/thresholds";

export async function getThresholds(mentorId: string, departmentId?: string) {
  const user = await prisma.user.findUnique({ where: { id: mentorId }, select: { alertThresholds: true, departmentId: true } });
  if (user?.alertThresholds) return configuredThresholds(user.alertThresholds);
  const department = await prisma.department.findUnique({ where: { id: departmentId ?? user?.departmentId ?? "" }, select: { alertThresholds: true } });
  return configuredThresholds(department?.alertThresholds);
}
