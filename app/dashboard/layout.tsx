import { requireAuth } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const userId = session.user.id;

  const [pendingBookings, unreadMessages] = await Promise.all([
    prisma.booking.count({
      where: { property: { ownerId: userId }, status: "PENDING" },
    }),
    prisma.message.count({
      where: { recipientId: userId, readAt: null },
    }),
  ]);

  return (
    <DashboardLayoutClient
      role={session.user.role}
      pendingBookings={pendingBookings}
      unreadMessages={unreadMessages}
    >
      {children}
    </DashboardLayoutClient>
  );
}
