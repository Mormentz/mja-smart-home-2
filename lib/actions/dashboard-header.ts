"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export type SearchHit = {
  id: string;
  label: string;
  href: string;
  group: "Pages" | "Properties";
};

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["USER", "AGENT", "ARTISAN", "ADMIN"] },
  { href: "/dashboard/admin", label: "Admin overview", roles: ["ADMIN"] },
  { href: "/dashboard/admin/users", label: "Users", roles: ["ADMIN"] },
  { href: "/dashboard/admin/artisans", label: "Artisans", roles: ["ADMIN"] },
  { href: "/dashboard/admin/properties", label: "All properties", roles: ["ADMIN"] },
  { href: "/dashboard/admin/verifications", label: "Verifications", roles: ["ADMIN"] },
  { href: "/dashboard/admin/content", label: "Site content", roles: ["ADMIN"] },
  { href: "/dashboard/admin/amenities", label: "Amenities", roles: ["ADMIN"] },
  { href: "/dashboard/bookings", label: "Bookings", roles: ["USER", "AGENT"] },
  { href: "/dashboard/leases", label: "Leases & escrow", roles: ["USER", "AGENT"] },
  { href: "/dashboard/saved", label: "Saved homes", roles: ["USER"] },
  { href: "/dashboard/move-in", label: "Move-in", roles: ["USER"] },
  { href: "/dashboard/listings", label: "My listings", roles: ["AGENT"] },
  { href: "/dashboard/jobs", label: "Jobs", roles: ["USER", "AGENT", "ARTISAN"] },
  { href: "/properties", label: "Browse homes", roles: ["USER", "AGENT", "ARTISAN"] },
  { href: "/artisans", label: "Browse artisans", roles: ["USER", "AGENT"] },
  { href: "/dashboard/messages", label: "Messages", roles: ["USER", "AGENT", "ARTISAN", "ADMIN"] },
  { href: "/dashboard/services", label: "Services", roles: ["ARTISAN"] },
  { href: "/dashboard/settings", label: "Settings", roles: ["USER", "AGENT", "ARTISAN", "ADMIN"] },
];

export async function searchDashboard(query: string): Promise<SearchHit[]> {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) return [];

  const q = query.trim().toLowerCase();
  const role = session.user.role as Role;
  const hits: SearchHit[] = [];

  for (const item of NAV) {
    if (!item.roles.includes(role)) continue;
    if (!q || item.label.toLowerCase().includes(q) || item.href.includes(q)) {
      hits.push({ id: item.href, label: item.label, href: item.href, group: "Pages" });
    }
  }

  if (q.length >= 1) {
    const where =
      role === "AGENT"
        ? { ownerId: session.user.id, title: { contains: q, mode: "insensitive" as const } }
        : role === "ADMIN"
          ? { title: { contains: q, mode: "insensitive" as const } }
          : {
              verificationStatus: "VERIFIED" as const,
              title: { contains: q, mode: "insensitive" as const },
            };

    const props = await prisma.property.findMany({
      where,
      select: { id: true, title: true },
      take: 8,
      orderBy: { updatedAt: "desc" },
    });

    for (const p of props) {
      hits.push({
        id: `prop-${p.id}`,
        label: p.title,
        href: `/properties/${p.id}`,
        group: "Properties",
      });
    }
  }

  return hits.slice(0, 20);
}

export async function getUnreadMessageCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;
  return prisma.message.count({
    where: { recipientId: session.user.id, readAt: null },
  });
}

export async function getHeaderNotifications() {
  const session = await auth();
  if (!session?.user?.id) {
    return { unreadMessages: 0, items: [] as { id: string; title: string; href: string; meta?: string }[] };
  }

  const userId = session.user.id;
  const role = session.user.role;

  const unread = await prisma.message.findMany({
    where: { recipientId: userId, readAt: null },
    include: { sender: { select: { name: true, email: true } }, property: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const items = unread.map((m) => ({
    id: m.id,
    title: `Message from ${m.sender.name ?? m.sender.email}`,
    href: "/dashboard/messages",
    meta: m.property?.title ?? m.content.slice(0, 60),
  }));

  if (role === "AGENT") {
    const pending = await prisma.booking.count({
      where: { property: { ownerId: userId }, status: "PENDING" },
    });
    if (pending > 0) {
      items.unshift({
        id: "pending-bookings",
        title: `${pending} pending booking${pending === 1 ? "" : "s"}`,
        href: "/dashboard/bookings",
        meta: "Needs your approval",
      });
    }
  }

  if (role === "ADMIN") {
    const pendingKyc = await prisma.user.count({ where: { kycStatus: "PENDING" } });
    if (pendingKyc > 0) {
      items.unshift({
        id: "pending-kyc",
        title: `${pendingKyc} KYC review${pendingKyc === 1 ? "" : "s"}`,
        href: "/dashboard/admin/verifications",
        meta: "Awaiting decision",
      });
    }
  }

  const unreadMessages = await prisma.message.count({
    where: { recipientId: userId, readAt: null },
  });

  return { unreadMessages, items };
}
