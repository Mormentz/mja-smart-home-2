import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/roles";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getMyEquipmentOwner } from "@/lib/actions/equipment-rentals";
import { ListEquipmentForm } from "@/components/rentals/list-equipment-form";

export const metadata: Metadata = {
  title: "List Equipment — HomeConnect",
};

export default async function ListEquipmentPage() {
  await requireAuth();
  const owner = await getMyEquipmentOwner();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-ink text-ink-foreground">
        <Header variant="dark" />
        <div className="container-page pb-10 pt-32">
          <h1 className="font-display text-3xl font-semibold">List equipment for rent</h1>
          <p className="mt-2 text-ink-foreground/75">
            Register ownership details, pricing, and photos of the actual equipment (no stock photos as proof).
          </p>
          <Link href="/rentals" className="mt-4 inline-block text-sm text-success hover:underline">
            ← Rentals hub
          </Link>
        </div>
      </div>
      <div className="container-page py-10">
        <ListEquipmentForm
          owner={
            owner
              ? {
                  kind: owner.kind,
                  fullName: owner.fullName,
                  phone: owner.phone,
                  whatsapp: owner.whatsapp,
                  email: owner.email,
                  businessName: owner.businessName,
                  cacNumber: owner.cacNumber,
                  businessAddress: owner.businessAddress,
                  businessCategory: owner.businessCategory,
                  authorizedRepName: owner.authorizedRepName,
                  website: owner.website,
                  residentialAddress: owner.residentialAddress,
                  hasIdDocument: Boolean(owner.idDocumentUrl),
                }
              : null
          }
        />
      </div>
      <Footer />
    </div>
  );
}
