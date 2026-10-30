import { z } from "zod";
import { sameOrigin } from "@/server/auth/origin";
import { getCurrentUser } from "@/server/auth/session";
import { getAssignedMentor } from "@/server/auth/mentor";
import { AiUnavailableError, transcribe } from "@/server/ai/provider";
import { allowRequest } from "@/server/security/rate-limit";

export const maxDuration = 60;
const MAX_AUDIO_BYTES = 3 * 1024 * 1024;
const AUDIO_TYPES = new Set(["audio/webm", "video/webm", "audio/mp4", "video/mp4", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg", "application/ogg", "audio/flac", "audio/x-m4a"]);

export async function POST(req: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR" || !sameOrigin(req)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
  // Bound the actual body, including chunked uploads, before parsing multipart data.
  const reader = req.body?.getReader();
  if (!reader) return Response.json({ error: "Upload an audio recording" }, { status: 400, headers });
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_AUDIO_BYTES + 16384) {
        await reader.cancel();
        return Response.json({ error: "Recording is too large. Use a clip under 3 MB." }, { status: 413, headers });
      }
      chunks.push(new Uint8Array(value));
    }
    const form = await new Response(new Blob(chunks), { headers: { "Content-Type": req.headers.get("content-type") ?? "" } }).formData();
    const studentId = z.string().min(1).safeParse(form.get("studentId"));
    const language = z.enum(["English", "Tamil"]).safeParse(form.get("language"));
    const audio = form.get("audio");
    if (!studentId.success || !language.success || !(audio instanceof File) || !audio.size) {
      return Response.json({ error: "Upload audio and choose a language and student" }, { status: 400, headers });
    }
    if (audio.size > MAX_AUDIO_BYTES || !AUDIO_TYPES.has(audio.type.split(";")[0])) {
      return Response.json({ error: "Use a WebM, MP4, MP3, WAV, Ogg or FLAC recording under 3 MB" }, { status: 400, headers });
    }
    if (!await getAssignedMentor(studentId.data)) return Response.json({ error: "Not allowed" }, { status: 403, headers });
    if (!await allowRequest("voice", user.id, 15, 900)) return Response.json({ error: "Recording limit reached. You can still type your notes." }, { status: 429, headers: { ...headers, "Retry-After": "900" } });
    try {
      return Response.json(await transcribe(audio, language.data), { headers });
    } catch (error) {
      return Response.json({ error: error instanceof AiUnavailableError ? error.message : "Transcription failed. Retry the recording or type your notes." }, { status: 503, headers });
    }
  } catch {
    return Response.json({ error: "Could not read the recording. Retry or type your notes." }, { status: 400, headers });
  }
}
