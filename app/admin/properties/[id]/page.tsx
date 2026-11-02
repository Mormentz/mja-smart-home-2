import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminPropertyDetail } from "@/lib/actions/admin-properties";
import { AdminPropertyDetail } from "@/components/admin/admin-property-detail";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminPropertyDetailPage({ params, searchParams }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const tab = one(sp.tab) || "listing";

  const data = await getAdminPropertyDetail(id);
  if (!data) notFound();

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AdminPropertyDetail data={data} tab={tab} />
    </Suspense>
  );
}
