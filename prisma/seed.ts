import {
  BookingKind,
  EscrowPurpose,
  EscrowStatus,
  JobStatus,
  JobUrgency,
  KycLevel,
  LeaseStatus,
  MoveInStatus,
  PrismaClient,
  Role,
  SkillBadge,
  VerificationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_USERS, SEED_AMENITIES, SEED_NEIGHBORHOODS, SEED_PROPERTIES } from "../lib/seed-data";

const prisma = new PrismaClient();

function kycForRole(role: Role): { kycLevel: KycLevel; kycStatus: VerificationStatus } {
  if (role === "ADMIN") return { kycLevel: KycLevel.ENHANCED, kycStatus: VerificationStatus.VERIFIED };
  if (role === "AGENT") return { kycLevel: KycLevel.STANDARD, kycStatus: VerificationStatus.PENDING };
  if (role === "ARTISAN") return { kycLevel: KycLevel.ENHANCED, kycStatus: VerificationStatus.PENDING };
  return { kycLevel: KycLevel.BASIC, kycStatus: VerificationStatus.UNVERIFIED };
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Remove obsolete demo emails from old role model
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ["renter@demo.com", "buyer@demo.com", "landlord@demo.com"],
      },
    },
  });

  for (const user of DEMO_USERS) {
    const kyc = {
      kycLevel: user.kycLevel as KycLevel,
      kycStatus: user.kycStatus as VerificationStatus,
    };
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role as Role,
        passwordHash,
        active: true,
        ...kyc,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role as Role,
        passwordHash,
        active: true,
        ...kyc,
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

  for (const a of SEED_AMENITIES) {
    await prisma.amenity.upsert({
      where: { slug: a.slug },
      update: { name: a.name, active: true },
      create: { name: a.name, slug: a.slug, active: true },
    });
  }
  const amenities = await prisma.amenity.findMany();
  const amenityByName = Object.fromEntries(amenities.map((a) => [a.name, a]));

  const agent = await prisma.user.findUnique({ where: { email: "agent@demo.com" } });
  const artisan = await prisma.user.findUnique({ where: { email: "artisan@demo.com" } });
  const user = await prisma.user.findUnique({ where: { email: "user@demo.com" } });

  if (!agent || !artisan || !user) {
    throw new Error("Failed to create demo users");
  }

  for (const property of SEED_PROPERTIES) {
    const { neighborhoodSlug, verificationStatus, tourUrl, images, amenities: amenityNames, ...rest } =
      property;
    const imageList = [...(images ?? [property.image])];
    const data = {
      ...rest,
      images: imageList,
      amenities: [...amenityNames],
      ownerId: agent.id,
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

    await prisma.propertyAmenity.deleteMany({ where: { propertyId: property.id } });
    const links = amenityNames
      .map((name) => amenityByName[name])
      .filter(Boolean)
      .map((a) => ({ propertyId: property.id, amenityId: a.id }));
    if (links.length > 0) {
      await prisma.propertyAmenity.createMany({ data: links, skipDuplicates: true });
    }
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
    where: { userId_propertyId: { userId: user.id, propertyId: "verdant-heights" } },
    update: {},
    create: { userId: user.id, propertyId: "verdant-heights" },
  });
  await prisma.savedProperty.upsert({
    where: { userId_propertyId: { userId: user.id, propertyId: "riverstone-house" } },
    update: {},
    create: { userId: user.id, propertyId: "riverstone-house" },
  });

  const existingLease = await prisma.lease.findFirst({
    where: { renterId: user.id, propertyId: "atelier-loft" },
  });
  if (!existingLease) {
    const lease = await prisma.lease.create({
      data: {
        propertyId: "atelier-loft",
        renterId: user.id,
        landlordId: agent.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        monthlyRent: 1650,
        status: LeaseStatus.ACTIVE,
      },
    });
    await prisma.escrowPayment.create({
      data: {
        amount: 1650,
        status: EscrowStatus.HELD,
        purpose: EscrowPurpose.RENT,
        payerId: user.id,
        leaseId: lease.id,
        note: "First month rent held in escrow",
      },
    });
    await prisma.moveInRequest.create({
      data: {
        userId: user.id,
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
    where: { customerId: user.id, artisanId: artisan.id },
  });
  if (!existingJob) {
    const job = await prisma.serviceJob.create({
      data: {
        customerId: user.id,
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
        payerId: user.id,
        serviceJobId: job.id,
        note: "Artisan job deposit",
      },
    });
  }

  const tourCount = await prisma.booking.count({ where: { userId: user.id } });
  if (tourCount === 0) {
    await prisma.booking.create({
      data: {
        propertyId: "verdant-heights",
        userId: user.id,
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        kind: BookingKind.TOUR,
      },
    });
    await prisma.booking.create({
      data: {
        propertyId: "riverstone-house",
        userId: user.id,
        preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        kind: BookingKind.PURCHASE_INTEREST,
      },
    });
  }

  const msgCount = await prisma.message.count({
    where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
  });
  if (msgCount === 0) {
    await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId: agent.id,
        propertyId: "atelier-loft",
        content: "Hi Alex — confirming move-in date for the loft next week.",
      },
    });
    await prisma.message.create({
      data: {
        senderId: agent.id,
        recipientId: user.id,
        propertyId: "atelier-loft",
        content: "Sounds good. Lease is active and first rent is in escrow.",
      },
    });
  }

  const reviewCount = await prisma.review.count();
  if (reviewCount === 0) {
    await prisma.review.create({
      data: {
        authorId: user.id,
        targetUserId: artisan.id,
        rating: 5,
        comment: "Sam fixed the leak fast and left the place spotless.",
      },
    });
    await prisma.review.create({
      data: {
        authorId: user.id,
        propertyId: "atelier-loft",
        rating: 4,
        comment: "Great light and creative vibe. Neighbourhood index matches reality.",
      },
    });
  }

  await prisma.siteContent.upsert({
    where: { key: "about_blurb" },
    update: {
      value:
        "HomeConnect is the housing platform for verified homes, secure escrow rent, and trusted artisans.",
    },
    create: {
      key: "about_blurb",
      value:
        "HomeConnect is the housing platform for verified homes, secure escrow rent, and trusted artisans.",
    },
  });

  void kycForRole;
  console.log("Seed complete.");
  console.log(`Demo password for all accounts: ${DEMO_PASSWORD}`);
  console.log("user@demo.com | agent@demo.com | artisan@demo.com | admin@demo.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
