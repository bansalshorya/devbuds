import { destroySession } from "@/server/auth/session";
import { sameOrigin } from "@/server/auth/origin";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 403 });
  await destroySession();
  return Response.json({ ok: true });
}
