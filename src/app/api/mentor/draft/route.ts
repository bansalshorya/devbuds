import { DraftRequestSchema } from "@/lib/schemas";
import { sameOrigin } from "@/server/auth/origin";
import { getAssignedMentor } from "@/server/auth/mentor";
import { AiUnavailableError, extractDraft } from "@/server/ai/provider";
import { allowRequest } from "@/server/security/rate-limit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!sameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  const input = DraftRequestSchema.safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Enter a note and a valid meeting date" }, { status: 400, headers });
  const user = await getAssignedMentor(input.data.studentId);
  if (!user) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  if (!await allowRequest("draft", user.id, 30, 900)) return Response.json({ error: "Draft limit reached. You can still fill the form manually." }, { status: 429, headers: { ...headers, "Retry-After": "900" } });
  try {
    return Response.json(await extractDraft(input.data.transcript, input.data.language, input.data.meetingDate), { headers });
  } catch (error) {
    return Response.json({ error: error instanceof AiUnavailableError ? error.message : "Could not create a draft. Your transcript is still available; edit the form manually or retry." }, { status: 503, headers });
  }
}
