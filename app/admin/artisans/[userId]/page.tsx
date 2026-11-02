import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminArtisanDetail } from "@/lib/actions/admin-artisans";
import { AdminArtisanDetail } from "@/components/admin/admin-artisan-detail";

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminArtisanDetailPage({ params, searchParams }: PageProps) {
  await requireAdminSession();
  const { userId } = await params;
  const sp = (await searchParams) ?? {};
  const tab = one(sp.tab) || "profile";

  const artisan = await getAdminArtisanDetail(userId);
  if (!artisan) notFound();

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AdminArtisanDetail artisan={artisan} tab={tab} />
    </Suspense>
  );
}
