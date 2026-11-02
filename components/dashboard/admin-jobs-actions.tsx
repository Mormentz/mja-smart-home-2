"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { decideJobSeekerIdentity } from "@/lib/actions/job-seeker";
import { decideEmployerVerification } from "@/lib/actions/employer";
import { verifyEmploymentHistory } from "@/lib/actions/job-privacy";
import { Button } from "@/components/ui/button";

export function AdminJobsActions({
  kind,
  id,
  showEmploymentVerify,
}: {
  kind: "seeker" | "employer";
  id: string;
  showEmploymentVerify?: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (kind === "seeker") await decideJobSeekerIdentity(id, true);
            else await decideEmployerVerification(id, true);
            toast.success("Approved");
          })
        }
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            if (kind === "seeker") await decideJobSeekerIdentity(id, false, "Rejected by admin");
            else await decideEmployerVerification(id, false, "Rejected by admin");
            toast.message("Rejected");
          })
        }
      >
        Reject
      </Button>
      {showEmploymentVerify && (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await verifyEmploymentHistory(id, true);
              toast.success("Employment history verified");
            })
          }
        >
          Verify employment history
        </Button>
      )}
    </div>
  );
}
