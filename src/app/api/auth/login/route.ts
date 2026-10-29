import { prisma } from "@/server/db/client";
import { createSession } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";
import { LoginSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  if (process.env.DEMO_MODE !== "true") {
    return Response.json({ error: "Demo login is switched off" }, { status: 403 });
  }
  if (!sameOrigin(req)) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }
  const parsed = LoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Enter a 10 digit mobile number and the OTP" }, { status: 400 });
  }
  const { mobile, otp } = parsed.data;
  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user || otp !== process.env.DEMO_OTP) {
    return Response.json({ error: "Mobile number or OTP is not correct" }, { status: 401 });
  }
  await createSession(user.id);
  return Response.json({ role: user.role });
}