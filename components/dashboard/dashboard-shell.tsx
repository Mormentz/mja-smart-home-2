"use client";

import { useState } from "react";
import type { Role } from "@prisma/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

type DashboardShellProps = {
  role: Role;
  pendingBookings?: number;
  unreadMessages?: number;
  children: React.ReactNode;
};

export function DashboardShell({ role, pendingBookings, unreadMessages, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <DashboardSidebar
        role={role}
        pendingBookings={pendingBookings}
        unreadMessages={unreadMessages}
        className="hidden lg:flex"
      />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <DashboardSidebar
            role={role}
            pendingBookings={pendingBookings}
            unreadMessages={unreadMessages}
            className="flex h-full w-full border-0"
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMenuClick={() => setMobileOpen(true)} unreadMessages={unreadMessages} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
