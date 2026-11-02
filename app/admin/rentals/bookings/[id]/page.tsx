import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminBookingDetail } from "@/lib/actions/admin-rentals";
import { AdminDetailShell } from "@/components/admin/admin-detail-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminEmpty, AdminKeyValue } from "@/components/admin/admin-stat-card";
import { BookingStatusControl } from "@/components/admin/admin-rental-actions";
import { fmtDate, fmtDateTime, humanize, personLabel } from "@/components/admin/admin-format";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { formatMoney } from "@/lib/currency";

type PageProps = { params: Promise<{ id: string }> };

function json(v: unknown) {
  return v ? JSON.stringify(v, null, 2) : null;
}

export default async function AdminRentalBookingDetailPage({ params }: PageProps) {
  await requireAdminSession();
  const { id } = await params;
  const data = await getAdminBookingDetail(id);
  if (!data) notFound();
  const { booking: b, activity, overdue } = data;

  return (
    <AdminDetailShell
      backHref="/admin/rentals?tab=bookings"
      backLabel="All rental bookings"
      title={b.listing.name}
      subtitle={`Booking ${b.id}${overdue ? " · OVERDUE" : ""}`}
      status={b.status}
      actions={
        <Link href={`/admin/rentals/listings/${b.listing.id}`} className="text-sm text-primary hover:underline">
          View listing →
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel title="Rental">
          <AdminKeyValue
            items={[
              { label: "Period", value: `${fmtDate(b.startDate)} → ${fmtDate(b.endDate)}` },
              { label: "Quantity", value: b.quantity },
              { label: "Handover", value: humanize(b.pickupOrDelivery) },
              { label: "Preferred location", value: b.preferredLocation ?? "—" },
              { label: "Estimated total", value: formatMoney(b.estimatedTotal) },
              { label: "Deposit", value: formatMoney(b.depositAmount) },
              { label: "Payment status", value: humanize(b.paymentStatus) },
              { label: "Payment ref", value: b.paymentRef ?? "—" },
              { label: "Operator required", value: b.operatorRequired ? "Yes" : "No" },
              { label: "Extension requested", value: b.extensionRequested ? "Yes" : "No" },
              { label: "Owner handover ack", value: b.ownerHandoverAck ? "Yes" : "No" },
              { label: "Customer handover ack", value: b.customerHandoverAck ? "Yes" : "No" },
              { label: "Intended usage", value: b.intendedUsage ?? "—" },
              { label: "Special requirements", value: b.specialRequirements ?? "—" },
            ]}
          />
        </DashboardPanel>

        <div className="space-y-4">
          <DashboardPanel title="Parties">
            <AdminKeyValue
              items={[
                {
                  label: "Customer",
                  value: (
                    <Link className="text-primary hover:underline" href={`/admin/users/${b.customerUser.id}`}>
                      {personLabel(b.customerUser)}
                    </Link>
                  ),
                },
                { label: "Customer HC ID", value: b.customerProfile.hcId },
                {
                  label: "Owner",
                  value: (
                    <Link className="text-primary hover:underline" href={`/admin/users/${b.listing.owner.user.id}`}>
                      {b.listing.owner.businessName || b.listing.owner.fullName || personLabel(b.listing.owner.user)}
                    </Link>
                  ),
                },
                { label: "Owner HC ID", value: b.listing.owner.hcId },
              ]}
            />
          </DashboardPanel>
          <DashboardPanel title="Manage status">
            <BookingStatusControl bookingId={b.id} status={b.status} />
          </DashboardPanel>
        </div>
      </div>

      <DashboardPanel title={`Disputes (${b.disputes.length})`}>
        {b.disputes.length === 0 ? (
          <AdminEmpty>No disputes on this booking.</AdminEmpty>
        ) : (
          <ul className="divide-y divide-border/50 text-sm">
            {b.disputes.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium capitalize">{humanize(d.type)}</p>
                  <p className="line-clamp-2 max-w-xl text-xs text-muted-foreground">{d.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {personLabel(d.openedBy)} · {fmtDate(d.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <AdminStatusBadge status={d.status} />
                  <Link href={`/admin/rentals/disputes/${d.id}`} className="text-xs text-primary hover:underline">
                    Review →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel title="Handover record">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
            {json(b.handoverJson) ?? "No handover recorded."}
          </pre>
        </DashboardPanel>
        <DashboardPanel title="Return record">
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
            {json(b.returnJson) ?? "No return recorded."}
          </pre>
        </DashboardPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPanel title={`Reminders (${b.reminders.length})`}>
          {b.reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">None sent.</p>
          ) : (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {b.reminders.map((r) => (
                <li key={r.id}>
                  {fmtDateTime(r.sentAt)} · {humanize(r.kind)}
                </li>
              ))}
            </ul>
          )}
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
      </div>
    </AdminDetailShell>
  );
}
