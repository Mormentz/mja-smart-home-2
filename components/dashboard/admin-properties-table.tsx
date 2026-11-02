"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { adminDeleteProperty, adminSetPropertyVerification } from "@/lib/actions/admin-properties";
import { setPropertyFeatured } from "@/lib/actions/admin";
import { formatMoney } from "@/lib/currency";
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
import { imageSrc as toSrc, resolveImage } from "@/lib/property-images";
import { toast } from "sonner";

type PropertyRow = {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  featured: boolean;
  verificationStatus: string;
  image: string;
  owner: { name: string | null; email: string };
  _count: { bookings: number };
};

export function AdminPropertiesTable({ properties }: { properties: PropertyRow[] }) {
  async function verify(id: string, decision: "VERIFIED" | "REJECTED") {
    const result = await adminSetPropertyVerification(id, decision);
    if (result.error) toast.error(result.error);
    else toast.success(`Property ${decision.toLowerCase()}`);
  }

  async function feature(id: string, featured: boolean) {
    const result = await setPropertyFeatured(id, featured);
    if (result.error) toast.error(result.error);
    else toast.success(featured ? "Featured" : "Unfeatured");
  }

  async function remove(id: string) {
    if (!confirm("Delete this property permanently?")) return;
    const result = await adminDeleteProperty(id);
    if (result.error) toast.error(result.error);
    else toast.success("Property deleted");
  }

  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Property</DashboardTableHead>
            <DashboardTableHead>Type</DashboardTableHead>
            <DashboardTableHead>Owner</DashboardTableHead>
            <DashboardTableHead className="text-right">Price</DashboardTableHead>
            <DashboardTableHead>Status</DashboardTableHead>
            <DashboardTableHead className="text-right">Tours</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((p) => (
            <TableRow key={p.id} className="border-border/40">
              <DashboardTableCell>
                <div className="flex items-center gap-2.5">
                  <img
                    src={toSrc(resolveImage(p.image))}
                    alt=""
                    className="h-9 w-9 rounded-md object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <Link href={`/admin/properties/${p.id}`} className="font-medium leading-tight hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {p.location}
                      {p.featured ? " · Featured" : ""}
                    </p>
                  </div>
                </div>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs uppercase text-muted-foreground">
                {p.type.replace("_", " ")}
              </DashboardTableCell>
              <DashboardTableCell className="text-xs">
                {p.owner.name ?? p.owner.email}
              </DashboardTableCell>
              <DashboardTableCell className="text-right font-medium tabular-nums text-primary">
                {formatMoney(p.price)}
              </DashboardTableCell>
              <DashboardTableCell>
                <AdminStatusBadge status={p.verificationStatus} />
              </DashboardTableCell>
              <DashboardTableCell className="text-right tabular-nums">
                {p._count.bookings}
              </DashboardTableCell>
              <DashboardTableCell className="text-right">
                <div className="inline-flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                  <Link href={`/admin/properties/${p.id}`}>Edit</Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/properties/${p.id}`}>Edit details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/properties/${p.id}`} target="_blank">View public page</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => verify(p.id, "VERIFIED")}>
                      Approve verification
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => verify(p.id, "REJECTED")}>
                      Reject verification
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => feature(p.id, !p.featured)}>
                      {p.featured ? "Unfeature" : "Feature on homepage"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => remove(p.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </div>
              </DashboardTableCell>
            </TableRow>
          ))}
          {properties.length === 0 && (
            <TableRow>
              <DashboardTableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No properties.
              </DashboardTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}
