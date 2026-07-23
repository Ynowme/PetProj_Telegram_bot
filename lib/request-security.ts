import { createHmac } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, "");
  return /^\+380\d{9}$/.test(compact) ? compact : null;
}

function fingerprint(value: string): string {
  const secret = process.env.RATE_LIMIT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("RATE_LIMIT_SECRET is not configured");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function consumeRateLimit(options: {
  namespace: string;
  identifier: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = `${options.namespace}:${fingerprint(options.identifier)}`;
  const now = new Date();
  const current = await prisma.rateLimit.findUnique({ where: { key } });

  if (!current || now.getTime() - current.windowStartedAt.getTime() >= options.windowMs) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStartedAt: now },
      update: { count: 1, windowStartedAt: now },
    });
    return { allowed: true, retryAfterSeconds: Math.ceil(options.windowMs / 1000) };
  }

  const updated = await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  const retryAfterSeconds = Math.max(1, Math.ceil((current.windowStartedAt.getTime() + options.windowMs - now.getTime()) / 1000));
  return { allowed: updated.count <= options.limit, retryAfterSeconds };
}
