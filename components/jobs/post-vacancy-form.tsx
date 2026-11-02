"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createVacancy } from "@/lib/actions/employer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PostVacancyForm({ canPublish }: { canPublish: boolean }) {
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await createVacancy({
            title: String(fd.get("title")),
            description: String(fd.get("description")),
            employmentTypes: ["FULL_TIME"],
            location: String(fd.get("location") || "") || undefined,
            publish: canPublish,
          });
          if (!res.ok) toast.error(res.error);
          else {
            toast.success(canPublish ? "Vacancy published" : "Vacancy saved pending verification");
            e.currentTarget.reset();
          }
        });
      }}
    >
      <Input name="title" placeholder="Job title" required />
      <Input name="location" placeholder="Location" />
      <Textarea name="description" placeholder="Description" required rows={3} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : canPublish ? "Publish vacancy" : "Save vacancy"}
      </Button>
    </form>
  );
}
