import { prisma } from "@/lib/prisma";
import { TAXONOMY_CATEGORIES, slugify } from "@/lib/services/taxonomy-data";

/** Soft-map free-text ServiceProfile.trade onto nearest subcategory when possible. */
export async function softMigrateArtisanTrades() {
  const profiles = await prisma.serviceProfile.findMany({
    include: {
      user: { include: { artisanServices: true } },
    },
  });

  let linked = 0;
  for (const profile of profiles) {
    if (profile.user.artisanServices.length > 0) continue;
    const trade = profile.trade.toLowerCase();

    let categorySlug: string | null = null;
    for (const cat of TAXONOMY_CATEGORIES) {
      const tokens = [cat.slug, ...cat.name.toLowerCase().split(/\s+/)];
      if (tokens.some((t) => t.length > 3 && trade.includes(t))) {
        categorySlug = cat.slug;
        break;
      }
    }
    if (!categorySlug) continue;

    const category = await prisma.serviceCategory.findUnique({
      where: { slug: categorySlug },
      include: { subcategories: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });
    const sub = category?.subcategories[0];
    if (!sub) continue;

    await prisma.artisanService.create({
      data: { userId: profile.userId, subcategoryId: sub.id },
    });
    linked += 1;
  }

  // Touch unused slugify to keep helper available for future richer matching
  void slugify;
  return linked;
}
