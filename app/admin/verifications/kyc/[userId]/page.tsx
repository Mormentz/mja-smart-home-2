import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminKycWorkspace } from "@/lib/actions/admin-verifications";
import { AdminKycWorkspace } from "@/components/admin/admin-kyc-workspace";

type PageProps = { params: Promise<{ userId: string }> };

export default async function AdminKycWorkspacePage({ params }: PageProps) {
  await requireAdminSession();
  const { userId } = await params;
  const data = await getAdminKycWorkspace(userId);
  if (!data) notFound();
  return <AdminKycWorkspace data={data} />;
}
