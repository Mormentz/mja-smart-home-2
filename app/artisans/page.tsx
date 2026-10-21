import type { Metadata } from "next";
import { listArtisans } from "@/lib/actions/service-jobs";
import { listServiceCategories } from "@/lib/services/taxonomy";
import { ArtisansHubPage } from "@/components/pages/artisans-hub-page";

export const metadata: Metadata = {
  title: "Artisans Hub — HomeConnect",
  description:
    "Hire verified artisans in Abuja for home maintenance. Escrow payments, skill badges, and emergency help.",
  openGraph: {
    title: "Artisans Hub — HomeConnect",
    description:
      "Browse verified electricians, plumbers, painters, AC techs and more on HomeConnect.",
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ArtisansPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const sp = (await searchParams) ?? {};
  const category = one(sp.category);
  const subcategory = one(sp.subcategory);
  const state = one(sp.state);
  const area = one(sp.area);
  const q = one(sp.q);

  const [artisans, categories] = await Promise.all([
    listArtisans({
      categorySlug: category,
      subcategorySlug: subcategory,
      stateCode: state,
      areaName: area,
      q,
    }),
    listServiceCategories(),
  ]);

  const serialized = artisans.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    kycLevel: a.kycLevel,
    stateCode: a.stateCode,
    areaName: a.areaName,
    serviceProfile: a.serviceProfile
      ? {
          trade: a.serviceProfile.trade,
          bio: a.serviceProfile.bio,
          verified: a.serviceProfile.verified,
          skillBadge: a.serviceProfile.skillBadge,
          hourlyRate: a.serviceProfile.hourlyRate,
          available: a.serviceProfile.available,
          serviceArea: a.serviceProfile.serviceArea,
        }
      : null,
    categories: a.artisanServices.map((s) => ({
      categorySlug: s.subcategory.category.slug,
      categoryName: s.subcategory.category.name,
      subcategorySlug: s.subcategory.slug,
      subcategoryName: s.subcategory.name,
      proficiency: s.proficiency,
    })),
    reviewsReceived: a.reviewsReceived.map((r) => ({ rating: r.rating })),
  }));

  return (
    <ArtisansHubPage
      artisans={serialized}
      categories={categories.map((c) => ({
        slug: c.slug,
        name: c.name,
        isPrimary: c.isPrimary,
        subcategories: c.subcategories.map((s) => ({ slug: s.slug, name: s.name })),
      }))}
      initialFilters={{
        category: category ?? "",
        subcategory: subcategory ?? "",
        state: state ?? "",
        area: area ?? "",
        q: q ?? "",
      }}
    />
  );
}
