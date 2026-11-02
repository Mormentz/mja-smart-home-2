"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { requestRentalBooking } from "@/lib/actions/equipment-rentals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RentalRequestForm({ listingId }: { listingId: string }) {
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-3 rounded-2xl border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await requestRentalBooking({
            listingId,
            quantity: Number(fd.get("quantity") || 1),
            startDate: String(fd.get("startDate")),
            endDate: String(fd.get("endDate")),
            pickupOrDelivery: String(fd.get("pickupOrDelivery") || "PICKUP") as "PICKUP" | "DELIVERY",
            preferredLocation: String(fd.get("preferredLocation") || "") || undefined,
            budget: Number(fd.get("budget") || 0) || undefined,
            operatorRequired: fd.get("operatorRequired") === "on",
            intendedUsage: String(fd.get("intendedUsage") || "") || undefined,
            specialRequirements: String(fd.get("specialRequirements") || "") || undefined,
          });
          if (!res.ok) toast.error(res.error);
          else toast.success(`Request sent. Estimate ₦${res.estimate.estimatedTotal.toLocaleString()}`);
        });
      }}
    >
      <h2 className="font-display text-lg font-semibold">Request rental</h2>
      <div className="space-y-2">
        <Label htmlFor="startDate">Start</Label>
        <Input id="startDate" name="startDate" type="date" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="endDate">End</Label>
        <Input id="endDate" name="endDate" type="date" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input id="quantity" name="quantity" type="number" defaultValue={1} min={1} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pickupOrDelivery">Pickup or delivery</Label>
        <select id="pickupOrDelivery" name="pickupOrDelivery" className="w-full rounded-md border px-3 py-2 text-sm">
          <option value="PICKUP">Pickup</option>
          <option value="DELIVERY">Delivery</option>
        </select>
      </div>
      <Input name="preferredLocation" placeholder="Preferred location" />
      <Input name="budget" type="number" placeholder="Budget (₦)" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="operatorRequired" /> Operator required
      </label>
      <Textarea name="intendedUsage" placeholder="Intended usage" rows={2} />
      <Textarea name="specialRequirements" placeholder="Special requirements" rows={2} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Submitting…" : "Submit rental request"}
      </Button>
    </form>
  );
}
