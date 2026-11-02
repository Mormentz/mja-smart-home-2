"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatMoney } from "@/lib/currency";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Row = {
  id: string;
  amount: number;
  status: string;
  createdAt: Date | string;
  adminNote: string | null;
  user: { id: string; name: string | null; email: string };
  bankAccount: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    bankCode: string | null;
  };
};

export function AdminWithdrawalsTable({
  rows,
  decide,
}: {
  rows: Row[];
  decide: (
    id: string,
    decision: "PAID" | "REJECTED",
    adminNote?: string,
  ) => Promise<{ error?: string; success?: boolean }>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function act(id: string, decision: "PAID" | "REJECTED") {
    const note =
      decision === "REJECTED"
        ? window.prompt("Rejection note (optional)") ?? undefined
        : window.prompt("Payout reference / note (optional)") ?? undefined;
    start(async () => {
      const r = await decide(id, decision, note || undefined);
      if (r.error) toast.error(r.error);
      else {
        toast.success(decision === "PAID" ? "Marked paid" : "Rejected");
        router.refresh();
      }
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No withdrawal requests.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <ul className="divide-y divide-border/50">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 space-y-1 text-sm">
              <p className="font-medium">
                {formatMoney(r.amount)} · {r.user.name ?? r.user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {r.bankAccount.bankName} · {r.bankAccount.accountName} ·{" "}
                {r.bankAccount.accountNumber}
                {r.bankAccount.bankCode ? ` (${r.bankAccount.bankCode})` : ""}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(r.createdAt).toLocaleString()}
              </p>
              <AdminStatusBadge status={r.status} />
            </div>
            {r.status === "PENDING" && (
              <div className="flex gap-1.5">
                <Button size="sm" disabled={pending} onClick={() => act(r.id, "PAID")}>
                  Mark paid
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => act(r.id, "REJECTED")}
                >
                  Reject
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
