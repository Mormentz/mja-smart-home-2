import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { adminAuthConfig } from "@/admin-auth.config";
import { prisma } from "@/lib/prisma";

class NotAdminError extends CredentialsSignin {
  code = "NOT_ADMIN";
}

export const {
  handlers: adminHandlers,
  auth: adminAuth,
  signIn: adminSignIn,
  signOut: adminSignOut,
} = NextAuth({
  ...adminAuthConfig,
  trustHost: true,
  logger: {
    error(error) {
      const name = typeof error === "object" && error && "name" in error ? String(error.name) : "";
      const type = typeof error === "object" && error && "type" in error ? String(error.type) : "";
      if (name === "CredentialsSignin" || type === "CredentialsSignin") return;
      console.error("[admin-auth]", error);
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase();
        const password = String(credentials.password);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !user.active) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        if (user.role !== "ADMIN") {
          throw new NotAdminError();
        }

        // Admins skip email verification — role + credentials are enough.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          emailVerified: true,
        };
      },
    }),
  ],
});
