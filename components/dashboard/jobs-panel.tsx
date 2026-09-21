"use client";

import { useState } from "react";
import { updateServiceJobStatus } from "@/lib/actions/service-jobs";
import { createReview } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Job = {
  id: string;
  description: string;
  status: string;
  urgency: string;
  priceEstimate: number | null;
  etaMinutes: number | null;
  artisan?: { id: string; name: string | null; email: string };
  customer?: { id: string; name: string | null; email: string };
  property?: { id: string; title: string } | null;
};

export function JobsPanel({ jobs, mode }: { jobs: Job[]; mode: "customer" | "artisan" }) {
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  async function setStatus(id: string, status: "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED") {
    const result = await updateServiceJobStatus(id, status);
    if (result.error) toast.error(result.error);
    else toast.success(`Job ${status.toLowerCase()}`);
  }

  async function submitReview(job: Job) {
    if (!job.artisan) return;
    const result = await createReview({
      rating,
      comment,
      targetUserId: job.artisan.id,
      serviceJobId: job.id,
    });
    if (result.error) toast.error(result.error);
    else {
      toast.success("Review submitted");
      setReviewFor(null);
      setComment("");
    }
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
        No service jobs yet.{" "}
        {mode === "customer" && (
          <a href="/artisans" className="text-primary underline">
            Browse artisans
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {job.urgency} · {job.status}
              </p>
              <p className="mt-1 font-semibold">{job.description}</p>
              {job.property && (
                <p className="text-sm text-muted-foreground">Property: {job.property.title}</p>
              )}
              <p className="text-sm mt-1">
                Estimate: ${job.priceEstimate ?? "—"} · ETA: {job.etaMinutes ?? "—"} min
              </p>
              {mode === "customer" && job.artisan && (
                <p className="text-sm">Artisan: {job.artisan.name ?? job.artisan.email}</p>
              )}
              {mode === "artisan" && job.customer && (
                <p className="text-sm">Client: {job.customer.name ?? job.customer.email}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {mode === "artisan" && job.status === "QUOTED" && (
                <Button size="sm" onClick={() => setStatus(job.id, "ACCEPTED")}>Accept</Button>
              )}
              {mode === "artisan" && job.status === "ACCEPTED" && (
                <Button size="sm" onClick={() => setStatus(job.id, "IN_PROGRESS")}>Start</Button>
              )}
              {mode === "artisan" && job.status === "IN_PROGRESS" && (
                <Button size="sm" onClick={() => setStatus(job.id, "COMPLETED")}>Complete</Button>
              )}
              {job.status !== "COMPLETED" && job.status !== "CANCELLED" && (
                <Button size="sm" variant="outline" onClick={() => setStatus(job.id, "CANCELLED")}>
                  Cancel
                </Button>
              )}
              {mode === "customer" && job.status === "COMPLETED" && (
                <Button size="sm" variant="secondary" onClick={() => setReviewFor(job.id)}>
                  Leave review
                </Button>
              )}
            </div>
          </div>
          {reviewFor === job.id && (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <label className="text-sm">
                Rating
                <select
                  className="ml-2 h-9 rounded-md border border-input px-2"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
              <Button size="sm" onClick={() => submitReview(job)}>Submit review</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
