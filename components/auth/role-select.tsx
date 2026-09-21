"use client";

import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/auth/role-labels";

const ROLES: Role[] = ["RENTER", "BUYER", "LANDLORD", "AGENT", "ARTISAN"];

const roleDescriptions: Record<Role, string> = {
  RENTER: "Browse rentals and book tours",
  BUYER: "Explore homes for sale",
  LANDLORD: "Manage your property listings",
  AGENT: "Represent listings and clients",
  ARTISAN: "Offer verified home services",
};

type RoleSelectProps = {
  value: Role;
  onChange: (role: Role) => void;
};

export function RoleSelect({ value, onChange }: RoleSelectProps) {
  return (
    <div className="grid gap-2">
      {ROLES.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => onChange(role)}
          className={cn(
            "rounded-2xl border px-4 py-3 text-left transition",
            value === role
              ? "border-success bg-success/10 ring-1 ring-success"
              : "border-border hover:border-success/40",
          )}
        >
          <p className="font-semibold">{roleLabel(role)}</p>
          <p className="text-sm text-muted-foreground">{roleDescriptions[role]}</p>
        </button>
      ))}
    </div>
  );
}
