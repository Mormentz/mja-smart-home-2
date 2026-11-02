"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { resolveAdminJobFlag } from "@/lib/actions/admin-jobs";
import { Button } from "@/components/ui/button";

export function AdminJobFlagActions({ flagId, resolved }: { flagId: string; resolved: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 text-xs"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await resolveAdminJobFlag(flagId, !resolved);
          if (r.error) toast.error(r.error);
          else {
            toast.success(resolved ? "Flag reopened" : "Flag resolved");
            router.refresh();
          }
        })
      }
    >
      {resolved ? "Reopen" : "Resolve"}
    </Button>
  );
}
