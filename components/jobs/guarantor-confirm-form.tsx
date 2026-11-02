"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { confirmGuarantorInvite } from "@/lib/actions/job-privacy";
import { Button } from "@/components/ui/button";

export function GuarantorConfirmForm({ token }: { token: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="max-w-md space-y-4 rounded-2xl border p-6">
      <p className="text-sm text-muted-foreground">
        Independently confirm your identity and relationship with the applicant. This displays as “Reference
        Confirmed” only — your personal details stay private from employers by default.
      </p>
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await confirmGuarantorInvite(token, true);
            if (!res.ok) toast.error(res.error);
            else toast.success("Reference confirmed");
          })
        }
      >
        {pending ? "Confirming…" : "Confirm reference"}
      </Button>
    </div>
  );
}
