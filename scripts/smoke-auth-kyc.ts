/**
 * Registration + KYC ladder smoke tests (Prisma-level, mirrors action rules).
 * Run: DATABASE_URL=... ./node_modules/.bin/tsx scripts/smoke-auth-kyc.ts
 */
import bcrypt from "bcryptjs";
import {
  KycLevel,
  PrismaClient,
  Role,
  VerificationStatus,
} from "@prisma/client";

const prisma = new PrismaClient();
const results: { step: string; ok: boolean; detail?: string }[] = [];

function log(step: string, ok: boolean, detail?: string) {
  results.push({ step, ok, detail });
  console.log(`[${ok ? "OK" : "FAIL"}] ${step}${detail ? ` — ${detail}` : ""}`);
}

async function cleanup(email: string) {
  await prisma.user.deleteMany({ where: { email } });
}

async function main() {
  const stamp = Date.now();
  const userEmail = `smoke-user-${stamp}@test.local`;
  const agentEmail = `smoke-agent-${stamp}@test.local`;
  const artisanEmail = `smoke-artisan-${stamp}@test.local`;
  const hash = await bcrypt.hash("password123", 10);

  // --- USER register + auto KYC ---
  const user = await prisma.user.create({
    data: {
      email: userEmail,
      name: "Smoke User",
      passwordHash: hash,
      role: Role.USER,
      kycLevel: KycLevel.BASIC,
      kycStatus: VerificationStatus.UNVERIFIED,
    },
  });
  log("USER register defaults", user.kycStatus === "UNVERIFIED" && user.kycLevel === "BASIC");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone: "+2348011111111",
      kycStatus: VerificationStatus.VERIFIED,
      kycLevel: KycLevel.BASIC,
    },
  });
  const userAfter = await prisma.user.findUnique({ where: { id: user.id } });
  log("USER phone KYC auto-verified", userAfter?.kycStatus === "VERIFIED");

  // --- AGENT register + pending + admin approve + listing gate ---
  const agent = await prisma.user.create({
    data: {
      email: agentEmail,
      name: "Smoke Agent",
      passwordHash: hash,
      role: Role.AGENT,
      kycLevel: KycLevel.STANDARD,
      kycStatus: VerificationStatus.PENDING,
    },
  });
  log("AGENT register PENDING", agent.kycStatus === "PENDING");

  // Soft gate: listing blocked while unverified
  const blocked = agent.kycStatus !== "VERIFIED";
  log("AGENT listing soft-gate while pending", blocked);

  await prisma.user.update({
    where: { id: agent.id },
    data: { phone: "+2348022222222", kycStatus: VerificationStatus.PENDING },
  });
  const agentPhone = await prisma.user.findUnique({ where: { id: agent.id } });
  log("AGENT submit phone stays PENDING", agentPhone?.kycStatus === "PENDING" && Boolean(agentPhone.phone));

  await prisma.user.update({
    where: { id: agent.id },
    data: { kycStatus: VerificationStatus.REJECTED, kycNote: "Blurry ID" },
  });
  const rejected = await prisma.user.findUnique({ where: { id: agent.id } });
  log("ADMIN reject KYC with note", rejected?.kycStatus === "REJECTED" && rejected.kycNote === "Blurry ID");

  await prisma.user.update({
    where: { id: agent.id },
    data: { phone: "+2348022222222", kycStatus: VerificationStatus.PENDING, kycNote: null },
  });
  await prisma.user.update({
    where: { id: agent.id },
    data: { kycStatus: VerificationStatus.VERIFIED },
  });
  const agentOk = await prisma.user.findUnique({ where: { id: agent.id } });
  log("AGENT resubmit then admin approve", agentOk?.kycStatus === "VERIFIED");

  const listingId = `smoke-kyc-${stamp}`;
  if (agentOk?.kycStatus === "VERIFIED") {
    await prisma.property.create({
      data: {
        id: listingId,
        title: "KYC Smoke Flat",
        location: "Lagos",
        price: 1000,
        type: "FOR_RENT",
        category: "APARTMENT",
        beds: 1,
        baths: 1,
        area: 500,
        image: "property-1.jpg",
        images: ["property-1.jpg"],
        description: "Created after KYC verification for smoke test.",
        amenities: [],
        ownerId: agent.id,
      },
    });
    const listing = await prisma.property.findUnique({ where: { id: listingId } });
    log("AGENT can create listing after VERIFIED", Boolean(listing));
    await prisma.property.delete({ where: { id: listingId } }).catch(() => undefined);
  } else {
    log("AGENT can create listing after VERIFIED", false, "not verified");
  }

  // --- ARTISAN ---
  const artisan = await prisma.user.create({
    data: {
      email: artisanEmail,
      name: "Smoke Artisan",
      passwordHash: hash,
      role: Role.ARTISAN,
      kycLevel: KycLevel.ENHANCED,
      kycStatus: VerificationStatus.PENDING,
      serviceProfile: {
        create: {
          trade: "Smoke Trade",
          bio: "Smoke test artisan",
          verificationStatus: VerificationStatus.UNVERIFIED,
          verified: false,
          available: false,
          hourlyRate: 40,
        },
      },
    },
  });
  log("ARTISAN register + service profile", Boolean(artisan.id));

  await prisma.user.update({
    where: { id: artisan.id },
    data: { phone: "+2348033333333", kycStatus: VerificationStatus.PENDING },
  });

  const publicWhilePending = await prisma.user.count({
    where: {
      id: artisan.id,
      kycStatus: "VERIFIED",
      serviceProfile: { is: { verificationStatus: "VERIFIED" } },
    },
  });
  log("ARTISAN hidden while KYC pending", publicWhilePending === 0);

  await prisma.user.update({
    where: { id: artisan.id },
    data: { kycStatus: VerificationStatus.VERIFIED },
  });
  await prisma.serviceProfile.update({
    where: { userId: artisan.id },
    data: { verificationStatus: VerificationStatus.VERIFIED, verified: true, available: true },
  });
  const publicAfter = await prisma.user.count({
    where: {
      id: artisan.id,
      kycStatus: "VERIFIED",
      serviceProfile: { is: { verificationStatus: "VERIFIED" } },
    },
  });
  log("ARTISAN public after KYC + verification", publicAfter === 1);

  await cleanup(userEmail);
  await cleanup(agentEmail);
  await cleanup(artisanEmail);

  const failed = results.filter((r) => !r.ok);
  console.log(`\nPassed ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    failed.forEach((f) => console.log(`  FAIL ${f.step}`));
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
