import type { Role } from "@/generated/prisma/client";

export function roleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    USER: "User",
    AGENT: "Agent",
    ARTISAN: "Artisan",
    ADMIN: "Admin",
  };
  return labels[role];
}
