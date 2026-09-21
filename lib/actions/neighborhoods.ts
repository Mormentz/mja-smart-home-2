"use server";

import { prisma } from "@/lib/prisma";

export async function getNeighborhoods() {
  return prisma.neighborhood.findMany({ orderBy: { name: "asc" } });
}

export async function getNeighborhoodBySlug(slug: string) {
  return prisma.neighborhood.findUnique({ where: { slug } });
}
