import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: "hc-session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [],
  callbacks: {
    async signIn({ user, account }) {
      // Google / OAuth: mark email verified on first login
      if (account?.provider && account.provider !== "credentials" && user.email) {
        const { prisma } = await import("@/lib/prisma");
        const existing = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
        if (existing && !existing.emailVerified) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { emailVerified: new Date(), emailVerifyToken: null },
          });
        }
        if (existing?.role === "ADMIN") return false;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role ?? "USER";
        token.emailVerified = Boolean(
          (user as { emailVerified?: Date | string | null }).emailVerified,
        );
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        // App session claim (boolean); distinct from AdapterUser Date | null
        (session.user as { emailVerified?: boolean }).emailVerified = Boolean(
          token.emailVerified,
        );
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
