import { requireRole } from "@/lib/auth/roles";
import { getSiteContent, listAdminProperties } from "@/lib/actions/admin";
import { AdminContentForm } from "@/components/dashboard/admin-content-form";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function AdminContentPage() {
  await requireRole(["ADMIN"]);
  const [content, properties] = await Promise.all([
    getSiteContent("about_blurb"),
    listAdminProperties(),
  ]);

  return (
    <DashboardSection title="Site content" description="Edit marketing copy and featured property flags.">
      <AdminContentForm
        aboutBlurb={
          content?.value ??
          "HomeConnect is the housing platform for verified homes, secure escrow rent, and trusted artisans."
        }
        properties={properties.map((p) => ({
          id: p.id,
          title: p.title,
          featured: p.featured,
        }))}
      />
    </DashboardSection>
  );
}
