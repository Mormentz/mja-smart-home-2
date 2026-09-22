"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import {
  decideKyc,
  setUserActive,
  setUserRole,
} from "@/lib/actions/admin";
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

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  active: boolean;
  phone: string | null;
  kycLevel: string;
  kycStatus: string;
};

export function AdminUsersTable({ users }: { users: AdminUser[] }) {
  async function toggleActive(id: string, active: boolean) {
    const result = await setUserActive(id, active);
    if (result.error) toast.error(result.error);
    else toast.success(active ? "User activated" : "User deactivated");
  }

  async function changeRole(id: string, role: "USER" | "AGENT" | "ARTISAN") {
    const result = await setUserRole(id, role);
    if (result.error) toast.error(result.error);
    else toast.success(`Role set to ${role}`);
  }

  async function kyc(id: string, decision: "VERIFIED" | "REJECTED") {
    const note =
      decision === "REJECTED"
        ? window.prompt("Rejection note (optional)") ?? undefined
        : undefined;
    const result = await decideKyc(id, decision, note || undefined);
    if (result.error) toast.error(result.error);
    else toast.success(`KYC ${decision.toLowerCase()}`);
  }

  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>User</DashboardTableHead>
            <DashboardTableHead>Phone</DashboardTableHead>
            <DashboardTableHead>Role</DashboardTableHead>
            <DashboardTableHead>KYC</DashboardTableHead>
            <DashboardTableHead>Status</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id} className="border-border/40">
              <DashboardTableCell>
                <p className="font-medium leading-tight">{u.name ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground">{u.email}</p>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs text-muted-foreground">
                {u.phone ?? "—"}
              </DashboardTableCell>
              <DashboardTableCell>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                  {u.role}
                </span>
              </DashboardTableCell>
              <DashboardTableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-muted-foreground">{u.kycLevel}</span>
                  <StatusPill status={u.kycStatus} />
                </div>
              </DashboardTableCell>
              <DashboardTableCell>
                <StatusPill status={u.active ? "ACTIVE" : "INACTIVE"} />
              </DashboardTableCell>
              <DashboardTableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => kyc(u.id, "VERIFIED")}>
                      Approve KYC
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => kyc(u.id, "REJECTED")}>
                      Reject KYC
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => changeRole(u.id, "USER")}>
                      Set role: User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeRole(u.id, "AGENT")}>
                      Set role: Agent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => changeRole(u.id, "ARTISAN")}>
                      Set role: Artisan
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleActive(u.id, !u.active)}>
                      {u.active ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DashboardTableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <DashboardTableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No users found.{" "}
                <Link href="/dashboard/admin" className="text-primary underline">
                  Back to overview
                </Link>
              </DashboardTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "VERIFIED" || status === "ACTIVE"
      ? "bg-success/20 text-success"
      : status === "PENDING"
        ? "bg-secondary/30 text-foreground"
        : status === "REJECTED" || status === "INACTIVE"
          ? "bg-destructive/15 text-destructive"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${tone}`}>
      {status}
    </span>
  );
}
