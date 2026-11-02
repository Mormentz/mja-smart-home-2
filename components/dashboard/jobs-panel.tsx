"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { updateServiceJobStatus } from "@/lib/actions/service-jobs";
import { createReview } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DashboardDataTable,
  DashboardEmptyState,
  DashboardTableCell,
  DashboardTableHead,
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "@/components/dashboard/dashboard-data-table";
import { formatMoney } from "@/lib/currency";
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
  escrowPayments?: { id: string; amount: number; status: string; purpose: string }[];
};

export function JobsPanel({ jobs, mode }: { jobs: Job[]; mode: "customer" | "artisan" }) {
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [detail, setDetail] = useState<Job | null>(null);

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
      <DashboardEmptyState>
        No service jobs yet.{" "}
        {mode === "customer" && (
          <a href="/services" className="text-primary underline">
            Browse services
          </a>
        )}
      </DashboardEmptyState>
    );
  }

  return (
    <div className="space-y-3">
      <DashboardDataTable>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <DashboardTableHead>Job</DashboardTableHead>
              <DashboardTableHead>Counterparty</DashboardTableHead>
              <DashboardTableHead>Status</DashboardTableHead>
              <DashboardTableHead className="text-right">Estimate</DashboardTableHead>
              <DashboardTableHead className="text-right">ETA</DashboardTableHead>
              <DashboardTableHead className="text-right">Actions</DashboardTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const counterparty =
                mode === "customer"
                  ? job.artisan
                    ? (job.artisan.name ?? job.artisan.email)
                    : "—"
                  : job.customer
                    ? (job.customer.name ?? job.customer.email)
                    : "—";
              return (
                <TableRow key={job.id} className="border-border/40">
                  <DashboardTableCell>
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => setDetail(job)}
                    >
                      <p className="font-medium leading-tight line-clamp-1 hover:underline">
                        {job.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {job.urgency}
                        {job.property ? ` · ${job.property.title}` : ""}
                      </p>
                    </button>
                  </DashboardTableCell>
                  <DashboardTableCell className="text-xs">{counterparty}</DashboardTableCell>
                  <DashboardTableCell>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                      {job.status}
                    </span>
                  </DashboardTableCell>
                  <DashboardTableCell className="text-right tabular-nums text-xs">
                    {job.priceEstimate != null ? formatMoney(job.priceEstimate) : "—"}
                  </DashboardTableCell>
                  <DashboardTableCell className="text-right tabular-nums text-xs">
                    {job.etaMinutes != null ? `${job.etaMinutes}m` : "—"}
                  </DashboardTableCell>
                  <DashboardTableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDetail(job)}>
                        Details
                      </Button>
                      {mode === "artisan" && job.status === "QUOTED" && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => setStatus(job.id, "ACCEPTED")}>
                          Accept
                        </Button>
                      )}
                      {mode === "artisan" && job.status === "ACCEPTED" && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => setStatus(job.id, "IN_PROGRESS")}>
                          Start
                        </Button>
                      )}
                      {mode === "artisan" && job.status === "IN_PROGRESS" && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => setStatus(job.id, "COMPLETED")}>
                          Complete
                        </Button>
                      )}
                      {mode === "customer" && job.status === "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs"
                          onClick={() => setReviewFor(job.id)}
                        >
                          Review
                        </Button>
                      )}
                      {job.status !== "COMPLETED" && job.status !== "CANCELLED" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setStatus(job.id, "CANCELLED")}>
                              Cancel job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </DashboardTableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DashboardDataTable>

      {jobs
        .filter((j) => reviewFor === j.id)
        .map((job) => (
          <div
            key={`review-${job.id}`}
            className="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-2"
          >
            <p className="text-sm font-medium">Review: {job.description}</p>
            <label className="text-xs">
              Rating
              <select
                className="ml-2 h-8 rounded-md border border-input px-2 text-sm"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={() => submitReview(job)}>
                Submit review
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setReviewFor(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ))}

      <Sheet open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>Service job details</SheetTitle>
                <SheetDescription>Full request for {mode === "artisan" ? "you" : "your booking"}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Description</p>
                  <p className="mt-1 whitespace-pre-wrap">{detail.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium">{detail.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Urgency</p>
                    <p className="font-medium">{detail.urgency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimate</p>
                    <p className="font-medium">
                      {detail.priceEstimate != null ? formatMoney(detail.priceEstimate) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ETA</p>
                    <p className="font-medium">
                      {detail.etaMinutes != null ? `${detail.etaMinutes} minutes` : "—"}
                    </p>
                  </div>
                </div>
                {detail.property && (
                  <p>
                    Property:{" "}
                    <Link href={`/properties/${detail.property.id}`} className="text-primary underline">
                      {detail.property.title}
                    </Link>
                  </p>
                )}
                {mode === "customer" && detail.artisan && (
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Professional</p>
                    <p className="font-medium">{detail.artisan.name ?? detail.artisan.email}</p>
                    <Button size="sm" variant="link" className="h-auto px-0" asChild>
                      <Link href={`/services/${detail.artisan.id}`}>View profile</Link>
                    </Button>
                  </div>
                )}
                {mode === "artisan" && detail.customer && (
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{detail.customer.name ?? detail.customer.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Escrow</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    {(detail.escrowPayments ?? []).length === 0 && <li>No escrow hold yet</li>}
                    {(detail.escrowPayments ?? []).map((e) => (
                      <li key={e.id}>
                        {formatMoney(e.amount)} · {e.purpose} · {e.status}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
