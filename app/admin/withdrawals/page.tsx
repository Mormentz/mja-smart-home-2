import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { decideWithdrawal, listAdminWithdrawals } from "@/lib/actions/wallet";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminWithdrawalsTable } from "@/components/admin/admin-withdrawals-table";
import { formatMoney } from "@/lib/currency";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminWithdrawalsPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = (await searchParams) ?? {};
  const status = one(sp.status);
  const rows = await listAdminWithdrawals(status);
  const pendingTotal = rows
    .filter((r) => r.status === "PENDING")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <DashboardSection
      title="Withdrawals"
      description={`Review agent payout requests. Pending total: ${formatMoney(pendingTotal)}.`}
    >
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminFilterBar
            hideSearch
            chipParam="status"
            chips={[
              { id: "PENDING", label: "Pending" },
              { id: "PAID", label: "Paid" },
              { id: "REJECTED", label: "Rejected" },
            ]}
          />
        </Suspense>
      </div>
      <AdminWithdrawalsTable rows={rows} decide={decideWithdrawal} />
    </DashboardSection>
  );
}
