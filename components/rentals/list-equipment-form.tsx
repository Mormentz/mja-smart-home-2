"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  saveEquipmentOwner,
  createEquipmentListing,
  uploadListingPhoto,
  uploadOwnerIdDocument,
  uploadOwnershipEvidence,
} from "@/lib/actions/equipment-rentals";
import { EQUIPMENT_CONDITIONS } from "@/lib/rentals/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STEPS = ["Owner", "Equipment", "Pricing", "Location", "Review"] as const;

export type OwnerSeed = {
  kind: "INDIVIDUAL" | "BUSINESS";
  fullName?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  businessName?: string | null;
  cacNumber?: string | null;
  businessAddress?: string | null;
  businessCategory?: string | null;
  authorizedRepName?: string | null;
  website?: string | null;
  residentialAddress?: string | null;
  hasIdDocument: boolean;
};

export function ListEquipmentForm({ owner }: { owner?: OwnerSeed | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<"INDIVIDUAL" | "BUSINESS">(owner?.kind ?? "INDIVIDUAL");
  const isBusiness = kind === "BUSINESS";

  function goNext(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const ownerRes = await saveEquipmentOwner({
        kind,
        fullName: String(fd.get("fullName")),
        phone: String(fd.get("phone")),
        whatsapp: String(fd.get("whatsapp") || "") || undefined,
        email: String(fd.get("email")),
        stateOfResidence: String(fd.get("state") || "") || undefined,
        city: String(fd.get("city") || "") || undefined,
        residentialAddress: String(fd.get("residentialAddress") || "") || undefined,
        ...(isBusiness
          ? {
              businessName: String(fd.get("businessName") || "") || undefined,
              cacNumber: String(fd.get("cacNumber") || "") || undefined,
              businessAddress: String(fd.get("businessAddress") || "") || undefined,
              businessCategory: String(fd.get("businessCategory") || "") || undefined,
              authorizedRepName: String(fd.get("authorizedRepName") || "") || undefined,
              website: String(fd.get("website") || "") || undefined,
            }
          : {}),
      });
      if (!ownerRes.ok) {
        toast.error(ownerRes.error);
        setStep(0);
        return;
      }
      const idFile = fd.get("ownerIdFile");
      if (idFile instanceof File && idFile.size > 0) {
        const idUp = new FormData();
        idUp.set("file", idFile);
        const idRes = await uploadOwnerIdDocument(idUp);
        if (!idRes.ok) {
          toast.error(`ID upload failed: ${idRes.error}`);
          setStep(0);
          return;
        }
      }
      const res = await createEquipmentListing({
        name: String(fd.get("name")),
        category: String(fd.get("category")),
        subcategory: String(fd.get("subcategory") || "") || undefined,
        brand: String(fd.get("brand") || "") || undefined,
        model: String(fd.get("model") || "") || undefined,
        description: String(fd.get("description")),
        condition: String(fd.get("condition") || "GOOD") as (typeof EQUIPMENT_CONDITIONS)[number]["value"],
        accessories: String(fd.get("accessories") || "") || undefined,
        replacementValue: Number(fd.get("replacementValue") || 0) || undefined,
        hourlyPrice: Number(fd.get("hourlyPrice") || 0) || undefined,
        dailyPrice: Number(fd.get("dailyPrice") || 0) || undefined,
        weeklyPrice: Number(fd.get("weeklyPrice") || 0) || undefined,
        monthlyPrice: Number(fd.get("monthlyPrice") || 0) || undefined,
        securityDeposit: Number(fd.get("securityDeposit") || 0) || undefined,
        deliveryCharge: Number(fd.get("deliveryCharge") || 0) || undefined,
        pickupCharge: Number(fd.get("pickupCharge") || 0) || undefined,
        lateReturnCharge: Number(fd.get("lateReturnCharge") || 0) || undefined,
        state: String(fd.get("state") || "") || undefined,
        city: String(fd.get("city") || "") || undefined,
        area: String(fd.get("area") || "") || undefined,
        generalPickupLocation: String(fd.get("generalPickupLocation") || "") || undefined,
        preciseAddressPrivate: String(fd.get("residentialAddress") || "") || undefined,
        ownershipDeclaration: fd.get("ownershipDeclaration") === "on",
        rentalTerms: String(fd.get("rentalTerms") || "") || undefined,
        submitForReview: true,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const photo = fd.get("photo");
      if (photo instanceof File && photo.size > 0) {
        const up = new FormData();
        up.set("file", photo);
        await uploadListingPhoto(res.id, up);
      }
      const evidence = fd.getAll("ownershipEvidence").filter((f): f is File => f instanceof File && f.size > 0);
      if (evidence.length) {
        const evUp = new FormData();
        for (const f of evidence) evUp.append("files", f);
        const evRes = await uploadOwnershipEvidence(res.id, evUp);
        if (!evRes.ok) {
          toast.error(`Listing saved, but evidence upload failed: ${evRes.error}`);
        }
      }
      toast.success(`Listing ${res.hcId} submitted for review`);
      router.push("/dashboard/equipment");
    });
  }

  return (
    <form className="mx-auto max-w-2xl space-y-6" onSubmit={goNext}>
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/60 bg-muted/40 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="font-display text-xl font-semibold">{STEPS[step]}</h2>
          <div className="mt-3 flex gap-1.5">
            {STEPS.map((label, i) => (
              <div
                key={label}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i <= step ? "bg-primary" : "bg-muted",
                )}
                title={label}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className={cn("space-y-4", step !== 0 && "hidden")}>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={kind === "INDIVIDUAL"} onChange={() => setKind("INDIVIDUAL")} />
                Individual owner
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={kind === "BUSINESS"} onChange={() => setKind("BUSINESS")} />
                Business
              </label>
            </div>
            <Field name="fullName" label={isBusiness ? "Contact person full name" : "Full name"} required={step === 0} defaultValue={owner?.fullName ?? ""} />
            <Field name="phone" label="Phone" required={step === 0} defaultValue={owner?.phone ?? ""} />
            <Field name="whatsapp" label="WhatsApp" defaultValue={owner?.whatsapp ?? ""} />
            <Field name="email" label="Email" type="email" required={step === 0} defaultValue={owner?.email ?? ""} />
            {isBusiness && (
              <>
                <Field name="businessName" label="Business name" required={step === 0} defaultValue={owner?.businessName ?? ""} />
                <Field name="cacNumber" label="CAC registration number" required={step === 0} defaultValue={owner?.cacNumber ?? ""} />
                <Field name="authorizedRepName" label="Authorized representative" required={step === 0} defaultValue={owner?.authorizedRepName ?? ""} />
                <Field name="businessAddress" label="Business address" defaultValue={owner?.businessAddress ?? ""} />
                <Field name="businessCategory" label="Business category" defaultValue={owner?.businessCategory ?? ""} />
                <Field name="website" label="Website (optional)" defaultValue={owner?.website ?? ""} />
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="ownerIdFile">
                {isBusiness ? "Authorized representative ID" : "Government-issued ID"}
              </Label>
              <Input
                id="ownerIdFile"
                name="ownerIdFile"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required={step === 0 && !owner?.hasIdDocument}
              />
              <p className="text-xs text-muted-foreground">
                {owner?.hasIdDocument ? "An ID is on file. Upload a new one to replace it. " : ""}
                NIN slip, passport, driver&apos;s licence or voter&apos;s card (image or PDF). Private — used for
                owner verification only.
              </p>
            </div>
          </div>

          <div className={cn("space-y-4", step !== 1 && "hidden")}>
            <Field name="name" label="Equipment name" required={step === 1} />
            <Field name="category" label="Category" required={step === 1} />
            <Field name="subcategory" label="Subcategory" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="brand" label="Brand" />
              <Field name="model" label="Model" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" required={step === 1} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <select
                id="condition"
                name="condition"
                defaultValue="GOOD"
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {EQUIPMENT_CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <Field name="accessories" label="Accessories included" />
            <Field name="replacementValue" label="Replacement value (₦)" type="number" />
          </div>

          <div className={cn("space-y-4", step !== 2 && "hidden")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="hourlyPrice" label="Hourly (₦)" type="number" />
              <Field name="dailyPrice" label="Daily (₦)" type="number" />
              <Field name="weeklyPrice" label="Weekly (₦)" type="number" />
              <Field name="monthlyPrice" label="Monthly (₦)" type="number" />
              <Field name="securityDeposit" label="Security deposit (₦)" type="number" />
              <Field name="lateReturnCharge" label="Late return (₦)" type="number" />
              <Field name="deliveryCharge" label="Delivery (₦)" type="number" />
              <Field name="pickupCharge" label="Pickup (₦)" type="number" />
            </div>
          </div>

          <div className={cn("space-y-4", step !== 3 && "hidden")}>
            <Field name="state" label="State" defaultValue="FCT" />
            <Field name="city" label="City" />
            <Field name="area" label="Area (public)" />
            <Field name="generalPickupLocation" label="General pickup location" />
            <Field name="residentialAddress" label="Precise address (private)" defaultValue={owner?.residentialAddress ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="rentalTerms">Rental terms</Label>
              <Textarea id="rentalTerms" name="rentalTerms" rows={3} />
            </div>
          </div>

          <div className={cn("space-y-4", step !== 4 && "hidden")}>
            <div className="space-y-2">
              <Label htmlFor="photo">Photo of actual equipment</Label>
              <Input id="photo" name="photo" type="file" accept="image/*" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownershipEvidence">Proof of ownership (optional, up to 5 files)</Label>
              <Input
                id="ownershipEvidence"
                name="ownershipEvidence"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
              />
              <p className="text-xs text-muted-foreground">
                Purchase receipt, invoice, or a photo showing the serial number. Reviewed by HomeConnect admins and
                never shown publicly. Listings with evidence are approved faster.
              </p>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="ownershipDeclaration" required={step === 4} className="mt-1" />
              I declare I own or am authorized to rent out this equipment.
            </label>
            <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
              Submitting sends this listing for admin review. Precise addresses stay private until a booking
              is confirmed.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-between gap-2 border-t border-border/60 bg-card px-5 py-4">
          <Button type="button" variant="outline" disabled={step === 0 || pending} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          <Button type="submit" disabled={pending}>
            {step < STEPS.length - 1 ? "Continue" : pending ? "Submitting…" : "Submit for approval"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} />
    </div>
  );
}
