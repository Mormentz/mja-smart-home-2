import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PropertyDetailPage } from "@/components/pages/property-detail-page";
import { getProperty, properties } from "@/lib/properties";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return properties.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = getProperty(id);

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
  const property = getProperty(id);

  if (!property) {
    notFound();
  }

  return <PropertyDetailPage property={property} />;
}
