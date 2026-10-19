import { requireAuth } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import { EmailVerifyBanner } from "@/components/auth/email-verify-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const userId = session.user.id;

  const [pendingBookings, unreadMessages, user] = await Promise.all([
    prisma.booking.count({
      where: { property: { ownerId: userId }, status: "PENDING" },
    }),
    prisma.message.count({
      where: { recipientId: userId, readAt: null },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true, role: true },
    }),
  ]);

  const showVerify = user && !user.emailVerified;

  return (
    <DashboardLayoutClient
      role={session.user.role}
      pendingBookings={pendingBookings}
      unreadMessages={unreadMessages}
    >
      {showVerify && <EmailVerifyBanner email={user.email} />}
      {children}
    </DashboardLayoutClient>
  );
}
