"use client";

import { activateLeaseWithEscrow } from "@/lib/actions/leases";
import { releaseEscrow, refundEscrow } from "@/lib/actions/escrow";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type LeaseRow = {
  id: string;
  status: string;
  monthlyRent: number;
  startDate: Date;
  endDate: Date;
  property: { title: string; location: string };
  renter?: { name: string | null; email: string };
  landlord?: { name: string | null; email: string };
  escrowPayments: {
    id: string;
    amount: number;
    status: string;
    purpose: string;
  }[];
};

export function LeasesPanel({
  leases,
  mode,
}: {
  leases: LeaseRow[];
  mode: "renter" | "landlord";
}) {
  async function fund(leaseId: string) {
    const result = await activateLeaseWithEscrow(leaseId);
    if (result.error) toast.error(result.error);
    else toast.success("Escrow funded and lease activated");
  }

  async function release(id: string) {
    const result = await releaseEscrow(id);
    if (result.error) toast.error(result.error);
    else toast.success("Escrow released");
  }

  async function refund(id: string) {
    const result = await refundEscrow(id);
    if (result.error) toast.error(result.error);
    else toast.success("Escrow refunded");
  }

  if (leases.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
        No leases yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leases.map((lease) => (
        <div key={lease.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold">{lease.property.title}</h3>
              <p className="text-sm text-muted-foreground">{lease.property.location}</p>
              <p className="mt-2 text-sm">
                ${lease.monthlyRent.toLocaleString()}/mo · {lease.status}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(lease.startDate).toLocaleDateString()} → {new Date(lease.endDate).toLocaleDateString()}
              </p>
              {mode === "landlord" && lease.renter && (
                <p className="text-sm mt-1">Renter: {lease.renter.name ?? lease.renter.email}</p>
              )}
              {mode === "renter" && lease.landlord && (
                <p className="text-sm mt-1">Landlord: {lease.landlord.name ?? lease.landlord.email}</p>
              )}
            </div>
            {mode === "renter" && lease.status === "DRAFT" && (
              <Button size="sm" onClick={() => fund(lease.id)}>
                Fund escrow & activate
              </Button>
            )}
          </div>
          {lease.escrowPayments.length > 0 && (
            <div className="mt-4 border-t border-border pt-4 space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Escrow</p>
              {lease.escrowPayments.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    ${p.amount} · {p.purpose} · {p.status}
                  </span>
                  {mode === "landlord" && p.status === "HELD" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => release(p.id)}>Release</Button>
                      <Button size="sm" variant="outline" onClick={() => refund(p.id)}>Refund</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
