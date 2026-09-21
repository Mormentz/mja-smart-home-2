"use client";

import { decideArtisanVerification, decidePropertyVerification } from "@/lib/actions/verification";
import { Button } from "@/components/ui/button";
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

export function AdminVerificationQueue({
  properties,
  artisans,
}: {
  properties: PendingProperty[];
  artisans: PendingArtisan[];
}) {
  async function decideProperty(id: string, decision: "VERIFIED" | "REJECTED") {
    const result = await decidePropertyVerification(id, decision);
    if (result.error) toast.error(result.error);
    else toast.success(`Property ${decision.toLowerCase()}`);
  }

  async function decideArtisan(userId: string, decision: "VERIFIED" | "REJECTED") {
    const result = await decideArtisanVerification(userId, decision);
    if (result.error) toast.error(result.error);
    else toast.success(`Artisan ${decision.toLowerCase()}`);
  }

  return (
    <div className="space-y-10">
      <section>
        <h3 className="font-display text-xl font-semibold">Pending property verifications</h3>
        {properties.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No properties awaiting review.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {properties.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.location}</p>
                  <p className="text-xs text-muted-foreground">Owner: {p.owner.name ?? p.owner.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => decideProperty(p.id, "VERIFIED")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => decideProperty(p.id, "REJECTED")}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-display text-xl font-semibold">Pending artisan verifications</h3>
        {artisans.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No artisans awaiting review.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {artisans.map((a) => (
              <div key={a.userId} className="rounded-2xl border border-border p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.user.name ?? a.user.email}</p>
                  <p className="text-sm text-muted-foreground">{a.trade}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => decideArtisan(a.userId, "VERIFIED")}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => decideArtisan(a.userId, "REJECTED")}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
