import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

export const ADMIN_SESSION_COOKIE = "hc-admin.session-token";

export const adminAuthConfig = {
  basePath: "/api/admin/auth",
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: ADMIN_SESSION_COOKIE,
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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role ?? "ADMIN";
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
        (session.user as { emailVerified?: boolean }).emailVerified = Boolean(
          token.emailVerified,
        );
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
