"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { KycLevel, Role, VerificationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email/smtp";
import {
  checkVerificationResendAllowed,
  recordVerificationResend,
} from "@/lib/auth/email-verify-rate-limit";
import {
  checkPasswordResetAllowed,
  recordPasswordResetRequest,
} from "@/lib/auth/password-reset-rate-limit";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

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
  // Send after the response so signup/login UI is not blocked on SMTP latency
  after(async () => {
    try {
      await sendVerificationEmail(email, token);
    } catch (err) {
      console.error("[email] verification send failed", err);
    }
  });
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

export type LoginPreflightResult =
  | { ok: true }
  | { ok: false; code: "INVALID" | "EMAIL_UNVERIFIED" | "ADMIN_USE_ADMIN_LOGIN" };

/** Validate credentials without creating a session — used to surface typed login errors. */
export async function preflightCredentialsLogin(
  email: string,
  password: string,
): Promise<LoginPreflightResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@") || password.length < 1) {
    return { ok: false, code: "INVALID" };
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user?.passwordHash || !user.active) {
    return { ok: false, code: "INVALID" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { ok: false, code: "INVALID" };
  }

  if (user.role === "ADMIN") {
    return { ok: false, code: "ADMIN_USE_ADMIN_LOGIN" };
  }

  if (!user.emailVerified) {
    return { ok: false, code: "EMAIL_UNVERIFIED" };
  }

  return { ok: true };
}

export async function resendVerificationEmail() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };
  if (user.emailVerified) return { success: true, alreadyVerified: true as const };

  const gate = checkVerificationResendAllowed(user.email);
  if (!gate.allowed) {
    return {
      error: `Please wait ${gate.retryAfterSeconds}s before requesting another email.`,
      retryAfterSeconds: gate.retryAfterSeconds,
      attempts: gate.attempts,
    };
  }

  await issueEmailVerification(user.id, user.email);
  const recorded = recordVerificationResend(user.email);
  return {
    success: true as const,
    retryAfterSeconds: recorded.retryAfterSeconds,
    attempts: recorded.attempts,
  };
}

/** Public resend for login gate (no session required). */
export async function resendVerificationEmailByAddress(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return { error: "Enter a valid email" };

  const gate = checkVerificationResendAllowed(normalized);
  if (!gate.allowed) {
    return {
      error: `Please wait ${gate.retryAfterSeconds}s before requesting another email.`,
      retryAfterSeconds: gate.retryAfterSeconds,
      attempts: gate.attempts,
    };
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  // Always apply cooldown to avoid enumeration + abuse, even if no user
  const recorded = recordVerificationResend(normalized);
  if (!user) {
    return {
      success: true as const,
      retryAfterSeconds: recorded.retryAfterSeconds,
      attempts: recorded.attempts,
    };
  }
  if (user.emailVerified) {
    return {
      success: true as const,
      alreadyVerified: true as const,
      retryAfterSeconds: recorded.retryAfterSeconds,
      attempts: recorded.attempts,
    };
  }

  await issueEmailVerification(user.id, user.email);
  return {
    success: true as const,
    retryAfterSeconds: recorded.retryAfterSeconds,
    attempts: recorded.attempts,
  };
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

/** Always returns a generic success message to avoid account enumeration. */
export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    return { error: "Enter a valid email" };
  }

  const gate = checkPasswordResetAllowed(normalized);
  if (!gate.allowed) {
    return {
      error: `Please wait ${gate.retryAfterSeconds}s before requesting another reset email.`,
      retryAfterSeconds: gate.retryAfterSeconds,
    };
  }

  const recorded = recordPasswordResetRequest(normalized);
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  if (user?.passwordHash && user.active) {
    const token = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });
    after(async () => {
      try {
        await sendPasswordResetEmail(user.email, token);
      } catch (err) {
        console.error("[email] password reset send failed", err);
      }
    });
  }

  return {
    success: true as const,
    retryAfterSeconds: recorded.retryAfterSeconds,
  };
}

export async function resetPassword(data: { token: string; password: string }) {
  const token = data.token.trim();
  const password = data.password;

  if (!token) return { error: "Reset link is missing or invalid" };
  if (password.length < 8) return { error: "Password must be at least 8 characters" };

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      // Owning the inbox is proof enough to clear the verify gate
      emailVerified: user.emailVerified ?? new Date(),
      emailVerifyToken: null,
    },
  });

  return {
    success: true as const,
    role: user.role,
  };
}

export async function submitKyc(data: { phone: string }) {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const phone = data.phone.trim();
  if (phone.length < 7) return { error: "Enter a valid phone number" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found" };

  // Phone-only KYC is no longer sufficient for verification.
  // Persist phone and send the user to the document Tier 1 flow.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone,
      kycNote: null,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/kyc");
  return {
    success: true,
    redirectTo: "/dashboard/kyc",
    message: "Phone saved. Complete document Tier 1 KYC to get verified.",
  };
}
