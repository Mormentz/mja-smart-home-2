import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminListingDetail } from "@/lib/actions/admin-rentals";
import { AdminDetailShell } from "@/components/admin/admin-detail-shell";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminEmpty, AdminKeyValue } from "@/components/admin/admin-stat-card";
import { ListingDecisionActions, OwnerDecisionActions } from "@/components/admin/admin-rental-actions";
import { fmtDate, fmtDateTime, humanize, personLabel } from "@/components/admin/admin-format";
import { formatMoney } from "@/lib/currency";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const money = (n: number | null | undefined) => (n ? formatMoney(n) : "—");

export default async function AdminListingDetailPage({ params, searchParams }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const tab = one((await searchParams)?.tab) || "details";
  const data = await getAdminListingDetail(id);
  if (!data) notFound();
  const { listing, activity } = data;
  const owner = listing.owner;

  return (
    <AdminDetailShell
      backHref="/admin/rentals?tab=listings"
      backLabel="All listings"
      title={listing.name}
      subtitle={`${listing.hcId} · ${listing.category}${listing.subcategory ? ` / ${listing.subcategory}` : ""}`}
      status={listing.status}
      actions={<ListingDecisionActions listingId={listing.id} status={listing.status} />}
    >
      <Suspense fallback={null}>
        <AdminTabs
          defaultTab="details"
          tabs={[
            { id: "details", label: "Details" },
            { id: "pricing", label: "Pricing & terms" },
            { id: "owner", label: "Owner" },
            { id: "bookings", label: "Bookings", count: listing.bookings.length },
            { id: "activity", label: "Activity" },
          ]}
        />
      </Suspense>

      <div className="mt-4 space-y-4 rounded-xl border border-border/60 bg-card p-4">
        {tab === "details" && (
          <>
            <AdminKeyValue
              items={[
                { label: "Condition", value: humanize(listing.condition) },
                { label: "Brand / model", value: [listing.brand, listing.model].filter(Boolean).join(" ") || "—" },
                { label: "Year", value: listing.yearOfManufacture ?? "—" },
                { label: "Quantity", value: listing.quantity },
                { label: "Location", value: [listing.area, listing.city, listing.state].filter(Boolean).join(", ") || "—" },
                { label: "Pickup", value: listing.generalPickupLocation ?? "—" },
                { label: "Precise address (private)", value: listing.preciseAddressPrivate ?? "—" },
                { label: "Serial number (private)", value: listing.serialNumberPrivate ?? "—" },
                { label: "Accessories", value: listing.accessories ?? "—" },
                { label: "Replacement value", value: money(listing.replacementValue) },
                { label: "Delivery", value: listing.deliveryAvailable ? `Yes (≤ ${listing.maxDeliveryKm ?? "?"} km)` : "No" },
                { label: "Pickup available", value: listing.pickupAvailable ? "Yes" : "No" },
              ]}
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm">{listing.description}</p>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Review checklist
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Check ok={listing.ownershipDeclaration} label="Ownership declared" />
                <Check ok={listing.ownershipReviewed} label="Ownership reviewed" />
                <Check ok={listing.equipmentInspected} label="Equipment inspected" />
                <Check ok={listing.functionalityTested} label="Functionality tested" />
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Photos ({listing.photos.length})
              </p>
              {listing.photos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No photos uploaded.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {listing.photos.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="aspect-square w-full rounded-lg border object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
            {listing.ownershipEvidenceUrls.length > 0 && (
              <div className="text-sm">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Ownership evidence
                </p>
                <ul className="list-inside list-disc">
                  {listing.ownershipEvidenceUrls.map((u) => (
                    <li key={u}>
                      <a href={u} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {u}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {tab === "pricing" && (
          <>
            <AdminKeyValue
              items={[
                { label: "Hourly", value: money(listing.hourlyPrice) },
                { label: "Daily", value: money(listing.dailyPrice) },
                { label: "Weekly", value: money(listing.weeklyPrice) },
                { label: "Monthly", value: money(listing.monthlyPrice) },
                { label: "Security deposit", value: money(listing.securityDeposit) },
                { label: "Delivery charge", value: money(listing.deliveryCharge) },
                { label: "Pickup charge", value: money(listing.pickupCharge) },
                { label: "Operator charge", value: money(listing.operatorCharge) },
                { label: "Late return charge", value: money(listing.lateReturnCharge) },
                { label: "Min duration (h)", value: listing.minDurationHours ?? "—" },
                { label: "Max duration (h)", value: listing.maxDurationHours ?? "—" },
              ]}
            />
            <TextBlock label="Damage policy" value={listing.damagePolicy} />
            <TextBlock label="Cancellation policy" value={listing.cancellationPolicy} />
            <TextBlock label="Rental terms" value={listing.rentalTerms} />
          </>
        )}

        {tab === "owner" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{owner.businessName || owner.fullName || owner.hcId}</p>
                <p className="font-mono text-xs text-muted-foreground">{owner.hcId}</p>
              </div>
              <div className="flex items-center gap-2">
                <AdminStatusBadge status={owner.identityStatus} />
                {owner.identityStatus !== "VERIFIED" && <OwnerDecisionActions ownerId={owner.id} compact />}
              </div>
            </div>
            <AdminKeyValue
              items={[
                { label: "Account", value: <Link className="text-primary hover:underline" href={`/admin/users/${owner.user.id}`}>{personLabel(owner.user)}</Link> },
                { label: "Email", value: owner.email ?? owner.user.email },
                { label: "Phone", value: owner.phone ?? owner.user.phone ?? "—" },
                { label: "Kind", value: humanize(owner.kind) },
                { label: "Location", value: [owner.city, owner.stateOfResidence].filter(Boolean).join(", ") || "—" },
                { label: "CAC number", value: owner.cacNumber ?? "—" },
                { label: "Authorized rep", value: owner.authorizedRepName ?? "—" },
                {
                  label: "ID document",
                  value: owner.idDocumentUrl ? (
                    <a className="text-primary hover:underline" href={owner.idDocumentUrl} target="_blank" rel="noreferrer">
                      View ID
                    </a>
                  ) : (
                    "Not uploaded"
                  ),
                },
              ]}
            />
          </>
        )}

        {tab === "bookings" &&
          (listing.bookings.length === 0 ? (
            <AdminEmpty>No bookings for this listing.</AdminEmpty>
          ) : (
            <ul className="divide-y divide-border/50 text-sm">
              {listing.bookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <p className="font-medium">{personLabel(b.customerUser)}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(b.startDate)} → {fmtDate(b.endDate)} · {formatMoney(b.estimatedTotal)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AdminStatusBadge status={b.status} />
                    <Link href={`/admin/rentals/bookings/${b.id}`} className="text-xs text-primary hover:underline">
                      Details →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ))}

        {tab === "activity" &&
          (activity.length === 0 ? (
            <AdminEmpty>No admin activity recorded for this listing.</AdminEmpty>
          ) : (
            <ul className="space-y-1 font-mono text-xs text-muted-foreground">
              {activity.map((a) => (
                <li key={a.id}>
                  {fmtDateTime(a.createdAt)} · {a.action}
                </li>
              ))}
            </ul>
          ))}
      </div>
    </AdminDetailShell>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-border bg-muted text-muted-foreground"}`}
    >
      {ok ? "✓" : "○"} {label}
    </span>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm">{value || "—"}</p>
    </div>
  );
}
