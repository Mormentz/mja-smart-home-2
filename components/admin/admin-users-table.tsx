"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { setUserActive, setUserRole } from "@/lib/actions/admin";
import { adminDecideUserKyc } from "@/lib/actions/admin-users";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
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
  emailVerified?: Date | string | null;
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
        ? window.prompt("Rejection note (required)") ?? undefined
        : undefined;
    if (decision === "REJECTED" && !note?.trim()) {
      toast.error("Rejection note required");
      return;
    }
    const result = await adminDecideUserKyc(id, decision, note || undefined);
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
                <Link href={`/admin/users/${u.id}`} className="hover:underline">
                  <p className="font-medium leading-tight">{u.name ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                </Link>
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
                  <AdminStatusBadge status={u.kycStatus} />
                </div>
              </DashboardTableCell>
              <DashboardTableCell>
                <AdminStatusBadge status={u.active ? "ACTIVE" : "INACTIVE"} />
              </DashboardTableCell>
              <DashboardTableCell className="text-right">
                <div className="inline-flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                    <Link href={`/admin/users/${u.id}`}>Edit</Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/verifications/kyc/${u.id}`}>View KYC</Link>
                      </DropdownMenuItem>
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
                </div>
              </DashboardTableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <DashboardTableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No users found.
              </DashboardTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}
