import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminUserActivity, getAdminUserDetail } from "@/lib/actions/admin-users";
import { AdminUserDetail } from "@/components/admin/admin-user-detail";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminUserDetailPage({ params, searchParams }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const tab = one(sp.tab) || "profile";

  const [user, activity] = await Promise.all([getAdminUserDetail(id), getAdminUserActivity(id)]);
  if (!user) notFound();

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <AdminUserDetail user={user} activity={activity} tab={tab} />
    </Suspense>
  );
}
