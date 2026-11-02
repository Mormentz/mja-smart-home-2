"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { processPrivacyDeletion } from "@/lib/actions/job-privacy";
import { Button } from "@/components/ui/button";

export function AdminPrivacyActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remove this user's sensitive job-seeker data per retention policy? This cannot be undone.")) return;
        start(async () => {
          await processPrivacyDeletion(userId);
          toast.success("Sensitive data removed per retention policy");
          router.refresh();
        });
      }}
    >
      Process deletion
    </Button>
  );
}
