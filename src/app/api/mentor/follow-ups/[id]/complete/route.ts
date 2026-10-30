import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  const mentor = await getCurrentUser();
  if (!mentor || mentor.role !== "MENTOR") {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!sameOrigin(req)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  const { id } = await params;
  const result = await prisma.followUp.updateMany({
    where: { id, mentorId: mentor.id, completedAt: null },
    data: { completedAt: new Date() },
  });
  if (result.count === 0) {
    return Response.json({ error: "Follow-up not found or already completed" }, { status: 404 });
  }

  revalidatePath("/mentor");
  return Response.json({ ok: true });
}
