import { PropertyDetailPage } from "@/components/pages/property-detail-page";
import { isPropertySaved } from "@/lib/actions/saved-properties";
import { getProperty, getProperties, getPropertyIds } from "@/lib/properties";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
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

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const [property, allProperties, saved] = await Promise.all([
    getProperty(id),
    getProperties(),
    isPropertySaved(id),
  ]);

  if (!property) {
    notFound();
  }

  const similar = allProperties.filter((p) => p.id !== property.id).slice(0, 3);

  return <PropertyDetailPage property={property} similar={similar} saved={saved} />;
}
