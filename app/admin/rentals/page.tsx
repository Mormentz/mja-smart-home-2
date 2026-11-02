import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminRentalsBoard, type AdminRentalsBoard } from "@/lib/actions/admin-rentals";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableHead,
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "@/components/dashboard/dashboard-data-table";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminEmpty, AdminStatCard } from "@/components/admin/admin-stat-card";
import { fmtDate, personLabel } from "@/components/admin/admin-format";
import { ListingDecisionActions, OwnerDecisionActions } from "@/components/admin/admin-rental-actions";
import { formatMoney } from "@/lib/currency";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

const TABS = ["pending", "listings", "bookings", "owners", "disputes"] as const;

const CHIPS: Record<string, { id: string; label: string }[]> = {
  listings: [
    { id: "PENDING_REVIEW", label: "Pending" },
    { id: "APPROVED", label: "Approved" },
    { id: "REJECTED", label: "Rejected" },
    { id: "SUSPENDED", label: "Suspended" },
    { id: "DRAFT", label: "Draft" },
  ],
  bookings: [
    { id: "overdue", label: "Overdue" },
    { id: "REQUESTED", label: "Requested" },
    { id: "CONFIRMED", label: "Confirmed" },
    { id: "ACTIVE", label: "Active" },
    { id: "RETURN_PENDING", label: "Return pending" },
    { id: "COMPLETED", label: "Completed" },
    { id: "CANCELLED", label: "Cancelled" },
    { id: "DISPUTED", label: "Disputed" },
  ],
  owners: [
    { id: "PENDING", label: "Pending" },
    { id: "VERIFIED", label: "Verified" },
    { id: "REJECTED", label: "Rejected" },
  ],
  disputes: [
    { id: "OPEN", label: "Open" },
    { id: "UNDER_REVIEW", label: "Under review" },
    { id: "RESOLVED", label: "Resolved" },
    { id: "CLOSED", label: "Closed" },
  ],
};

export default async function AdminRentalsPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = (await searchParams) ?? {};
  const rawTab = one(sp.tab);
  const tab = (TABS as readonly string[]).includes(rawTab ?? "") ? (rawTab as (typeof TABS)[number]) : "pending";
  const q = one(sp.q)?.trim();
  const status = one(sp.status)?.trim();

  const board = await getAdminRentalsBoard({ q, status });
  if (!board) redirect("/admin/login");

  const { counts } = board;

  return (
    <DashboardSection
      title="Rentals administration"
      description="Review listings and owners, monitor active and overdue rentals, and resolve disputes."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Pending approvals" value={counts.pendingListings + counts.pendingOwners} href="/admin/rentals?tab=pending" tone={counts.pendingListings + counts.pendingOwners ? "warn" : undefined} />
        <AdminStatCard label="Active / confirmed rentals" value={counts.activeBookings} href="/admin/rentals?tab=bookings" />
        <AdminStatCard label="Overdue returns" value={counts.overdueBookings} href="/admin/rentals?tab=bookings&status=overdue" tone={counts.overdueBookings ? "danger" : undefined} />
        <AdminStatCard label="Open disputes" value={counts.openDisputes} href="/admin/rentals?tab=disputes&status=OPEN" tone={counts.openDisputes ? "warn" : undefined} />
      </div>

      <Suspense fallback={null}>
        <AdminTabs
          defaultTab="pending"
          tabs={[
            { id: "pending", label: "Pending", count: counts.pendingListings + counts.pendingOwners },
            { id: "listings", label: "Listings", count: counts.totalListings },
            { id: "bookings", label: "Bookings", count: counts.overdueBookings },
            { id: "owners", label: "Owners", count: counts.pendingOwners },
            { id: "disputes", label: "Disputes", count: counts.openDisputes },
          ]}
        />
      </Suspense>

      <div className="mt-4 space-y-4">
        {tab !== "pending" && (
          <Suspense fallback={null}>
            <AdminFilterBar
              key={tab}
              searchPlaceholder={
                tab === "listings"
                  ? "Search name, HC ID, category, city…"
                  : tab === "bookings"
                    ? "Search booking, equipment, customer…"
                    : tab === "owners"
                      ? "Search owner name, HC ID, email…"
                      : "Search description, equipment, reporter…"
              }
              chips={CHIPS[tab]}
              chipParam="status"
            />
          </Suspense>
        )}

        {tab === "pending" && <PendingTab board={board} />}
        {tab === "listings" && <ListingsTab board={board} />}
        {tab === "bookings" && <BookingsTab board={board} showSections={!q && !status} />}
        {tab === "owners" && <OwnersTab board={board} />}
        {tab === "disputes" && <DisputesTab board={board} />}
      </div>
    </DashboardSection>
  );
}

function ownerName(o: { fullName: string | null; businessName: string | null; hcId: string }) {
  return o.businessName || o.fullName || o.hcId;
}

function PendingTab({ board }: { board: AdminRentalsBoard }) {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="font-display text-sm font-semibold">Equipment awaiting approval</h2>
        {board.pendingListings.length === 0 ? (
          <AdminEmpty>No pending listings.</AdminEmpty>
        ) : (
          <div className="space-y-3">
            {board.pendingListings.map((l) => (
              <div key={l.id} className="rounded-xl border border-border/60 bg-card p-4 text-sm shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-mono text-xs text-muted-foreground">{l.hcId}</p>
                    <Link href={`/admin/rentals/listings/${l.id}`} className="font-medium hover:underline">
                      {l.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {l.category} · {l.condition.replace(/_/g, " ").toLowerCase()} · {l.photos.length} photo
                      {l.photos.length === 1 ? "" : "s"} · Owner: {ownerName(l.owner)}
                      {l.owner.identityStatus !== "VERIFIED" ? " (identity not verified)" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {l.dailyPrice ? `${formatMoney(l.dailyPrice)}/day` : "No daily price"} · Submitted {fmtDate(l.updatedAt)}
                    </p>
                  </div>
                  <ListingDecisionActions listingId={l.id} status={l.status} compact />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-sm font-semibold">Owner identity awaiting verification</h2>
        {board.pendingOwners.length === 0 ? (
          <AdminEmpty>No pending owners.</AdminEmpty>
        ) : (
          <div className="space-y-3">
            {board.pendingOwners.map((o) => (
              <div key={o.id} className="rounded-xl border border-border/60 bg-card p-4 text-sm shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-mono text-xs text-muted-foreground">{o.hcId}</p>
                    <Link href={`/admin/users/${o.user.id}`} className="font-medium hover:underline">
                      {ownerName(o)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {o.user.email} · {o.kind.toLowerCase()} · {o._count.listings} listing
                      {o._count.listings === 1 ? "" : "s"}
                    </p>
                  </div>
                  <OwnerDecisionActions ownerId={o.id} compact />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ListingsTab({ board }: { board: AdminRentalsBoard }) {
  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Equipment</DashboardTableHead>
            <DashboardTableHead>Owner</DashboardTableHead>
            <DashboardTableHead>Category</DashboardTableHead>
            <DashboardTableHead className="text-right">Daily</DashboardTableHead>
            <DashboardTableHead>Status</DashboardTableHead>
            <DashboardTableHead className="text-right">Bookings</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {board.listings.map((l) => (
            <TableRow key={l.id} className="border-border/40">
              <DashboardTableCell>
                <Link href={`/admin/rentals/listings/${l.id}`} className="font-medium hover:underline">
                  {l.name}
                </Link>
                <p className="font-mono text-[11px] text-muted-foreground">{l.hcId}</p>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs">{ownerName(l.owner)}</DashboardTableCell>
              <DashboardTableCell className="text-xs">{l.category}</DashboardTableCell>
              <DashboardTableCell className="text-right tabular-nums">
                {l.dailyPrice ? formatMoney(l.dailyPrice) : "—"}
              </DashboardTableCell>
              <DashboardTableCell>
                <AdminStatusBadge status={l.status} />
              </DashboardTableCell>
              <DashboardTableCell className="text-right tabular-nums">{l._count.bookings}</DashboardTableCell>
              <DashboardTableCell className="text-right">
                <ListingDecisionActions listingId={l.id} status={l.status} compact />
              </DashboardTableCell>
            </TableRow>
          ))}
          {board.listings.length === 0 && (
            <TableRow>
              <DashboardTableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                No listings match.
              </DashboardTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}

type BookingRow = AdminRentalsBoard["bookings"][number];

function BookingsTable({ rows, empty, now }: { rows: BookingRow[]; empty: string; now: number }) {
  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Equipment</DashboardTableHead>
            <DashboardTableHead>Customer</DashboardTableHead>
            <DashboardTableHead>Period</DashboardTableHead>
            <DashboardTableHead className="text-right">Total</DashboardTableHead>
            <DashboardTableHead>Payment</DashboardTableHead>
            <DashboardTableHead>Status</DashboardTableHead>
            <DashboardTableHead className="text-right">Open</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((b) => {
            const overdue =
              (b.status === "ACTIVE" || b.status === "RETURN_PENDING") && new Date(b.endDate).getTime() < now;
            const days = Math.ceil((now - new Date(b.endDate).getTime()) / 86_400_000);
            return (
              <TableRow key={b.id} className="border-border/40">
                <DashboardTableCell>
                  <p className="font-medium">{b.listing.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{b.listing.hcId}</p>
                </DashboardTableCell>
                <DashboardTableCell className="text-xs">
                  <Link href={`/admin/users/${b.customerUser.id}`} className="hover:underline">
                    {personLabel(b.customerUser)}
                  </Link>
                </DashboardTableCell>
                <DashboardTableCell className="text-xs">
                  {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
                  {overdue && (
                    <p className="font-semibold text-red-700">{days}d overdue</p>
                  )}
                </DashboardTableCell>
                <DashboardTableCell className="text-right tabular-nums">{formatMoney(b.estimatedTotal)}</DashboardTableCell>
                <DashboardTableCell className="text-xs">{b.paymentStatus.replace(/_/g, " ").toLowerCase()}</DashboardTableCell>
                <DashboardTableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <AdminStatusBadge status={b.status} />
                    {b._count.disputes > 0 && <AdminStatusBadge status="DISPUTED" />}
                  </div>
                </DashboardTableCell>
                <DashboardTableCell className="text-right">
                  <Link href={`/admin/rentals/bookings/${b.id}`} className="text-xs text-primary hover:underline">
                    Details →
                  </Link>
                </DashboardTableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <DashboardTableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                {empty}
              </DashboardTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}

function BookingsTab({ board, showSections }: { board: AdminRentalsBoard; showSections: boolean }) {
  return (
    <div className="space-y-6">
      {showSections && (
        <>
          <section className="space-y-2">
            <h2 className="font-display text-sm font-semibold text-red-800">
              Overdue returns ({board.overdueBookings.length})
            </h2>
            <BookingsTable rows={board.overdueBookings} empty="No overdue rentals." now={board.generatedAt} />
          </section>
          <section className="space-y-2">
            <h2 className="font-display text-sm font-semibold">
              Active &amp; confirmed ({board.activeBookings.length})
            </h2>
            <BookingsTable rows={board.activeBookings} empty="No active rentals right now." now={board.generatedAt} />
          </section>
        </>
      )}
      <section className="space-y-2">
        <h2 className="font-display text-sm font-semibold">
          {showSections ? "All bookings" : "Matching bookings"}
        </h2>
        <BookingsTable rows={board.bookings} empty="No bookings match." now={board.generatedAt} />
      </section>
    </div>
  );
}

function OwnersTab({ board }: { board: AdminRentalsBoard }) {
  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Owner</DashboardTableHead>
            <DashboardTableHead>Contact</DashboardTableHead>
            <DashboardTableHead>Kind</DashboardTableHead>
            <DashboardTableHead className="text-right">Listings</DashboardTableHead>
            <DashboardTableHead>Identity</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {board.owners.map((o) => (
            <TableRow key={o.id} className="border-border/40">
              <DashboardTableCell>
                <Link href={`/admin/users/${o.user.id}`} className="font-medium hover:underline">
                  {ownerName(o)}
                </Link>
                <p className="font-mono text-[11px] text-muted-foreground">{o.hcId}</p>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs">
                {o.user.email}
                {o.phone ? <p className="text-muted-foreground">{o.phone}</p> : null}
              </DashboardTableCell>
              <DashboardTableCell className="text-xs capitalize">{o.kind.toLowerCase()}</DashboardTableCell>
              <DashboardTableCell className="text-right tabular-nums">{o._count.listings}</DashboardTableCell>
              <DashboardTableCell>
                <AdminStatusBadge status={o.identityStatus} />
              </DashboardTableCell>
              <DashboardTableCell className="text-right">
                {o.identityStatus === "VERIFIED" ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <OwnerDecisionActions ownerId={o.id} compact />
                )}
              </DashboardTableCell>
            </TableRow>
          ))}
          {board.owners.length === 0 && (
            <TableRow>
              <DashboardTableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No owners match.
              </DashboardTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}

function DisputesTab({ board }: { board: AdminRentalsBoard }) {
  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Type</DashboardTableHead>
            <DashboardTableHead>Equipment</DashboardTableHead>
            <DashboardTableHead>Opened by</DashboardTableHead>
            <DashboardTableHead>Opened</DashboardTableHead>
            <DashboardTableHead>Status</DashboardTableHead>
            <DashboardTableHead className="text-right">Open</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {board.disputes.map((d) => (
            <TableRow key={d.id} className="border-border/40">
              <DashboardTableCell>
                <p className="font-medium capitalize">{d.type.replace(/_/g, " ").toLowerCase()}</p>
                <p className="line-clamp-1 max-w-xs text-[11px] text-muted-foreground">{d.description}</p>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs">{d.booking.listing.name}</DashboardTableCell>
              <DashboardTableCell className="text-xs">{personLabel(d.openedBy)}</DashboardTableCell>
              <DashboardTableCell className="text-xs">{fmtDate(d.createdAt)}</DashboardTableCell>
              <DashboardTableCell>
                <AdminStatusBadge status={d.status} />
              </DashboardTableCell>
              <DashboardTableCell className="text-right">
                <Link href={`/admin/rentals/disputes/${d.id}`} className="text-xs text-primary hover:underline">
                  Review →
                </Link>
              </DashboardTableCell>
            </TableRow>
          ))}
          {board.disputes.length === 0 && (
            <TableRow>
              <DashboardTableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                No disputes match.
              </DashboardTableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}
