import type { Role } from "@prisma/client";

export function roleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    RENTER: "Renter",
    BUYER: "Buyer",
    LANDLORD: "Landlord",
    AGENT: "Agent",
    ARTISAN: "Artisan",
    ADMIN: "Admin",
  };
  return labels[role];
}
