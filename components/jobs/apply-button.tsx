"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { applyToVacancy } from "@/lib/actions/employer";
import { Button } from "@/components/ui/button";

export function ApplyButton({ vacancyId }: { vacancyId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await applyToVacancy(vacancyId);
          if (!res.ok) toast.error(res.error);
          else toast.success("Application submitted — CV shared for this vacancy only");
        })
      }
    >
      {pending ? "Applying…" : "Apply"}
    </Button>
  );
}
