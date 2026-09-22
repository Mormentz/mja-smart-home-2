"use client";

import { decideArtisanVerification, decidePropertyVerification } from "@/lib/actions/verification";
import { decideKyc } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { toast } from "sonner";

type PendingProperty = {
  id: string;
  title: string;
  location: string;
  owner: { name: string | null; email: string };
};

type PendingArtisan = {
  userId: string;
  trade: string;
  user: { name: string | null; email: string };
};

type PendingKyc = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  kycLevel: string;
  phone: string | null;
};

export function AdminVerificationQueues({
  properties,
  artisans,
  kycUsers,
}: {
  properties: PendingProperty[];
  artisans: PendingArtisan[];
  kycUsers: PendingKyc[];
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-3">
      <QueueColumn title="KYC" empty="No KYC pending.">
        {kycUsers.map((u) => (
          <QueueItem
            key={u.id}
            title={u.name ?? u.email}
            meta={`${u.role} · ${u.kycLevel} · ${u.phone ?? "no phone"}`}
            onApprove={async () => {
              const r = await decideKyc(u.id, "VERIFIED");
              if (r.error) toast.error(r.error);
              else toast.success("KYC approved");
            }}
            onReject={async () => {
              const note = window.prompt("Rejection note (optional)") ?? undefined;
              const r = await decideKyc(u.id, "REJECTED", note || undefined);
              if (r.error) toast.error(r.error);
              else toast.success("KYC rejected");
            }}
          />
        ))}
      </QueueColumn>

      <QueueColumn title="Properties" empty="No properties pending.">
        {properties.map((p) => (
          <QueueItem
            key={p.id}
            title={p.title}
            meta={p.location}
            onApprove={async () => {
              const r = await decidePropertyVerification(p.id, "VERIFIED");
              if (r.error) toast.error(r.error);
              else toast.success("Approved");
            }}
            onReject={async () => {
              const r = await decidePropertyVerification(p.id, "REJECTED");
              if (r.error) toast.error(r.error);
              else toast.success("Rejected");
            }}
          />
        ))}
      </QueueColumn>

      <QueueColumn title="Artisans" empty="No artisans pending.">
        {artisans.map((a) => (
          <QueueItem
            key={a.userId}
            title={a.user.name ?? a.user.email}
            meta={a.trade}
            onApprove={async () => {
              const r = await decideArtisanVerification(a.userId, "VERIFIED");
              if (r.error) toast.error(r.error);
              else toast.success("Approved");
            }}
            onReject={async () => {
              const r = await decideArtisanVerification(a.userId, "REJECTED");
              if (r.error) toast.error(r.error);
              else toast.success("Rejected");
            }}
          />
        ))}
      </QueueColumn>
    </div>
  );
}

function QueueColumn({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const count = Array.isArray(children) ? children.length : children ? 1 : 0;

  return (
    <DashboardPanel title={title}>
      <div className="max-h-[420px] space-y-2 overflow-y-auto">
        {count === 0 ? (
          <p className="text-xs text-muted-foreground">{empty}</p>
        ) : (
          children
        )}
      </div>
    </DashboardPanel>
  );
}

function QueueItem({
  title,
  meta,
  onApprove,
  onReject,
}: {
  title: string;
  meta: string;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  return (
    <div className="rounded-lg border border-border/60 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight">{title}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button size="sm" className="h-7 px-2 text-xs" onClick={onApprove}>
            Approve
          </Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onReject}>
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
