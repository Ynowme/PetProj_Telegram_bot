import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit } from "@/lib/request-security";
import { consumeTelegramLoginToken, TelegramLoginError } from "@/lib/telegram-login";

// Auth.js: єдиний спосіб входу — Telegram-бот через deep link (див. lib/telegram-login.ts,
// FR-004), JWT-сесія в httpOnly cookie. Реєстрації/пароля немає — за рішенням власника
// вхід тільки через Telegram.
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  // Потрібно, коли сайт відкривається через домен, відмінний від NEXTAUTH_URL
  // (тунель для локального тесту, або продакшн за reverse proxy).
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "telegram-bot",
      name: "Telegram",
      credentials: {
        token: { label: "Login token", type: "text" },
      },
      async authorize(credentials) {
        const rawToken = credentials?.token;
        if (typeof rawToken !== "string" || !rawToken) return null;

        // Захист від перебору/спаму запитів завершення входу (за самим токеном).
        const limit = await consumeRateLimit({
          namespace: "login:telegram-bot",
          identifier: rawToken,
          limit: 10,
          windowMs: 15 * 60_000,
        });
        if (!limit.allowed) return null;

        let confirmed;
        try {
          confirmed = await consumeTelegramLoginToken(rawToken);
        } catch (error) {
          if (error instanceof TelegramLoginError) return null;
          throw error;
        }

        const telegramId = confirmed.telegramId;
        const user = await prisma.user.upsert({
          where: { telegramId },
          update: { telegramUsername: confirmed.telegramUsername },
          create: {
            telegramId,
            telegramUsername: confirmed.telegramUsername,
            name:
              [confirmed.firstName, confirmed.lastName].filter(Boolean).join(" ") || `Гість ${telegramId}`,
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
