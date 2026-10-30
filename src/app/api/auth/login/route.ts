import { prisma } from "@/server/db/client";
import { createSession } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";
import { LoginSchema } from "@/lib/schemas";
import { allowRequest } from "@/server/security/rate-limit";
import { audit } from "@/server/audit";
import { after } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  const started = performance.now();
  const respond = (body: object, status = 200, extra: Record<string, string> = {}) => Response.json(body, { status, headers: {
    "Cache-Control": "private, no-store", "Server-Timing": `login;dur=${Math.round(performance.now() - started)}`, ...extra,
  } });
  if (process.env.DEMO_MODE !== "true") {
    return respond({ error: "Demo login is switched off" }, 403);
  }
  if (!sameOrigin(req)) {
    return respond({ error: "Not allowed" }, 403);
  }
  const parsed = LoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return respond({ error: "Enter a 10 digit mobile number and the OTP" }, 400);
  }
  const { mobile, otp } = parsed.data;
  if (!process.env.DEMO_OTP || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("[auth.login]", { stage: "configuration", code: "AUTH_CONFIGURATION_MISSING", otpConfigured: !!process.env.DEMO_OTP, sessionSecretValid: (process.env.JWT_SECRET?.length ?? 0) >= 32 });
    return respond({ error: "Sign-in is not configured correctly on the server. Please contact the administrator.", code: "AUTH_CONFIGURATION_MISSING" }, 503);
  }
  let stage = "rate_limit";
  try {
    if (!await allowRequest("login", mobile, 10, 900, new Date(), after)) return respond({ error: "Too many login attempts. Try again in 15 minutes." }, 429, { "Retry-After": "900" });
    stage = "user_lookup";
    const user = await prisma.user.findUnique({ where: { mobile }, select: { id: true, role: true } });
    if (!user || otp !== process.env.DEMO_OTP) return respond({ error: "Mobile number or OTP is not correct" }, 401);
    stage = "audit";
    await audit(user.id, "session.login", user.id);
    stage = "session";
    await createSession(user.id);
    return respond({ role: user.role });
  } catch (error) {
    const rawCode = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
    // Never log raw Prisma errors: their messages may include connection strings or query inputs.
    const code = typeof rawCode === "string" && /^P\d{4}$/.test(rawCode) ? rawCode : "AUTH_INTERNAL_ERROR";
    console.error("[auth.login]", { stage, code, durationMs: Math.round(performance.now() - started) });
    if (code === "P2021" || code === "P2022") {
      return respond({ error: "Sign-in is unavailable because the server database needs an update. Please contact the administrator.", code: "AUTH_SCHEMA_MISSING" }, 503);
    }
    return respond({ error: "The sign-in service is temporarily unavailable. Please try again shortly.", code: "AUTH_UNAVAILABLE" }, 503);
  }
}
