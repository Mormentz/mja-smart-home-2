/**
 * Role acceptance smoke — exercises data/actions paths for USER/AGENT/ARTISAN/ADMIN.
 * Run: DATABASE_URL=... ./node_modules/.bin/tsx scripts/smoke-roles.ts
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  BookingStatus,
  EscrowStatus,
  JobStatus,
  PrismaClient,
  VerificationStatus,
} from "@prisma/client";

const prisma = new PrismaClient();
const results: { role: string; step: string; ok: boolean; detail?: string }[] = [];

function log(role: string, step: string, ok: boolean, detail?: string) {
  results.push({ role, step, ok, detail });
  const mark = ok ? "OK" : "FAIL";
  console.log(`[${mark}] ${role}: ${step}${detail ? ` — ${detail}` : ""}`);
}

async function loadProperty(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: { propertyAmenities: { include: { amenity: true } } },
  });
}

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: "admin@demo.com" } });
  const agent = await prisma.user.findUnique({ where: { email: "agent@demo.com" } });
  const user = await prisma.user.findUnique({ where: { email: "user@demo.com" } });
  const artisan = await prisma.user.findUnique({
    where: { email: "artisan@demo.com" },
    include: { serviceProfile: true },
  });
  if (!admin || !agent || !user || !artisan) throw new Error("Demo users missing — reseed");

  // --- ADMIN ---
  log("ADMIN", "demo account exists", admin.role === "ADMIN" && admin.kycStatus === "VERIFIED");

  // Reject then re-approve agent KYC
  await prisma.user.update({
    where: { id: agent.id },
    data: { kycStatus: VerificationStatus.REJECTED },
  });
  let a = await prisma.user.findUnique({ where: { id: agent.id } });
  log("ADMIN", "reject agent KYC", a?.kycStatus === "REJECTED");
  await prisma.user.update({
    where: { id: agent.id },
    data: { kycStatus: VerificationStatus.VERIFIED },
  });
  a = await prisma.user.findUnique({ where: { id: agent.id } });
  log("ADMIN", "re-approve agent KYC", a?.kycStatus === "VERIFIED");

  // Artisan verification reject/approve
  await prisma.serviceProfile.update({
    where: { userId: artisan.id },
    data: { verificationStatus: VerificationStatus.REJECTED, verified: false },
  });
  await prisma.user.update({
    where: { id: artisan.id },
    data: { kycStatus: VerificationStatus.REJECTED },
  });
  await prisma.serviceProfile.update({
    where: { userId: artisan.id },
    data: { verificationStatus: VerificationStatus.VERIFIED, verified: true },
  });
  await prisma.user.update({
    where: { id: artisan.id },
    data: { kycStatus: VerificationStatus.VERIFIED },
  });
  const art = await prisma.serviceProfile.findUnique({ where: { userId: artisan.id } });
  log("ADMIN", "artisan verify after reject/re-approve", art?.verificationStatus === "VERIFIED");

  // Amenities CRUD
  const amenity = await prisma.amenity.create({
    data: { name: `Smoke Amenity ${Date.now()}`, slug: `smoke-amenity-${Date.now()}`, active: true },
  });
  await prisma.amenity.update({
    where: { id: amenity.id },
    data: { name: `${amenity.name} Renamed` },
  });
  await prisma.amenity.update({ where: { id: amenity.id }, data: { active: false } });
  const deactivated = await prisma.amenity.findUnique({ where: { id: amenity.id } });
  log("ADMIN", "amenities create/rename/deactivate", deactivated?.active === false);
  await prisma.amenity.delete({ where: { id: amenity.id } });

  // Property verify pending brownstone
  await prisma.property.update({
    where: { id: "brownstone-classic" },
    data: { verificationStatus: VerificationStatus.REJECTED },
  });
  await prisma.property.update({
    where: { id: "brownstone-classic" },
    data: { verificationStatus: VerificationStatus.VERIFIED, verifiedAt: new Date(), featured: true },
  });
  const brown = await prisma.property.findUnique({ where: { id: "brownstone-classic" } });
  log("ADMIN", "property reject then approve + feature", brown?.verificationStatus === "VERIFIED" && brown.featured);

  // --- AGENT ---
  log("AGENT", "kyc verified for listing", agent.kycStatus === "VERIFIED" || a?.kycStatus === "VERIFIED");

  const listingId = `smoke-listing-${Date.now()}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "properties", listingId);
  await mkdir(uploadDir, { recursive: true });
  // minimal 1x1 png
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const img1 = `/uploads/properties/${listingId}/cover.png`;
  const img2 = `/uploads/properties/${listingId}/two.png`;
  await writeFile(path.join(uploadDir, "cover.png"), png);
  await writeFile(path.join(uploadDir, "two.png"), png);

  const gym = await prisma.amenity.findFirst({ where: { slug: "gym" } });
  const parking = await prisma.amenity.findFirst({ where: { slug: "parking" } });
  await prisma.property.create({
    data: {
      id: listingId,
      title: "Smoke Test Flat",
      location: "Lekki, Lagos",
      price: 999,
      type: "FOR_RENT",
      category: "APARTMENT",
      beds: 2,
      baths: 1,
      area: 800,
      image: img1,
      images: [img1, img2],
      description: "Smoke-test listing with uploaded images and amenities.",
      amenities: [],
      ownerId: agent.id,
      verificationStatus: VerificationStatus.PENDING,
    },
  });
  if (gym && parking) {
    await prisma.propertyAmenity.createMany({
      data: [
        { propertyId: listingId, amenityId: gym.id },
        { propertyId: listingId, amenityId: parking.id },
      ],
    });
    await prisma.property.update({
      where: { id: listingId },
      data: { amenities: [gym.name, parking.name] },
    });
  }
  const created = await loadProperty(listingId);
  const amenityNames =
    created?.propertyAmenities.map((pa) => pa.amenity.name) ?? created?.amenities ?? [];
  log(
    "AGENT",
    "create listing with 2 images + amenities",
    Boolean(created && created.images.length >= 2 && amenityNames.includes("Gym")),
    created
      ? `images=${created.images.length} amenities=${amenityNames.join(",")}`
      : "missing",
  );

  // Booking approve/decline on owned property
  const booking = await prisma.booking.create({
    data: {
      propertyId: "verdant-heights",
      userId: user.id,
      preferredDate: new Date(Date.now() + 7 * 86400000),
      kind: "TOUR",
      status: BookingStatus.PENDING,
    },
  });
  await prisma.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.CANCELLED } });
  const declined = await prisma.booking.findUnique({ where: { id: booking.id } });
  log("AGENT", "decline booking", declined?.status === "CANCELLED");
  await prisma.booking.update({ where: { id: booking.id }, data: { status: BookingStatus.APPROVED } });
  const approved = await prisma.booking.findUnique({ where: { id: booking.id } });
  log("AGENT", "approve booking", approved?.status === "APPROVED");

  // Escrow release (landlord)
  const held = await prisma.escrowPayment.findFirst({
    where: { status: EscrowStatus.HELD, lease: { landlordId: agent.id } },
  });
  if (held) {
    await prisma.escrowPayment.update({
      where: { id: held.id },
      data: { status: EscrowStatus.RELEASED },
    });
    const released = await prisma.escrowPayment.findUnique({ where: { id: held.id } });
    log("AGENT", "release rent escrow", released?.status === "RELEASED");
    // restore for demo
    await prisma.escrowPayment.update({
      where: { id: held.id },
      data: { status: EscrowStatus.HELD },
    });
  } else {
    log("AGENT", "release rent escrow", false, "no held lease escrow found");
  }

  // --- USER ---
  const props = await prisma.property.findMany({
    where: { verificationStatus: "VERIFIED" },
  });
  const river = await loadProperty("riverstone-house");
  const riverAmenities =
    river?.propertyAmenities.map((pa) => pa.amenity.name) ?? river?.amenities ?? [];
  log(
    "USER",
    "browse verified properties + gallery/amenities",
    props.length > 0 && Boolean(river && river.images.length >= 1 && riverAmenities.length > 0),
    `verified=${props.length} river images=${river?.images.length}`,
  );

  await prisma.savedProperty.upsert({
    where: { userId_propertyId: { userId: user.id, propertyId: "skyline-penthouse" } },
    update: {},
    create: { userId: user.id, propertyId: "skyline-penthouse" },
  });
  const saved = await prisma.savedProperty.findUnique({
    where: { userId_propertyId: { userId: user.id, propertyId: "skyline-penthouse" } },
  });
  log("USER", "save home", Boolean(saved));

  const tour = await prisma.booking.create({
    data: {
      propertyId: "skyline-penthouse",
      userId: user.id,
      preferredDate: new Date(Date.now() + 4 * 86400000),
      kind: "TOUR",
    },
  });
  log("USER", "book tour", Boolean(tour.id));

  const lease = await prisma.lease.findFirst({ where: { renterId: user.id } });
  const moveIn = await prisma.moveInRequest.findFirst({ where: { userId: user.id } });
  log("USER", "lease + move-in present", Boolean(lease && moveIn));

  const msg = await prisma.message.findFirst({
    where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
  });
  log("USER", "message thread", Boolean(msg));

  await prisma.user.update({
    where: { id: user.id },
    data: { phone: "+2348000000000", kycStatus: VerificationStatus.VERIFIED, kycLevel: "BASIC" },
  });
  const u = await prisma.user.findUnique({ where: { id: user.id } });
  log("USER", "basic KYC / phone", u?.kycStatus === "VERIFIED" && Boolean(u.phone));

  // --- ARTISAN ---
  const job = await prisma.serviceJob.findFirst({
    where: { artisanId: artisan.id, status: JobStatus.QUOTED },
  });
  if (job) {
    await prisma.serviceJob.update({ where: { id: job.id }, data: { status: JobStatus.ACCEPTED } });
    await prisma.serviceJob.update({ where: { id: job.id }, data: { status: JobStatus.IN_PROGRESS } });
    await prisma.serviceJob.update({ where: { id: job.id }, data: { status: JobStatus.COMPLETED } });
    const done = await prisma.serviceJob.findUnique({ where: { id: job.id } });
    log("ARTISAN", "accept → start → complete job", done?.status === "COMPLETED");
    // reset to QUOTED for demo reuse
    await prisma.serviceJob.update({ where: { id: job.id }, data: { status: JobStatus.QUOTED } });
  } else {
    log("ARTISAN", "accept → start → complete job", false, "no quoted job");
  }

  const publicArtisans = await prisma.user.findMany({
    where: {
      role: "ARTISAN",
      active: true,
      kycStatus: "VERIFIED",
      serviceProfile: { is: { verificationStatus: "VERIFIED" } },
    },
  });
  log("ARTISAN", "appears in public directory when verified", publicArtisans.some((x) => x.id === artisan.id));

  // Soft gate: unverified artisan hidden
  await prisma.user.update({
    where: { id: artisan.id },
    data: { kycStatus: VerificationStatus.PENDING },
  });
  const hidden = await prisma.user.findMany({
    where: {
      role: "ARTISAN",
      kycStatus: "VERIFIED",
      serviceProfile: { is: { verificationStatus: "VERIFIED" } },
    },
  });
  log("ARTISAN", "hidden when KYC pending", !hidden.some((x) => x.id === artisan.id));
  await prisma.user.update({
    where: { id: artisan.id },
    data: { kycStatus: VerificationStatus.VERIFIED },
  });

  // Cleanup smoke listing
  await prisma.propertyAmenity.deleteMany({ where: { propertyId: listingId } });
  await prisma.property.delete({ where: { id: listingId } });

  const failed = results.filter((r) => !r.ok);
  console.log("\n--- Summary ---");
  console.log(`Passed ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    failed.forEach((f) => console.log(`  FAIL ${f.role}: ${f.step} ${f.detail ?? ""}`));
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
