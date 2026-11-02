import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminVacancyDetail } from "@/lib/actions/admin-jobs";
import { AdminVacancyDetail } from "@/components/admin/admin-vacancy-detail";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminVacancyDetailPage({ params, searchParams }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const tab = one(sp.tab) || "details";

  const vacancy = await getAdminVacancyDetail(id);
  if (!vacancy) notFound();

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AdminVacancyDetail vacancy={vacancy} tab={tab} />
    </Suspense>
  );
}
