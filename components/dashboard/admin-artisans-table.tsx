"use client";

import { MoreHorizontal } from "lucide-react";
import { decideArtisanVerification } from "@/lib/actions/verification";
import { setArtisanBadge, setUserActive } from "@/lib/actions/admin";
import { formatMoneyPerHour } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableHead,
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "@/components/dashboard/dashboard-data-table";
import { toast } from "sonner";

type ArtisanRow = {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  kycStatus: string;
  serviceProfile: {
    trade: string;
    verified: boolean;
    verificationStatus: string;
    skillBadge: string;
    available: boolean;
    hourlyRate: number;
  } | null;
  reviewsReceived: { rating: number }[];
};

export function AdminArtisansTable({ artisans }: { artisans: ArtisanRow[] }) {
  async function verify(userId: string, decision: "VERIFIED" | "REJECTED") {
    const result = await decideArtisanVerification(userId, decision);
    if (result.error) toast.error(result.error);
    else toast.success(`Artisan ${decision.toLowerCase()}`);
  }

  async function badge(userId: string, value: "BRONZE" | "SILVER" | "GOLD" | "NONE") {
    const result = await setArtisanBadge(userId, value);
    if (result.error) toast.error(result.error);
    else toast.success(`Badge set to ${value}`);
  }

  async function toggle(userId: string, active: boolean) {
    const result = await setUserActive(userId, active);
    if (result.error) toast.error(result.error);
    else toast.success(active ? "Activated" : "Deactivated");
  }

  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Artisan</DashboardTableHead>
            <DashboardTableHead>Trade</DashboardTableHead>
            <DashboardTableHead>KYC</DashboardTableHead>
            <DashboardTableHead>Verification</DashboardTableHead>
            <DashboardTableHead>Badge</DashboardTableHead>
            <DashboardTableHead className="text-right">Rate</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artisans.map((a) => {
            const avg =
              a.reviewsReceived.length > 0
                ? (
                    a.reviewsReceived.reduce((s, r) => s + r.rating, 0) /
                    a.reviewsReceived.length
                  ).toFixed(1)
                : "—";
            const p = a.serviceProfile;
            return (
              <TableRow key={a.id} className="border-border/40">
                <DashboardTableCell>
                  <p className="font-medium leading-tight">{a.name ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {a.email} · {avg}★
                  </p>
                </DashboardTableCell>
                <DashboardTableCell>{p?.trade ?? "—"}</DashboardTableCell>
                <DashboardTableCell>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {a.kycStatus}
                  </span>
                </DashboardTableCell>
                <DashboardTableCell>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {p?.verificationStatus ?? "—"}
                  </span>
                </DashboardTableCell>
                <DashboardTableCell className="text-xs">
                  {p?.skillBadge ?? "—"}
                  <span className="text-muted-foreground">
                    {" · "}
                    {p?.available ? "Available" : "Busy"}
                  </span>
                </DashboardTableCell>
                <DashboardTableCell className="text-right tabular-nums text-xs">
                  {formatMoneyPerHour(p?.hourlyRate ?? 0)}
                </DashboardTableCell>
                <DashboardTableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => verify(a.id, "VERIFIED")}>
                        Approve verification
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => verify(a.id, "REJECTED")}>
                        Reject verification
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => badge(a.id, "BRONZE")}>Bronze badge</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => badge(a.id, "SILVER")}>Silver badge</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => badge(a.id, "GOLD")}>Gold badge</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggle(a.id, !a.active)}>
                        {a.active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DashboardTableCell>
              </TableRow>
            );
          })}
          {artisans.length === 0 && (
            <TableRow>
              <DashboardTableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No artisans yet.
              </DashboardTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}
