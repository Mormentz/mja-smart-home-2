"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setProfileHidden, revokeCvAccess, createPrivacyRequest } from "@/lib/actions/job-privacy";
import { Button } from "@/components/ui/button";

export function PrivacyControls({
  profileHidden,
  views,
  grants,
  applications,
  documentsShared,
}: {
  profileHidden: boolean;
  views: { id: string; viewer: string; at: string }[];
  grants: { id: string; level: string; employerUserId: string; vacancyId: string | null }[];
  applications: { id: string; title: string }[];
  documentsShared: number;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border p-5">
        <h3 className="font-semibold">Who can see my profile?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {profileHidden ? "Hidden from public directory" : "Visible to verified employers (public layer only)"}
        </p>
        <Button
          className="mt-3"
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await setProfileHidden(!profileHidden);
              toast.success(profileHidden ? "Profile visible" : "Profile hidden");
            })
          }
        >
          {profileHidden ? "Unhide my profile" : "Hide my profile"}
        </Button>
      </section>

      <section className="rounded-2xl border p-5">
        <h3 className="font-semibold">Who viewed my profile</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {views.map((v) => (
            <li key={v.id}>
              {v.viewer} · {new Date(v.at).toLocaleString()}
            </li>
          ))}
          {!views.length && <li className="text-muted-foreground">No views yet</li>}
        </ul>
      </section>

      <section className="rounded-2xl border p-5">
        <h3 className="font-semibold">Employers I have applied to</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {applications.map((a) => (
            <li key={a.id}>{a.title}</li>
          ))}
          {!applications.length && <li className="text-muted-foreground">None</li>}
        </ul>
      </section>

      <section className="rounded-2xl border p-5">
        <h3 className="font-semibold">Documents I have shared ({documentsShared})</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {grants.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-2">
              <span>
                Level {g.level} · employer {g.employerUserId.slice(0, 8)}…
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await revokeCvAccess(g.id);
                    toast.success("Access revoked");
                  })
                }
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await createPrivacyRequest("CORRECTION");
              toast.success("Correction request filed");
            })
          }
        >
          Request data correction
        </Button>
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await createPrivacyRequest("DELETION");
              toast.success("Deletion request filed");
            })
          }
        >
          Request account deletion
        </Button>
      </section>
    </div>
  );
}
