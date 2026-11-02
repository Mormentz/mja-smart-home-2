import { requireAdminSession } from "@/lib/auth/admin";
import { getSiteContentMap, listAdminProperties } from "@/lib/actions/admin";
import { SITE_CONTENT_FIELDS } from "@/lib/admin/content-keys";
import { AdminContentForm } from "@/components/dashboard/admin-content-form";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function AdminContentPage() {
  await requireAdminSession();
  const [values, properties] = await Promise.all([
    getSiteContentMap(SITE_CONTENT_FIELDS.map((f) => f.key)),
    listAdminProperties(),
  ]);

  return (
    <DashboardSection
      title="Site content"
      description="Edit marketing copy, support contacts, announcements, and featured property flags."
    >
      <AdminContentForm
        values={values}
        properties={properties.map((p) => ({
          id: p.id,
          title: p.title,
          featured: p.featured,
        }))}
      />
    </DashboardSection>
  );
}
