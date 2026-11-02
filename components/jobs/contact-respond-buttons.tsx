"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { respondContactRequest } from "@/lib/actions/employer";
import { Button } from "@/components/ui/button";

export function ContactRespondButtons({ requestId }: { requestId: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-2 flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await respondContactRequest(requestId, true);
            toast.success("Accepted — messaging unlocked");
          })
        }
      >
        Accept
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await respondContactRequest(requestId, false);
            toast.message("Declined");
          })
        }
      >
        Decline
      </Button>
    </div>
  );
}
