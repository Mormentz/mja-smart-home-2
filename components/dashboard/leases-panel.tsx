"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { activateLeaseWithEscrow } from "@/lib/actions/leases";
import {
  confirmEscrowReceived,
  markEscrowHandedOver,
  refundEscrow,
} from "@/lib/actions/escrow";
import { formatMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { imageSrc, resolveImage } from "@/lib/property-images";
import { toast } from "sonner";

type EscrowRow = {
  id: string;
  amount: number;
  status: string;
  purpose: string;
  agentHandedOverAt?: Date | string | null;
  customerReceivedAt?: Date | string | null;
};

type LeaseRow = {
  id: string;
  status: string;
  monthlyRent: number;
  startDate: Date;
  endDate: Date;
  property: { id: string; title: string; location: string; image: string };
  renter?: { id?: string; name: string | null; email: string };
  landlord?: { id?: string; name: string | null; email: string };
  escrowPayments: EscrowRow[];
};

export function LeasesPanel({
  leases,
  mode,
}: {
  leases: LeaseRow[];
  mode: "renter" | "landlord";
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<LeaseRow | null>(null);

  async function fund(leaseId: string) {
    const result = await activateLeaseWithEscrow(leaseId);
    if ("error" in result && result.error) {
      toast.error(result.error);
      if ("upgradeHref" in result && result.upgradeHref) {
        router.push(String(result.upgradeHref));
      }
      return;
    }
    if ("authorizationUrl" in result && result.authorizationUrl) {
      toast.message("Redirecting to Paystack…");
      window.location.assign(result.authorizationUrl);
      return;
    }
    toast.success("Escrow checkout started");
  }

  async function agentHandOver(id: string) {
    const result = await markEscrowHandedOver(id);
    if (result.error) {
      toast.error(result.error);
      if ("upgradeHref" in result && result.upgradeHref) {
        router.push(String(result.upgradeHref));
      }
      return;
    }
    toast.success(
      "released" in result && result.released
        ? "Both parties confirmed — funds credited to your wallet"
        : "Handover marked — waiting for customer confirmation",
    );
    router.refresh();
  }

  async function customerConfirm(id: string) {
    const result = await confirmEscrowReceived(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      "released" in result && result.released
        ? "Confirmed — rent escrow released to the agent wallet"
        : "Receipt confirmed — waiting for agent handover mark",
    );
    router.refresh();
  }

  async function refund(id: string) {
    const result = await refundEscrow(id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Escrow refunded");
      router.refresh();
    }
  }

  if (leases.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
        No leases yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {leases.map((lease) => {
          const party =
            mode === "landlord"
              ? lease.renter
                ? (lease.renter.name ?? lease.renter.email)
                : "—"
              : lease.landlord
                ? (lease.landlord.name ?? lease.landlord.email)
                : "—";
          const held = lease.escrowPayments.filter((p) => p.status === "HELD" && p.purpose === "RENT");
          return (
            <article
              key={lease.id}
              className="flex overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc(resolveImage(lease.property.image))}
                alt=""
                className="hidden w-36 shrink-0 object-cover sm:block"
              />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display font-semibold leading-tight">{lease.property.title}</p>
                    <p className="text-xs text-muted-foreground">{lease.property.location}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {lease.status}
                  </span>
                </div>
                <p className="text-sm">
                  {formatMoney(lease.monthlyRent)} / mo · {party}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(lease.startDate).toLocaleDateString()} →{" "}
                  {new Date(lease.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs">
                  Escrow:{" "}
                  {lease.escrowPayments.length === 0
                    ? "None"
                    : lease.escrowPayments
                        .map((e) => `${formatMoney(e.amount)} (${e.status})`)
                        .join(", ")}
                </p>
                {held.map((e) => (
                  <div key={e.id} className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2 text-[11px]">
                    <p className="font-medium">Handover pipeline</p>
                    <p>
                      Agent: {e.agentHandedOverAt ? "✓ Handed over" : "Waiting"} · Customer:{" "}
                      {e.customerReceivedAt ? "✓ Received" : "Waiting"}
                    </p>
                  </div>
                ))}
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setSelected(lease)}>
                    Details
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 text-xs" asChild>
                    <Link href={`/properties/${lease.property.id}`}>View property</Link>
                  </Button>
                  {mode === "renter" &&
                    lease.status === "DRAFT" &&
                    !lease.escrowPayments.some((p) => p.status === "HELD") && (
                      <Button size="sm" className="h-8 text-xs" onClick={() => fund(lease.id)}>
                        {lease.escrowPayments.some((p) => p.status === "PENDING")
                          ? "Continue Paystack"
                          : "Fund escrow"}
                      </Button>
                    )}
                  {mode === "renter" &&
                    held
                      .filter((e) => !e.customerReceivedAt)
                      .map((e) => (
                        <Button
                          key={e.id}
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => customerConfirm(e.id)}
                        >
                          Confirm I received the house
                        </Button>
                      ))}
                  {mode === "landlord" &&
                    held.map((e) => (
                      <span key={e.id} className="inline-flex flex-wrap gap-1">
                        {!e.agentHandedOverAt && (
                          <Button size="sm" className="h-8 text-xs" onClick={() => agentHandOver(e.id)}>
                            Mark handed over
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => refund(e.id)}>
                          Refund
                        </Button>
                      </span>
                    ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.property.title}</SheetTitle>
                <SheetDescription>Lease & escrow details</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc(resolveImage(selected.property.image))}
                  alt=""
                  className="aspect-video w-full rounded-xl object-cover"
                />
                <p>Status: {selected.status}</p>
                <p>Rent: {formatMoney(selected.monthlyRent)} / month</p>
                <p>
                  Period: {new Date(selected.startDate).toLocaleDateString()} →{" "}
                  {new Date(selected.endDate).toLocaleDateString()}
                </p>
                <div>
                  <p className="font-medium">Escrow payments</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {selected.escrowPayments.length === 0 && <li>None yet</li>}
                    {selected.escrowPayments.map((e) => (
                      <li key={e.id}>
                        {formatMoney(e.amount)} · {e.purpose} · {e.status}
                        {e.purpose === "RENT" && (
                          <span className="block text-[11px]">
                            Agent {e.agentHandedOverAt ? "✓" : "○"} · Customer{" "}
                            {e.customerReceivedAt ? "✓" : "○"}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button asChild>
                  <Link href={`/properties/${selected.property.id}`}>Open property</Link>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
