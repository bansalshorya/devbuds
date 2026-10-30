import { getCurrentUser } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";
import { ImportTypeSchema } from "@/lib/schemas";
import { importCsv } from "@/server/import/csv";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "HOD")) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }
  if (!sameOrigin(req)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  const typeRaw = formData.get("type");

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Please upload a CSV file" }, { status: 400 });
  }
  if (file.size > 3 * 1024 * 1024) return Response.json({ error: "Use a CSV file under 3 MB" }, { status: 413 });

  const typeParsed = ImportTypeSchema.safeParse(typeRaw);
  if (!typeParsed.success) {
    return Response.json({ error: "Invalid import type — expected attendance, marks, or lms" }, { status: 400 });
  }

  const csvText = await file.text();

  const result = await importCsv(csvText, typeParsed.data, {
    userId: user.id,
    role: user.role as "MENTOR" | "HOD",
    departmentId: user.departmentId,
  });

  return Response.json(result);
}
