"use client";

import type { Role } from "@prisma/client";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

type DashboardLayoutClientProps = {
  role: Role;
  pendingBookings: number;
  unreadMessages: number;
  children: React.ReactNode;
};

export function DashboardLayoutClient({
  role,
  pendingBookings,
  unreadMessages,
  children,
}: DashboardLayoutClientProps) {
  return (
    <DashboardShell role={role} pendingBookings={pendingBookings} unreadMessages={unreadMessages}>
      {children}
    </DashboardShell>
  );
}
