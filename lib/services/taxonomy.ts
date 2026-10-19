import { prisma } from "@/lib/prisma";
import { TAXONOMY_CATEGORIES } from "@/lib/services/taxonomy-data";

export { TAXONOMY_CATEGORIES, slugify } from "@/lib/services/taxonomy-data";

export const PRIMARY_CATEGORY_SLUGS = TAXONOMY_CATEGORIES.filter((c) => c.isPrimary).map(
  (c) => c.slug,
);

export async function listServiceCategories(opts?: { primaryOnly?: boolean }) {
  return prisma.serviceCategory.findMany({
    where: opts?.primaryOnly ? { isPrimary: true } : undefined,
    include: {
      subcategories: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.serviceCategory.findUnique({
    where: { slug },
    include: { subcategories: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function listArtisanSubcategoryIds(userId: string) {
  const rows = await prisma.artisanService.findMany({
    where: { userId },
    select: { subcategoryId: true },
  });
  return rows.map((r) => r.subcategoryId);
}
