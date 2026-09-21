"use server";

import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["RENTER", "BUYER", "LANDLORD", "AGENT", "ARTISAN"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export async function registerUser(data: RegisterInput) {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: role as Role,
    },
  });

  if (role === "ARTISAN") {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (user) {
      await prisma.serviceProfile.create({
        data: {
          userId: user.id,
          trade: "General Services",
          bio: "Tell clients about your trade and experience.",
        },
      });
    }
  }

  return { success: true };
}

export async function updateProfile(data: { name: string }) {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const name = data.name.trim();
  if (name.length < 2) {
    return { error: "Name must be at least 2 characters" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  return { success: true };
}
