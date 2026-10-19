"use client";

import { decideArtisanVerification, decidePropertyVerification } from "@/lib/actions/verification";
import { decideKyc } from "@/lib/actions/admin";
import { decideKycDocument } from "@/lib/actions/kyc";
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

type PendingKycDoc = {
  id: string;
  tier: number;
  type: string;
  url: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    phone: string | null;
    nin: string | null;
    kycLevel: string;
    stateCode: string | null;
    lgaName: string | null;
    areaName: string | null;
  };
};

export function AdminVerificationQueues({
  properties,
  artisans,
  kycUsers,
  kycDocuments,
}: {
  properties: PendingProperty[];
  artisans: PendingArtisan[];
  kycUsers: PendingKyc[];
  kycDocuments: PendingKycDoc[];
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-4">
      <QueueColumn title="KYC docs (Tier 1–3)" empty="No KYC documents pending.">
        {kycDocuments.map((d) => (
          <QueueItem
            key={d.id}
            title={`${d.user.name ?? d.user.email} · T${d.tier}`}
            meta={`${d.type} · ${d.user.phone ?? "no phone"} · NIN ${d.user.nin ?? "—"} · ${[d.user.areaName, d.user.lgaName, d.user.stateCode].filter(Boolean).join(", ") || "no area"}`}
            extra={
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-primary underline"
              >
                Open file
              </a>
            }
            onApprove={async () => {
              const r = await decideKycDocument(d.id, "VERIFIED");
              if (r.error) toast.error(r.error);
              else toast.success("Document approved");
            }}
            onReject={async () => {
              const note = window.prompt("Rejection note (optional)") ?? undefined;
              const r = await decideKycDocument(d.id, "REJECTED", note || undefined);
              if (r.error) toast.error(r.error);
              else toast.success("Document rejected");
            }}
          />
        ))}
      </QueueColumn>

      <QueueColumn title="KYC profiles" empty="No KYC pending.">
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
          <p className="text-sm text-muted-foreground">{empty}</p>
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
  extra,
  onApprove,
  onReject,
}: {
  title: string;
  meta: string;
  extra?: React.ReactNode;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-border/70 p-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
      {extra && <div className="mt-2">{extra}</div>}
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={() => void onApprove()}
        >
          Approve
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void onReject()}>
          Reject
        </Button>
      </div>
    </div>
  );
}
