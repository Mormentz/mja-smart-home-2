import { redirect } from "next/navigation";
import { adminAuth } from "@/admin-auth";

export async function getAdminSession() {
  return adminAuth();
}

/** Require a valid admin Auth.js session (hc-admin cookie). */
export async function requireAdminSession() {
  const session = await adminAuth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }
  return session;
}

/** Soft check for server actions — returns null when unauthorized. */
export async function getAdminSessionOrNull() {
  const session = await adminAuth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}
