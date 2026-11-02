import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminSeekerDetail } from "@/lib/actions/admin-jobs";
import { AdminSeekerDetail } from "@/components/admin/admin-seeker-detail";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminSeekerDetailPage({ params, searchParams }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const tab = one(sp.tab) || "profile";

  const seeker = await getAdminSeekerDetail(id);
  if (!seeker) notFound();

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AdminSeekerDetail seeker={seeker} tab={tab} />
    </Suspense>
  );
}
