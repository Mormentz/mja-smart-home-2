"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { closePrivacyRequest, resolveFlaggedAccount } from "@/lib/actions/admin-security";
import { AdminRejectDialog } from "@/components/admin/admin-reject-dialog";
import { Button } from "@/components/ui/button";

export function ResolveFlagButton({ flagId }: { flagId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(true)}>
        Resolve
      </Button>
      <AdminRejectDialog
        open={open}
        onOpenChange={setOpen}
        title="Resolve flag"
        description="Record how this flag was handled (e.g. false positive, user warned, account suspended)."
        requireNote={false}
        confirmLabel="Mark resolved"
        onConfirm={async (note) => {
          const r = await resolveFlaggedAccount(flagId, note || undefined);
          if (r.error) toast.error(r.error);
          else {
            toast.success("Flag resolved");
            router.refresh();
          }
        }}
      />
    </>
  );
}

export function ClosePrivacyRequestButton({ requestId, kind }: { requestId: string; kind: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(true)}>
        Close {kind.toLowerCase()} request
      </Button>
      <AdminRejectDialog
        open={open}
        onOpenChange={setOpen}
        title={`Close ${kind.toLowerCase()} request`}
        description="Confirm the request has been fulfilled. Add a note for the record (optional)."
        requireNote={false}
        confirmLabel="Close request"
        onConfirm={async (note) => {
          const r = await closePrivacyRequest(requestId, note || undefined);
          if (r.error) toast.error(r.error);
          else {
            toast.success("Request closed");
            router.refresh();
          }
        }}
      />
    </>
  );
}
