"use client";

import { useState } from "react";
import { createAmenity, updateAmenity } from "@/lib/actions/amenities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type AmenityRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

export function AdminAmenitiesTable({ amenities }: { amenities: AmenityRow[] }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    setLoading(true);
    const result = await createAmenity(name);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Amenity created");
      setName("");
    }
  }

  async function rename(id: string, current: string) {
    const next = prompt("Rename amenity", current);
    if (!next || next.trim() === current) return;
    const result = await updateAmenity(id, { name: next });
    if (result.error) toast.error(result.error);
    else toast.success("Renamed");
  }

  async function toggle(id: string, active: boolean) {
    const result = await updateAmenity(id, { active });
    if (result.error) toast.error(result.error);
    else toast.success(active ? "Activated" : "Deactivated");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs h-9"
          placeholder="New amenity name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button size="sm" onClick={add} disabled={loading || name.trim().length < 2}>
          {loading ? "Adding…" : "Add amenity"}
        </Button>
      </div>

      <DashboardDataTable>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <DashboardTableHead>Name</DashboardTableHead>
              <DashboardTableHead>Slug</DashboardTableHead>
              <DashboardTableHead>Status</DashboardTableHead>
              <DashboardTableHead className="text-right">Actions</DashboardTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {amenities.map((a) => (
              <TableRow key={a.id} className="border-border/40">
                <DashboardTableCell className="font-medium">{a.name}</DashboardTableCell>
                <DashboardTableCell className="text-xs text-muted-foreground">{a.slug}</DashboardTableCell>
                <DashboardTableCell>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      a.active ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {a.active ? "Active" : "Inactive"}
                  </span>
                </DashboardTableCell>
                <DashboardTableCell className="text-right">
                  <div className="inline-flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => rename(a.id, a.name)}>
                      Rename
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => toggle(a.id, !a.active)}
                    >
                      {a.active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </DashboardTableCell>
              </TableRow>
            ))}
            {amenities.length === 0 && (
              <TableRow>
                <DashboardTableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No amenities yet.
                </DashboardTableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DashboardDataTable>
    </div>
  );
}
