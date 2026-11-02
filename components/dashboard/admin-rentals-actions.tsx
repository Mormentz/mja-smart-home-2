"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { decideEquipmentListing, decideOwnerIdentity } from "@/lib/actions/equipment-rentals";
import { Button } from "@/components/ui/button";

export function AdminRentalsActions({
  listingId,
  ownerId,
}: {
  listingId?: string;
  ownerId?: string;
}) {
  const [pending, start] = useTransition();

  if (ownerId) {
    return (
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await decideOwnerIdentity(ownerId, true);
              toast.success("Owner verified");
            })
          }
        >
          Verify owner
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await decideOwnerIdentity(ownerId, false);
              toast.message("Rejected");
            })
          }
        >
          Reject
        </Button>
      </div>
    );
  }

  if (!listingId) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await decideEquipmentListing(listingId, {
              approve: true,
              ownershipReviewed: true,
              equipmentInspected: true,
              functionalityTested: false,
            });
            toast.success("Listing approved");
          })
        }
      >
        Approve (ownership reviewed)
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await decideEquipmentListing(listingId, { approve: false });
            toast.message("Rejected — e.g. stock photos / unsafe");
          })
        }
      >
        Reject
      </Button>
    </div>
  );
}
