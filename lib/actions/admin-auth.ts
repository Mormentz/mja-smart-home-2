"use server";

import { AuthError } from "next-auth";
import { adminSignIn } from "@/admin-auth";

export type AdminLoginResult =
  | { ok: true }
  | { ok: false; code: "NOT_ADMIN" | "INVALID" | "UNKNOWN" };

export async function loginAdmin(email: string, password: string): Promise<AdminLoginResult> {
  try {
    await adminSignIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      const code = (error as { code?: string }).code;
      if (code === "NOT_ADMIN") return { ok: false, code: "NOT_ADMIN" };
      return { ok: false, code: "INVALID" };
    }
    // Next.js redirect throws; treat unexpected as unknown
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    return { ok: false, code: "UNKNOWN" };
  }
}
