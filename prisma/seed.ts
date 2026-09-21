import {
  BookingKind,
  EscrowPurpose,
  EscrowStatus,
  JobStatus,
  JobUrgency,
  LeaseStatus,
  MoveInStatus,
  PrismaClient,
  Role,
  SkillBadge,
  VerificationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_USERS, SEED_NEIGHBORHOODS, SEED_PROPERTIES } from "../lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role as Role,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role as Role,
        passwordHash,
      },
    });
  }

  for (const n of SEED_NEIGHBORHOODS) {
    await prisma.neighborhood.upsert({
      where: { slug: n.slug },
      update: {
        name: n.name,
        safety: n.safety,
        power: n.power,
        water: n.water,
        affordability: n.affordability,
        summary: n.summary,
      },
      create: { ...n },
    });
  }

  const neighborhoods = await prisma.neighborhood.findMany();
  const neighborhoodBySlug = Object.fromEntries(neighborhoods.map((n) => [n.slug, n.id]));

  const landlord = await prisma.user.findUnique({ where: { email: "landlord@demo.com" } });
  const agent = await prisma.user.findUnique({ where: { email: "agent@demo.com" } });
  const artisan = await prisma.user.findUnique({ where: { email: "artisan@demo.com" } });
  const renter = await prisma.user.findUnique({ where: { email: "renter@demo.com" } });
  const buyer = await prisma.user.findUnique({ where: { email: "buyer@demo.com" } });

  if (!landlord || !agent || !artisan || !renter || !buyer) {
    throw new Error("Failed to create demo users");
  }

  for (const [index, property] of SEED_PROPERTIES.entries()) {
    const ownerId = index % 2 === 0 ? landlord.id : agent.id;
    const { neighborhoodSlug, verificationStatus, tourUrl, ...rest } = property;
    const data = {
      ...rest,
      amenities: [...property.amenities],
      ownerId,
      neighborhoodId: neighborhoodBySlug[neighborhoodSlug] ?? null,
      verificationStatus: verificationStatus as VerificationStatus,
      verifiedAt: verificationStatus === "VERIFIED" ? new Date() : null,
      tourUrl,
    };
    await prisma.property.upsert({
      where: { id: property.id },
      update: data,
      create: data,
    });
  }

  await prisma.serviceProfile.upsert({
    where: { userId: artisan.id },
    update: {
      trade: "Plumbing & Electrical",
      bio: "Licensed artisan with 12 years experience across Lagos. Specializing in smart-home retrofits and emergency repairs.",
      verified: true,
      verificationStatus: VerificationStatus.VERIFIED,
      skillBadge: SkillBadge.GOLD,
      available: true,
      hourlyRate: 75,
      serviceArea: "Lagos Island & Lekki",
    },
    create: {
      userId: artisan.id,
      trade: "Plumbing & Electrical",
      bio: "Licensed artisan with 12 years experience across Lagos. Specializing in smart-home retrofits and emergency repairs.",
      verified: true,
      verificationStatus: VerificationStatus.VERIFIED,
      skillBadge: SkillBadge.GOLD,
      available: true,
      hourlyRate: 75,
      serviceArea: "Lagos Island & Lekki",
    },
  });

  await prisma.savedProperty.upsert({
    where: { userId_propertyId: { userId: renter.id, propertyId: "verdant-heights" } },
    update: {},
    create: { userId: renter.id, propertyId: "verdant-heights" },
  });
  await prisma.savedProperty.upsert({
    where: { userId_propertyId: { userId: buyer.id, propertyId: "riverstone-house" } },
    update: {},
    create: { userId: buyer.id, propertyId: "riverstone-house" },
  });

  const existingLease = await prisma.lease.findFirst({
    where: { renterId: renter.id, propertyId: "atelier-loft" },
  });
  let leaseId = existingLease?.id;
  if (!existingLease) {
    const lease = await prisma.lease.create({
      data: {
        propertyId: "atelier-loft",
        renterId: renter.id,
        landlordId: agent.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        monthlyRent: 1650,
        status: LeaseStatus.ACTIVE,
      },
    });
    leaseId = lease.id;
    await prisma.escrowPayment.create({
      data: {
        amount: 1650,
        status: EscrowStatus.HELD,
        purpose: EscrowPurpose.RENT,
        payerId: renter.id,
        leaseId: lease.id,
        note: "First month rent held in escrow",
      },
    });
    await prisma.moveInRequest.create({
      data: {
        userId: renter.id,
        propertyId: "atelier-loft",
        leaseId: lease.id,
        moving: true,
        furnishing: false,
        utilities: true,
        status: MoveInStatus.IN_PROGRESS,
        notes: "Need fibre setup and weekend movers.",
      },
    });
  }

  const existingJob = await prisma.serviceJob.findFirst({
    where: { customerId: renter.id, artisanId: artisan.id },
  });
  if (!existingJob) {
    const job = await prisma.serviceJob.create({
      data: {
        customerId: renter.id,
        artisanId: artisan.id,
        propertyId: "atelier-loft",
        description: "Kitchen sink leak and smart switch install",
        urgency: JobUrgency.NORMAL,
        status: JobStatus.QUOTED,
        priceEstimate: 225,
        etaMinutes: 120,
      },
    });
    await prisma.escrowPayment.create({
      data: {
        amount: 225,
        status: EscrowStatus.HELD,
        purpose: EscrowPurpose.ARTISAN,
        payerId: renter.id,
        serviceJobId: job.id,
        note: "Artisan job deposit",
      },
    });
  }

  const tourCount = await prisma.booking.count({ where: { userId: renter.id } });
  if (tourCount === 0) {
    await prisma.booking.create({
      data: {
        propertyId: "verdant-heights",
        userId: renter.id,
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        kind: BookingKind.TOUR,
      },
    });
    await prisma.booking.create({
      data: {
        propertyId: "riverstone-house",
        userId: buyer.id,
        preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        kind: BookingKind.PURCHASE_INTEREST,
      },
    });
  }

  const msgCount = await prisma.message.count();
  if (msgCount === 0) {
    await prisma.message.create({
      data: {
        senderId: renter.id,
        recipientId: agent.id,
        propertyId: "atelier-loft",
        content: "Hi Alex — confirming move-in date for the loft next week.",
      },
    });
    await prisma.message.create({
      data: {
        senderId: agent.id,
        recipientId: renter.id,
        propertyId: "atelier-loft",
        content: "Sounds good Ada. Lease is active and first rent is in escrow.",
      },
    });
  }

  const reviewCount = await prisma.review.count();
  if (reviewCount === 0) {
    await prisma.review.create({
      data: {
        authorId: renter.id,
        targetUserId: artisan.id,
        rating: 5,
        comment: "Sam fixed the leak fast and left the place spotless.",
      },
    });
    await prisma.review.create({
      data: {
        authorId: renter.id,
        propertyId: "atelier-loft",
        rating: 4,
        comment: "Great light and creative vibe. Neighbourhood index matches reality.",
      },
    });
  }

  void leaseId;
  console.log("Seed complete.");
  console.log(`Demo password for all accounts: ${DEMO_PASSWORD}`);
  console.log("Admin: admin@demo.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
