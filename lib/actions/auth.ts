"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { KycLevel, Role, VerificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email/smtp";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["USER", "AGENT", "ARTISAN"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;

function kycDefaults(role: "USER" | "AGENT" | "ARTISAN") {
  if (role === "AGENT") {
    return { kycLevel: KycLevel.STANDARD, kycStatus: VerificationStatus.PENDING };
  }
  // Artisans start at Tier 1 (BASIC) unverified until onboarding KYC
  if (role === "ARTISAN") {
    return { kycLevel: KycLevel.BASIC, kycStatus: VerificationStatus.UNVERIFIED };
  }
  return { kycLevel: KycLevel.BASIC, kycStatus: VerificationStatus.UNVERIFIED };
}

async function issueEmailVerification(userId: string, email: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifyToken: token },
  });
  try {
    await sendVerificationEmail(email, token);
  } catch (err) {
    console.error("[email] verification send failed", err);
  }
  return token;
}

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
  const kyc = kycDefaults(role);

  const created = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: role as Role,
      onboardingStep: role === "ARTISAN" ? 1 : 0,
      ...kyc,
    },
  });

  if (role === "ARTISAN") {
    await prisma.serviceProfile.create({
      data: {
        userId: created.id,
        trade: "General Services",
        bio: "Tell clients about your trade and experience.",
        available: false,
      },
    });
  }

  await issueEmailVerification(created.id, normalizedEmail);

  return { success: true, needsEmailVerification: true as const };
}

export async function resendVerificationEmail() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };
  if (user.emailVerified) return { success: true, alreadyVerified: true as const };

  await issueEmailVerification(user.id, user.email);
  return { success: true };
}

export async function updateProfile(data: { name: string; phone?: string }) {
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
    data: {
      name,
      phone: data.phone?.trim() || undefined,
    },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function submitKyc(data: { phone: string }) {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const phone = data.phone.trim();
  if (phone.length < 7) return { error: "Enter a valid phone number" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };

  if (user.role === "USER") {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone,
        kycLevel: KycLevel.BASIC,
        kycStatus: VerificationStatus.VERIFIED,
        kycNote: null,
      },
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone,
      kycStatus: VerificationStatus.PENDING,
      kycNote: null,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/admin/verifications");
  return { success: true };
}
