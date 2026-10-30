import { prisma } from "./db/client";

// Metadata only: never record transcripts, audio, summaries, OTPs or API keys.
export async function audit(actorId: string, action: string, recordId: string) {
  await prisma.auditEvent.create({ data: { actorId, action, recordId } });
}
