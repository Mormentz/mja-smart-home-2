"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { toast } from "sonner";

type WalletData = NonNullable<Awaited<ReturnType<typeof import("@/lib/actions/wallet").getAgentWallet>>>;

export function AgentWalletPanel({
  data,
  saveBank,
  requestWithdraw,
}: {
  data: WalletData | null;
  saveBank: (d: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    bankCode?: string;
  }) => Promise<{ error?: string; success?: boolean; code?: string; upgradeHref?: string }>;
  requestWithdraw: (
    amount: number,
    bankAccountId: string,
  ) => Promise<{ error?: string; success?: boolean; code?: string; upgradeHref?: string }>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [amount, setAmount] = useState("");
  const [bankId, setBankId] = useState(data?.banks[0]?.id ?? "");

  if (!data) {
    return <p className="text-sm text-muted-foreground">Unable to load wallet.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-border/60 bg-card p-4">
        <div>
          <p className="text-xs text-muted-foreground">Available balance</p>
          <p className="font-display text-3xl font-semibold">
            {formatMoney(data.account.availableBalance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pending withdrawal: {formatMoney(data.account.pendingWithdrawal)}
          </p>
        </div>

        <form
          className="space-y-2 border-t border-border/50 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await saveBank({
                bankName,
                accountName,
                accountNumber,
                bankCode: bankCode || undefined,
              });
              if (r.error) {
                toast.error(r.error);
                if (r.upgradeHref) router.push(r.upgradeHref);
                return;
              }
              toast.success("Bank account saved");
              setBankName("");
              setAccountName("");
              setAccountNumber("");
              router.refresh();
            });
          }}
        >
          <p className="text-sm font-medium">Add bank account</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>Bank name</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} required />
            </div>
            <div>
              <Label>Account name</Label>
              <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
            </div>
            <div>
              <Label>Account number</Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                maxLength={10}
              />
            </div>
            <div>
              <Label>Bank code (optional)</Label>
              <Input value={bankCode} onChange={(e) => setBankCode(e.target.value)} />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            Save bank details
          </Button>
        </form>

        <form
          className="space-y-2 border-t border-border/50 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await requestWithdraw(Number(amount), bankId);
              if (r.error) {
                toast.error(r.error);
                if (r.upgradeHref) router.push(r.upgradeHref);
                return;
              }
              toast.success("Withdrawal requested");
              setAmount("");
              router.refresh();
            });
          }}
        >
          <p className="text-sm font-medium">Request withdrawal</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                min={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Bank account</Label>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                required
              >
                <option value="">Select…</option>
                {data.banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} · {b.accountNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" size="sm" disabled={pending || !bankId}>
            Submit withdrawal
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="mb-2 text-sm font-medium">Ledger</p>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
            {data.ledger.length === 0 && (
              <li className="text-muted-foreground">No credits yet.</li>
            )}
            {data.ledger.map((l) => (
              <li key={l.id} className="flex justify-between gap-2 border-b border-border/40 pb-1.5">
                <span>
                  {l.type}
                  {l.note ? ` · ${l.note}` : ""}
                  <span className="block text-muted-foreground">
                    {new Date(l.createdAt).toLocaleString()}
                  </span>
                </span>
                <span className="font-medium">{formatMoney(l.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="mb-2 text-sm font-medium">Withdrawals</p>
          <ul className="space-y-2 text-xs">
            {data.withdrawals.length === 0 && (
              <li className="text-muted-foreground">No withdrawal requests.</li>
            )}
            {data.withdrawals.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {formatMoney(w.amount)} · {w.bankAccount.bankName} {w.bankAccount.accountNumber}
                </span>
                <AdminStatusBadge status={w.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
