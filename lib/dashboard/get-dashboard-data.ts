import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardStats = {
  propertyViews: number;
  tourRequests: number;
  messages: number;
  listings: number;
  propertyViewsTrend: number;
  tourRequestsTrend: number;
  messagesTrend: number;
  listingsTrend: number;
  savedHomes?: number;
  escrowHeld?: number;
  escrowReleased?: number;
  pendingVerifications?: number;
  openJobs?: number;
};

export type DashboardData = {
  role: Role;
  userName: string;
  stats: DashboardStats;
  bookingTrend: { date: string; label: string; value: number }[];
  segments: { label: string; count: number; tone: "blue" | "green" | "orange" }[];
  topProperties: {
    id: string;
    title: string;
    location: string;
    image: string;
    tours: number;
    price: number;
    rating: number;
    trend: number;
  }[];
  activeByDay: { day: string; count: number }[];
  engagementRate: number;
  pendingBookings: number;
  unreadMessages: number;
  recentBookings: {
    id: string;
    propertyTitle: string;
    status: string;
    date: string;
  }[];
  trustSummary: string;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildTrendFromBookings(bookings: { createdAt: Date }[]) {
  const days = 30;
  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    counts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const b of bookings) {
    const key = b.createdAt.toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([date, value]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value,
  }));
}

function buildActiveByDay(bookings: { preferredDate: Date }[]) {
  const counts = DAY_LABELS.map((day) => ({ day, count: 0 }));
  for (const b of bookings) {
    const day = DAY_LABELS[b.preferredDate.getDay()];
    const entry = counts.find((c) => c.day === day);
    if (entry) entry.count += 1;
  }
  return counts;
}

export async function getDashboardData(
  userId: string,
  role: Role,
  userName: string | null | undefined,
): Promise<DashboardData> {
  const isOwner = role === "LANDLORD" || role === "AGENT";
  const isArtisan = role === "ARTISAN";
  const isAdmin = role === "ADMIN";

  const [
    userBookings,
    ownerBookings,
    listingsCount,
    unreadMessages,
    pendingBookings,
    ownerProperties,
    relatedBookings,
    savedHomes,
    escrowHeldAgg,
    escrowReleasedAgg,
    pendingPropertyVerifications,
    pendingArtisanVerifications,
    openJobs,
    propertyReviews,
    renterCount,
    buyerCount,
    landlordCount,
    verifiedListings,
  ] = await Promise.all([
    prisma.booking.count({ where: { userId } }),
    prisma.booking.count({ where: { property: { ownerId: userId } } }),
    prisma.property.count({ where: { ownerId: userId } }),
    prisma.message.count({ where: { recipientId: userId, readAt: null } }),
    prisma.booking.count({
      where: isOwner
        ? { property: { ownerId: userId }, status: "PENDING" }
        : { userId, status: "PENDING" },
    }),
    prisma.property.findMany({
      where: isOwner ? { ownerId: userId } : undefined,
      take: 5,
      include: {
        bookings: true,
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: isOwner ? { property: { ownerId: userId } } : { userId },
      include: { property: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.savedProperty.count({ where: { userId } }),
    prisma.escrowPayment.aggregate({
      where: isOwner
        ? { status: "HELD", lease: { landlordId: userId } }
        : isArtisan
          ? { status: "HELD", serviceJob: { artisanId: userId } }
          : { status: "HELD", payerId: userId },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.escrowPayment.aggregate({
      where: isOwner
        ? { status: "RELEASED", lease: { landlordId: userId } }
        : isArtisan
          ? { status: "RELEASED", serviceJob: { artisanId: userId } }
          : { status: "RELEASED", payerId: userId },
      _sum: { amount: true },
    }),
    prisma.property.count({ where: { verificationStatus: "PENDING" } }),
    prisma.serviceProfile.count({ where: { verificationStatus: "PENDING" } }),
    prisma.serviceJob.count({
      where: isArtisan
        ? { artisanId: userId, status: { in: ["REQUESTED", "QUOTED", "ACCEPTED", "IN_PROGRESS"] } }
        : { customerId: userId, status: { in: ["REQUESTED", "QUOTED", "ACCEPTED", "IN_PROGRESS"] } },
    }),
    prisma.review.findMany({
      where: isOwner
        ? { property: { ownerId: userId } }
        : isArtisan
          ? { targetUserId: userId }
          : { authorId: userId },
      select: { rating: true },
    }),
    prisma.user.count({ where: { role: "RENTER" } }),
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.user.count({ where: { role: "LANDLORD" } }),
    prisma.property.count({ where: { verificationStatus: "VERIFIED" } }),
  ]);

  const tourRequests = isOwner ? ownerBookings : userBookings;
  const avgRating =
    propertyReviews.length > 0
      ? propertyReviews.reduce((s, r) => s + r.rating, 0) / propertyReviews.length
      : 0;

  const topProperties = ownerProperties.slice(0, 5).map((p, i) => {
    const tours = p.bookings.length;
    const rating =
      p.reviews.length > 0
        ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
        : avgRating || 0;
    return {
      id: p.id,
      title: p.title,
      location: p.location,
      image: p.image,
      tours,
      price: p.price,
      rating: Number(rating.toFixed(1)),
      trend: tours > 0 ? Math.min(tours * 4, 24) : i % 2 === 0 ? 2 : -1,
    };
  });

  const recentBookings = relatedBookings.slice(0, 4).map((b) => ({
    id: b.id,
    propertyTitle: b.property.title,
    status: b.status,
    date: b.preferredDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  }));

  const approved = relatedBookings.filter((b) => b.status === "APPROVED").length;
  const engagementRate =
    relatedBookings.length > 0 ? Math.round((approved / relatedBookings.length) * 100) : 0;

  const trustSummary = isAdmin
    ? `${pendingPropertyVerifications + pendingArtisanVerifications} items awaiting verification · ${verifiedListings} verified listings`
    : isOwner
      ? `${listingsCount} listings · $${escrowHeldAgg._sum.amount ?? 0} escrow held · avg rating ${avgRating.toFixed(1) || "—"}`
      : isArtisan
        ? `${openJobs} open jobs · $${escrowReleasedAgg._sum.amount ?? 0} released earnings`
        : `${savedHomes} saved homes · ${verifiedListings} verified listings on platform`;

  return {
    role,
    userName: userName ?? "User",
    stats: {
      propertyViews: isOwner
        ? listingsCount * 40 + ownerBookings * 12
        : savedHomes * 8 + userBookings * 10,
      tourRequests,
      messages: unreadMessages,
      listings: isOwner ? listingsCount : verifiedListings,
      propertyViewsTrend: tourRequests > 0 ? 8.2 : 1.1,
      tourRequestsTrend: pendingBookings > 0 ? 5.4 : 2.1,
      messagesTrend: unreadMessages > 0 ? -3.2 : 4.0,
      listingsTrend: isOwner ? 6.5 : 3.2,
      savedHomes,
      escrowHeld: escrowHeldAgg._sum.amount ?? 0,
      escrowReleased: escrowReleasedAgg._sum.amount ?? 0,
      pendingVerifications: pendingPropertyVerifications + pendingArtisanVerifications,
      openJobs,
    },
    bookingTrend: buildTrendFromBookings(relatedBookings),
    segments: [
      { label: "Renters", count: renterCount, tone: "blue" },
      { label: "Buyers", count: buyerCount, tone: "green" },
      { label: "Landlords", count: landlordCount, tone: "orange" },
    ],
    topProperties,
    activeByDay: buildActiveByDay(relatedBookings),
    engagementRate,
    pendingBookings,
    unreadMessages,
    recentBookings,
    trustSummary,
  };
}
