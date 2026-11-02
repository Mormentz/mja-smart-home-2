import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // Prisma 7 requires a driver adapter. Prefer PoolConfig over an external Pool
  // instance — passing `new Pool()` breaks pg startup with this adapter version.
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 5_000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrisma() {
  const existing = globalForPrisma.prisma;
  // After `prisma generate`, a hot-reloaded Next process can keep an old client
  // missing new models (e.g. adminNotification). Recreate when that happens.
  if (existing && typeof (existing as { adminNotification?: unknown }).adminNotification === "undefined") {
    void existing.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
  }
  return globalForPrisma.prisma ?? createPrismaClient();
}

export const prisma = getPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
