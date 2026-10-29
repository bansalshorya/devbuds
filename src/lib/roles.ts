import type { Role } from "@prisma/client";

export function homeFor(role: Role): string {
  if (role === "MENTOR") return "/mentor";
  if (role === "STUDENT") return "/student";
  return "/department";
}