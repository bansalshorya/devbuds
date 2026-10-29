import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { FacultyCreateSchema } from "@/lib/schemas";
import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";

export async function POST(req: Request) {
  const hod = await getCurrentUser();
  if (!hod || hod.role !== "HOD") {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!sameOrigin(req)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  const parsed = FacultyCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Enter a faculty name and a valid 10-digit mobile number" }, { status: 400 });
  }

  try {
    const faculty = await prisma.user.create({
      data: {
        ...parsed.data,
        role: "MENTOR",
        departmentId: hod.departmentId,
      },
      select: { id: true, name: true, mobile: true },
    });
    revalidatePath("/department");
    return Response.json({ faculty }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "That mobile number already belongs to an account" }, { status: 409 });
    }
    throw error;
  }
}
