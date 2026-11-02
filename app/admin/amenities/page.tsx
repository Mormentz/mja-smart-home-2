import { requireAdminSession } from "@/lib/auth/admin";
import { listAllAmenities } from "@/lib/actions/amenities";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { AdminAmenitiesTable } from "@/components/dashboard/admin-amenities-table";

export default async function AdminAmenitiesPage() {
  await requireAdminSession();
  const amenities = await listAllAmenities();

  return (
    <DashboardSection
      title="Amenities"
      description="Canonical features agents can attach to listings."
    >
      <AdminAmenitiesTable amenities={amenities} />
    </DashboardSection>
  );
}
