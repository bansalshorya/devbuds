import { createHash } from "node:crypto";
import { prisma } from "../db/client";

// Fixed windows shared across server processes. Keys never contain raw mobile numbers or IPs.
export async function allowRequest(scope: string, identity: string, limit: number, windowSeconds: number, now = new Date()) {
  const window = Math.floor(now.getTime() / (windowSeconds * 1000));
  const key = createHash("sha256").update(`${scope}:${identity}:${window}`).digest("hex");
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key }, create: { key, expiresAt: new Date((window + 1) * windowSeconds * 1000) },
    update: { count: { increment: 1 } }, select: { count: true },
  });
  if (bucket.count === 1) await prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } });
  return bucket.count <= limit;
}
