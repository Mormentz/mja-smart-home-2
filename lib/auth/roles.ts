import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { roleLabel } from "@/lib/auth/role-labels";

export { roleLabel };

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}

export function isAdmin(role: Role) {
  return role === "ADMIN";
}

export function isAgent(role: Role) {
  return role === "AGENT";
}

export function isUser(role: Role) {
  return role === "USER";
}

export function isArtisan(role: Role) {
  return role === "ARTISAN";
}

/** Can list and manage property inventory */
export function canListProperties(role: Role) {
  return role === "AGENT";
}

/** Can rent/buy, book tours, use escrow as renter, save homes, move-in */
export function canTransactAsUser(role: Role) {
  return role === "USER";
}

/** Can request artisan services */
export function canRequestArtisan(role: Role) {
  return role === "USER" || role === "AGENT";
}

/** Owns listings / landlord-side leases */
export function canManageOwnerLeases(role: Role) {
  return role === "AGENT";
}
