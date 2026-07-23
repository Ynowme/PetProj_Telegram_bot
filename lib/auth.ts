import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/request-security";
import { isTelegramAuthPayload, verifyTelegramAuth } from "@/lib/telegram-auth";

// Auth.js: єдиний спосіб входу — Telegram Login Widget, JWT-сесія в httpOnly cookie.
// Реєстрації/пароля немає — за рішенням власника вхід тільки через Telegram.
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  // Потрібно, коли сайт відкривається через домен, відмінний від NEXTAUTH_URL
  // (тунель для локального тесту Telegram-віджета, або продакшн за reverse proxy).
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {
        payload: { label: "Telegram payload", type: "text" },
      },
      async authorize(credentials) {
        const raw = credentials?.payload;
        if (typeof raw !== "string") return null;

        let payload: unknown;
        try {
          payload = JSON.parse(raw);
        } catch {
          return null;
        }
        if (!isTelegramAuthPayload(payload)) return null;

        // Захист від перебору/спаму запитів верифікації (за telegram id).
        const limit = await consumeRateLimit({
          namespace: "login:telegram",
          identifier: String(payload.id),
          limit: 10,
          windowMs: 15 * 60_000,
        });
        if (!limit.allowed) return null;

        if (!verifyTelegramAuth(payload, process.env.TELEGRAM_BOT_TOKEN)) return null;

        const telegramId = String(payload.id);
        const user = await prisma.user.upsert({
          where: { telegramId },
          update: { telegramUsername: payload.username ?? null },
          create: {
            telegramId,
            telegramUsername: payload.username ?? null,
            name: [payload.first_name, payload.last_name].filter(Boolean).join(" ") || `Гість ${telegramId}`,
          },
        });

        return { id: user.id, name: user.name, email: user.email ?? undefined, isAdmin: user.isAdmin };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.isAdmin = Boolean((user as { isAdmin?: boolean }).isAdmin);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
});
