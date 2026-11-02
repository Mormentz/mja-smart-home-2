import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminEmployerDetail } from "@/lib/actions/admin-jobs";
import { AdminEmployerDetail } from "@/components/admin/admin-employer-detail";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminEmployerDetailPage({ params, searchParams }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const tab = one(sp.tab) || "profile";

  const employer = await getAdminEmployerDetail(id);
  if (!employer) notFound();

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AdminEmployerDetail employer={employer} tab={tab} />
    </Suspense>
  );
}
