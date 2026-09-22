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
    <div className="flex h-dvh min-h-0 min-w-0 overflow-hidden bg-muted/40">
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          onMenuClick={() => setMobileOpen(true)}
          unreadMessages={unreadMessages}
          role={role}
          pendingBookings={pendingBookings}
        />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full min-w-0 max-w-[1200px] p-3 lg:p-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
