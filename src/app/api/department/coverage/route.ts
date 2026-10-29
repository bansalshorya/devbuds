import { getCurrentUser } from "@/server/auth/session";
import { getCoverage } from "@/server/db/coverage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "HOD") {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }
  return Response.json(await getCoverage(user.departmentId));
}