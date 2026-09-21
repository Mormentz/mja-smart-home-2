import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_USERS, SEED_PROPERTIES } from "../lib/seed-data";

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

  const landlord = await prisma.user.findUnique({ where: { email: "landlord@demo.com" } });
  const agent = await prisma.user.findUnique({ where: { email: "agent@demo.com" } });
  const artisan = await prisma.user.findUnique({ where: { email: "artisan@demo.com" } });

  if (!landlord || !agent || !artisan) {
    throw new Error("Failed to create demo users");
  }

  for (const [index, property] of SEED_PROPERTIES.entries()) {
    const ownerId = index % 2 === 0 ? landlord.id : agent.id;
    const data = {
      ...property,
      amenities: [...property.amenities],
      ownerId,
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
    },
    create: {
      userId: artisan.id,
      trade: "Plumbing & Electrical",
      bio: "Licensed artisan with 12 years experience across Lagos. Specializing in smart-home retrofits and emergency repairs.",
      verified: true,
    },
  });

  console.log("Seed complete.");
  console.log(`Demo password for all accounts: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
