import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
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

  // Атомарний INSERT ... ON CONFLICT замість findUnique + окремого upsert/update: два
  // одночасні запити раніше могли прочитати той самий count до будь-якого запису і
  // обидва пройти перевірку ліміту (TOCTOU) — тепер інкремент і скидання вікна
  // відбуваються одним SQL-запитом під блокуванням рядка.
  const rows = await prisma.$queryRaw<{ count: number; windowStartedAt: Date }[]>(Prisma.sql`
    INSERT INTO "RateLimit" ("key", "count", "windowStartedAt", "updatedAt")
    VALUES (${key}, 1, now(), now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStartedAt" <= now() - (${options.windowMs} * INTERVAL '1 millisecond')
        THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "RateLimit"."windowStartedAt" <= now() - (${options.windowMs} * INTERVAL '1 millisecond')
        THEN now()
        ELSE "RateLimit"."windowStartedAt"
      END,
      "updatedAt" = now()
    RETURNING "count", "windowStartedAt"
  `);

  const row = rows[0];
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((row.windowStartedAt.getTime() + options.windowMs - Date.now()) / 1000),
  );
  return { allowed: row.count <= options.limit, retryAfterSeconds };
}
