import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
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
