import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { getVerificationQueues } from "@/lib/actions/admin-verifications";
import { AdminStatusTabs } from "@/components/admin/admin-tabs";
import { AdminVerificationsBoard } from "@/components/admin/admin-verifications-board";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminVerificationsPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = (await searchParams) ?? {};
  const statusRaw = one(sp.status) || "pending";
  const status =
    statusRaw === "approved" || statusRaw === "rejected" ? statusRaw : "pending";

  const data = await getVerificationQueues(status);

  return (
    <DashboardSection
      title="Verifications"
      description="Review KYC, property, artisan, jobs, and rental identity queues."
    >
      <Suspense fallback={null}>
        <AdminStatusTabs counts={data.counts} />
      </Suspense>
      <AdminVerificationsBoard data={data} status={status} />
    </DashboardSection>
  );
}
