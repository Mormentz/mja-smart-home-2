import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminDisputeDetail } from "@/lib/actions/admin-rentals";
import { AdminDetailShell } from "@/components/admin/admin-detail-shell";
import { AdminKeyValue } from "@/components/admin/admin-stat-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DisputeResolveForm } from "@/components/admin/admin-rental-actions";
import { fmtDate, fmtDateTime, humanize, personLabel } from "@/components/admin/admin-format";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { formatMoney } from "@/lib/currency";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminRentalDisputeDetailPage({ params }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const data = await getAdminDisputeDetail(id);
  if (!data) notFound();
  const { dispute: d, activity } = data;
  const b = d.booking;

  return (
    <AdminDetailShell
      backHref="/admin/rentals?tab=disputes"
      backLabel="All disputes"
      title={`${humanize(d.type)} dispute`}
      subtitle={`${b.listing.name} · opened ${fmtDate(d.createdAt)}`}
      status={d.status}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel title="Complaint">
          <p className="whitespace-pre-wrap text-sm">{d.description}</p>
          <div className="mt-4">
            <AdminKeyValue
              items={[
                {
                  label: "Opened by",
                  value: (
                    <Link className="text-primary hover:underline" href={`/admin/users/${d.openedBy.id}`}>
                      {personLabel(d.openedBy)}
                    </Link>
                  ),
                },
                { label: "Contact", value: d.openedBy.phone ?? d.openedBy.email },
              ]}
            />
          </div>
        </DashboardPanel>

        <DashboardPanel title="Booking">
          <AdminKeyValue
            items={[
              {
                label: "Booking",
                value: (
                  <Link className="text-primary hover:underline" href={`/admin/rentals/bookings/${b.id}`}>
                    {b.id.slice(0, 10)}…
                  </Link>
                ),
              },
              { label: "Booking status", value: <AdminStatusBadge status={b.status} /> },
              { label: "Equipment", value: <Link className="text-primary hover:underline" href={`/admin/rentals/listings/${b.listing.id}`}>{b.listing.name}</Link> },
              { label: "Period", value: `${fmtDate(b.startDate)} → ${fmtDate(b.endDate)}` },
              { label: "Customer", value: personLabel(b.customerUser) },
              { label: "Owner", value: personLabel(b.listing.owner.user) },
              { label: "Total", value: formatMoney(b.estimatedTotal) },
              { label: "Deposit", value: `${formatMoney(b.depositAmount)} (${humanize(b.paymentStatus)})` },
            ]}
          />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Resolution">
        <DisputeResolveForm
          disputeId={d.id}
          status={d.status}
          existingResolution={d.resolution}
          bookingStatus={b.status}
        />
      </DashboardPanel>

      <DashboardPanel title="Admin activity">
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No admin activity.</p>
        ) : (
          <ul className="space-y-1 font-mono text-xs text-muted-foreground">
            {activity.map((a) => (
              <li key={a.id}>
                {fmtDateTime(a.createdAt)} · {a.action}
              </li>
            ))}
          </ul>
        )}
      </DashboardPanel>
    </AdminDetailShell>
  );
}
