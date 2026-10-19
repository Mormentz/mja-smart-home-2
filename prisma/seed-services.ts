import { prisma } from "../lib/prisma";
import { TAXONOMY_CATEGORIES, slugify } from "../lib/services/taxonomy-data";

export async function seedServiceTaxonomy() {
  for (const cat of TAXONOMY_CATEGORIES) {
    const category = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      create: {
        slug: cat.slug,
        name: cat.name,
        groupName: cat.groupName,
        icon: cat.icon,
        isPrimary: cat.isPrimary,
        sortOrder: cat.sortOrder,
      },
      update: {
        name: cat.name,
        groupName: cat.groupName,
        icon: cat.icon,
        isPrimary: cat.isPrimary,
        sortOrder: cat.sortOrder,
      },
    });

    let order = 0;
    for (const subName of cat.subcategories) {
      const slug = slugify(subName);
      await prisma.serviceSubcategory.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug } },
        create: {
          categoryId: category.id,
          slug,
          name: subName,
          sortOrder: order++,
        },
        update: {
          name: subName,
          sortOrder: order - 1,
        },
      });
    }
  }

  console.log(`Seeded ${TAXONOMY_CATEGORIES.length} service categories`);
}

if (require.main === module) {
  seedServiceTaxonomy()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
