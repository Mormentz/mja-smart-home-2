import { PropertyDetailPage } from "@/components/pages/property-detail-page";
import { isPropertySaved } from "@/lib/actions/saved-properties";
import { getPropertyEngagement } from "@/lib/actions/property-engagement";
import { getProperty, getProperties, getPropertyIds } from "@/lib/properties";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export async function generateStaticParams() {
  const ids = await getPropertyIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return {
      title: "Property not found — HomeConnect",
      robots: { index: false },
    };
  }

  return {
    title: `${property.title} — HomeConnect`,
    description: property.description.slice(0, 155),
    openGraph: {
      title: `${property.title} — HomeConnect`,
      description: property.description.slice(0, 155),
    },
  };
}

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const escrowJustSecured = one(sp.escrow) === "secured";

  const [property, allProperties, saved, engagement] = await Promise.all([
    getProperty(id),
    getProperties(),
    isPropertySaved(id),
    getPropertyEngagement(id),
  ]);

  if (!property) {
    notFound();
  }

  const similar = allProperties.filter((p) => p.id !== property.id).slice(0, 3);

  return (
    <PropertyDetailPage
      property={property}
      similar={similar}
      saved={saved}
      engagement={engagement}
      escrowJustSecured={escrowJustSecured}
    />
  );
}
