"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  adminDeleteProperty,
  adminSetPropertyVerification,
  updateAdminProperty,
  updateAdminPropertyAmenities,
  updateAdminPropertyMedia,
  type AdminPropertyDetail as Detail,
} from "@/lib/actions/admin-properties";
import { adminUpdateBookingStatus } from "@/lib/actions/admin-ops";
import { releaseEscrow, refundEscrow } from "@/lib/actions/escrow";
import { AdminDetailShell } from "@/components/admin/admin-detail-shell";
import { AdminRejectDialog } from "@/components/admin/admin-reject-dialog";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { AdminEmpty, AdminKeyValue } from "@/components/admin/admin-stat-card";
import { fmtDate, fmtDateTime, humanize, personLabel } from "@/components/admin/admin-format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/currency";
import { imageSrc, resolveImage } from "@/lib/property-images";

const selectCls = "h-10 w-full rounded-md border border-border bg-background px-3 text-sm";

export function AdminPropertyDetail({ data, tab }: { data: Detail; tab: string }) {
  const { property, allAmenities, neighborhoods, activity } = data;
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);

  const [form, setForm] = useState({
    title: property.title,
    location: property.location,
    price: String(property.price),
    currency: property.currency,
    type: property.type as string,
    category: property.category as string,
    beds: String(property.beds),
    baths: String(property.baths),
    area: String(property.area),
    description: property.description,
    tourUrl: property.tourUrl ?? "",
    neighborhoodId: property.neighborhoodId ?? "",
    featured: property.featured,
  });
  const [image, setImage] = useState(property.image);
  const [gallery, setGallery] = useState<string[]>(property.images);
  const [newImage, setNewImage] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    property.propertyAmenities.map((pa) => pa.amenityId),
  );

  function refresh() {
    router.refresh();
  }

  function run<T extends { error?: string }>(fn: () => Promise<T>, okMsg: string, after?: () => void) {
    start(async () => {
      const r = await fn();
      if (r.error) toast.error(r.error);
      else {
        toast.success(okMsg);
        after?.();
        refresh();
      }
    });
  }

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const escrowPayments = property.leases.flatMap((l) => l.escrowPayments.map((e) => ({ ...e, leaseId: l.id })));

  return (
    <AdminDetailShell
      backHref="/admin/properties"
      backLabel="All properties"
      title={property.title}
      subtitle={`${property.location} · ${property.id}`}
      status={property.verificationStatus}
      actions={
        <>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/properties/${property.id}`} target="_blank">
              View public page
            </Link>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (!confirm("Delete this property permanently? Bookings and leases will be removed.")) return;
              start(async () => {
                const r = await adminDeleteProperty(property.id);
                if (r.error) toast.error(r.error);
                else {
                  toast.success("Property deleted");
                  router.push("/admin/properties");
                }
              });
            }}
          >
            Delete
          </Button>
        </>
      }
    >
      <AdminTabs
        defaultTab="listing"
        tabs={[
          { id: "listing", label: "Listing" },
          { id: "media", label: "Media", count: property.images.length },
          { id: "amenities", label: "Amenities", count: property.propertyAmenities.length },
          { id: "verification", label: "Verification" },
          { id: "bookings", label: "Bookings", count: property.bookings.length },
          { id: "leases", label: "Leases", count: property.leases.length },
          { id: "owner", label: "Owner" },
        ]}
      />

      <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
        {tab === "listing" && (
          <form
            className="grid max-w-3xl gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () =>
                  updateAdminProperty(property.id, {
                    title: form.title,
                    location: form.location,
                    price: Number(form.price),
                    currency: form.currency,
                    type: form.type as "FOR_SALE" | "FOR_RENT",
                    category: form.category as Detail["property"]["category"],
                    beds: Number(form.beds),
                    baths: Number(form.baths),
                    area: Number(form.area),
                    description: form.description,
                    tourUrl: form.tourUrl,
                    neighborhoodId: form.neighborhoodId || null,
                    featured: form.featured,
                  }),
                "Listing saved",
              );
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
              </Field>
              <Field label="Location">
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} required />
              </Field>
              <Field label="Price">
                <Input type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} />
              </Field>
              <Field label="Currency symbol">
                <Input value={form.currency} onChange={(e) => set("currency", e.target.value)} />
              </Field>
              <Field label="Listing type">
                <select className={selectCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="FOR_SALE">For sale</option>
                  <option value="FOR_RENT">For rent</option>
                </select>
              </Field>
              <Field label="Category">
                <select className={selectCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {["HOUSE", "APARTMENT", "VILLA", "LOFT", "TOWNHOUSE", "PENTHOUSE"].map((c) => (
                    <option key={c} value={c}>
                      {humanize(c)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Beds">
                <Input type="number" min={0} value={form.beds} onChange={(e) => set("beds", e.target.value)} />
              </Field>
              <Field label="Baths">
                <Input type="number" min={0} value={form.baths} onChange={(e) => set("baths", e.target.value)} />
              </Field>
              <Field label="Area (sqm)">
                <Input type="number" min={0} value={form.area} onChange={(e) => set("area", e.target.value)} />
              </Field>
              <Field label="Neighbourhood">
                <select
                  className={selectCls}
                  value={form.neighborhoodId}
                  onChange={(e) => set("neighborhoodId", e.target.value)}
                >
                  <option value="">None</option>
                  {neighborhoods.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Virtual tour URL">
                <Input value={form.tourUrl} onChange={(e) => set("tourUrl", e.target.value)} placeholder="https://…" />
              </Field>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                />
                Featured on homepage
              </label>
            </div>
            <Field label="Description">
              <Textarea rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Button type="submit" disabled={pending} className="w-fit">
              {pending ? "Saving…" : "Save listing"}
            </Button>
          </form>
        )}

        {tab === "media" && (
          <div className="max-w-3xl space-y-5">
            <div className="space-y-2">
              <Label>Cover image</Label>
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc(resolveImage(image))}
                  alt=""
                  className="h-24 w-36 shrink-0 rounded-lg border object-cover"
                />
                <Input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Image URL or path" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gallery ({gallery.length})</Label>
              {gallery.length === 0 && <p className="text-sm text-muted-foreground">No gallery images.</p>}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {gallery.map((url, i) => (
                  <div key={`${url}-${i}`} className="space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc(resolveImage(url))}
                      alt=""
                      className="aspect-[4/3] w-full rounded-lg border object-cover"
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 text-xs"
                        onClick={() => setImage(url)}
                      >
                        Make cover
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive"
                        onClick={() => setGallery((g) => g.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Add image URL or path"
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!newImage.trim()}
                  onClick={() => {
                    setGallery((g) => [...g, newImage.trim()]);
                    setNewImage("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            <Button
              disabled={pending || !image.trim()}
              onClick={() => run(() => updateAdminPropertyMedia(property.id, { image, images: gallery }), "Media saved")}
            >
              {pending ? "Saving…" : "Save media"}
            </Button>
          </div>
        )}

        {tab === "amenities" && (
          <div className="max-w-3xl space-y-4">
            {allAmenities.length === 0 ? (
              <AdminEmpty>No amenities defined. Create some under Amenities.</AdminEmpty>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {allAmenities.map((a) => {
                  const checked = selectedAmenities.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${checked ? "border-primary bg-primary/5" : "border-border"} ${!a.active ? "opacity-60" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setSelectedAmenities((s) =>
                            e.target.checked ? [...s, a.id] : s.filter((x) => x !== a.id),
                          )
                        }
                      />
                      <span>{a.name}</span>
                      {!a.active && <span className="text-[10px] uppercase text-muted-foreground">inactive</span>}
                    </label>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Inactive amenities are dropped when saving. Manage the master list under Amenities.
            </p>
            <Button
              disabled={pending}
              onClick={() => run(() => updateAdminPropertyAmenities(property.id, selectedAmenities), "Amenities saved")}
            >
              {pending ? "Saving…" : "Save amenities"}
            </Button>
          </div>
        )}

        {tab === "verification" && (
          <div className="max-w-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <AdminStatusBadge status={property.verificationStatus} />
              <span className="text-sm text-muted-foreground">
                {property.verifiedAt ? `Verified ${fmtDateTime(property.verifiedAt)}` : "Not verified"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={pending || property.verificationStatus === "VERIFIED"}
                onClick={() =>
                  run(() => adminSetPropertyVerification(property.id, "VERIFIED"), "Property verified")
                }
              >
                Approve verification
              </Button>
              <Button
                variant="outline"
                disabled={pending || property.verificationStatus === "REJECTED"}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </Button>
              <Button
                variant="ghost"
                disabled={pending || property.verificationStatus === "UNVERIFIED"}
                onClick={() =>
                  run(() => adminSetPropertyVerification(property.id, "UNVERIFIED"), "Verification reset")
                }
              >
                Reset to unverified
              </Button>
            </div>
            <AdminRejectDialog
              open={rejectOpen}
              onOpenChange={setRejectOpen}
              title="Reject property verification"
              onConfirm={async (note) => {
                const r = await adminSetPropertyVerification(property.id, "REJECTED", note);
                if (r.error) toast.error(r.error);
                else {
                  toast.message("Property rejected");
                  refresh();
                }
              }}
            />

            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Activity
              </p>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No admin activity recorded.</p>
              ) : (
                <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                  {activity.map((a) => (
                    <li key={a.id}>
                      {fmtDateTime(a.createdAt)} · {a.action}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {tab === "bookings" &&
          (property.bookings.length === 0 ? (
            <AdminEmpty>No tour or purchase-interest bookings.</AdminEmpty>
          ) : (
            <ul className="divide-y divide-border/50 text-sm">
              {property.bookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div>
                    <Link href={`/admin/users/${b.user.id}`} className="font-medium hover:underline">
                      {personLabel(b.user)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {humanize(b.kind)} · preferred {fmtDate(b.preferredDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AdminStatusBadge status={b.status} />
                    {b.status === "PENDING" && (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={pending}
                        onClick={() =>
                          run(() => adminUpdateBookingStatus(b.id, "APPROVED"), "Booking approved")
                        }
                      >
                        Approve
                      </Button>
                    )}
                    {b.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={pending}
                        onClick={() =>
                          run(() => adminUpdateBookingStatus(b.id, "CANCELLED"), "Booking cancelled")
                        }
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ))}

        {tab === "leases" && (
          <div className="space-y-5">
            {property.leases.length === 0 ? (
              <AdminEmpty>No leases for this property.</AdminEmpty>
            ) : (
              <ul className="divide-y divide-border/50 text-sm">
                {property.leases.map((l) => (
                  <li key={l.id} className="space-y-1 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {personLabel(l.renter)} <span className="text-muted-foreground">renting from</span>{" "}
                        {personLabel(l.landlord)}
                      </p>
                      <AdminStatusBadge status={l.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(l.startDate)} → {fmtDate(l.endDate)} · {formatMoney(l.monthlyRent)}/month ·{" "}
                      {l.escrowPayments.length} escrow payment{l.escrowPayments.length === 1 ? "" : "s"}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {escrowPayments.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Escrow payments
                </p>
                <ul className="divide-y divide-border/50 text-sm">
                  {escrowPayments.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <div>
                        <p className="font-medium tabular-nums">{formatMoney(e.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {humanize(e.purpose)} · {fmtDate(e.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <AdminStatusBadge status={e.status} />
                        {e.status === "HELD" && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              disabled={pending}
                              onClick={() => {
                                if (!confirm("Release this escrow to the landlord?")) return;
                                run(() => releaseEscrow(e.id), "Escrow released");
                              }}
                            >
                              Release
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={pending}
                              onClick={() => {
                                if (!confirm("Refund this escrow to the payer?")) return;
                                run(() => refundEscrow(e.id), "Escrow refunded");
                              }}
                            >
                              Refund
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tab === "owner" && (
          <div className="space-y-4">
            <AdminKeyValue
              items={[
                {
                  label: "Name",
                  value: (
                    <Link className="text-primary hover:underline" href={`/admin/users/${property.owner.id}`}>
                      {personLabel(property.owner)}
                    </Link>
                  ),
                },
                { label: "Email", value: property.owner.email },
                { label: "Phone", value: property.owner.phone ?? "—" },
                { label: "Role", value: humanize(property.owner.role) },
                { label: "Account", value: property.owner.active ? "Active" : "Inactive" },
                { label: "KYC", value: <AdminStatusBadge status={property.owner.kycStatus} /> },
                { label: "KYC level", value: humanize(property.owner.kycLevel) },
                { label: "Member since", value: fmtDate(property.owner.createdAt) },
                { label: "Total listings", value: property.owner._count.properties },
              ]}
            />
            <Button size="sm" variant="outline" asChild>
              <Link href={`/admin/users/${property.owner.id}`}>Open full user profile</Link>
            </Button>
          </div>
        )}
      </div>
    </AdminDetailShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
