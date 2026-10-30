import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { DepartmentCsvImportSchema } from "@/lib/schemas";
import { prisma } from "@/server/db/client";
import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";
import { parseDepartmentCsv } from "@/server/import/departmentCsv";

export async function POST(req: Request) {
  const hod = await getCurrentUser();
  if (!hod || hod.role !== "HOD") {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!sameOrigin(req)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  const body = DepartmentCsvImportSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "Upload a valid CSV file smaller than 500 KB" }, { status: 400 });
  }

  const parsed = parseDepartmentCsv(body.data.csv);
  if (parsed.errors.length > 0) {
    return Response.json({ error: "Fix the CSV errors and try again", errors: parsed.errors }, { status: 400 });
  }

  const facultyRows = parsed.rows.filter((row) => row.role === "MENTOR");
  const studentRows = parsed.rows.filter((row) => row.role === "STUDENT");
  const mobiles = parsed.rows.map((row) => row.mobile);
  const rollNumbers = studentRows.map((row) => row.rollNo);
  const requestedMentorMobiles = [...new Set(studentRows.flatMap((row) => row.mentorMobile ? [row.mentorMobile] : []))];

  const [existingUsers, existingStudents, existingMentors] = await Promise.all([
    prisma.user.findMany({ where: { mobile: { in: mobiles } }, select: { mobile: true } }),
    prisma.student.findMany({ where: { rollNo: { in: rollNumbers } }, select: { rollNo: true } }),
    prisma.user.findMany({
      where: {
        departmentId: hod.departmentId,
        role: "MENTOR",
        mobile: { in: requestedMentorMobiles },
      },
      select: { id: true, mobile: true },
    }),
  ]);

  const conflicts = [
    ...existingUsers.map((user) => `Mobile ${user.mobile} already belongs to an account`),
    ...existingStudents.map((student) => `Roll number ${student.rollNo} already belongs to a student`),
  ];
  if (conflicts.length > 0) {
    return Response.json({ error: "The CSV contains existing accounts", errors: conflicts }, { status: 409 });
  }

  const availableMentorMobiles = new Set([
    ...existingMentors.map((mentor) => mentor.mobile),
    ...facultyRows.map((faculty) => faculty.mobile),
  ]);
  const missingMentors = requestedMentorMobiles.filter((mobile) => !availableMentorMobiles.has(mobile));
  if (missingMentors.length > 0) {
    return Response.json({
      error: "Some assigned faculty members could not be found",
      errors: missingMentors.map((mobile) => `No faculty account uses mobile ${mobile} in this department`),
    }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const mentorsByMobile = new Map(existingMentors.map((mentor) => [mentor.mobile, mentor.id]));

      for (const faculty of facultyRows) {
        const created = await tx.user.create({
          data: {
            name: faculty.name,
            mobile: faculty.mobile,
            role: "MENTOR",
            departmentId: hod.departmentId,
          },
          select: { id: true, mobile: true },
        });
        mentorsByMobile.set(created.mobile, created.id);
      }

      let assignmentsCreated = 0;
      for (const student of studentRows) {
        const created = await tx.user.create({
          data: {
            name: student.name,
            mobile: student.mobile,
            role: "STUDENT",
            departmentId: hod.departmentId,
            student: {
              create: {
                rollNo: student.rollNo,
                departmentId: hod.departmentId,
              },
            },
          },
          select: { student: { select: { id: true } } },
        });

        if (student.mentorMobile) {
          await tx.mentorAssignment.create({
            data: {
              studentId: created.student!.id,
              mentorId: mentorsByMobile.get(student.mentorMobile)!,
            },
          });
          assignmentsCreated += 1;
        }
      }

      return {
        facultyCreated: facultyRows.length,
        studentsCreated: studentRows.length,
        assignmentsCreated,
      };
    });

    revalidatePath("/department");
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "Another account already uses one of these mobiles or roll numbers" }, { status: 409 });
    }
    throw error;
  }
}
