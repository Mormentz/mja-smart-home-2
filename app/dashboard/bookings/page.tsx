import { requireRole } from "@/lib/auth/roles";
import { getOwnerBookings, getUserBookings } from "@/lib/actions/bookings";
import { BookingList } from "@/components/dashboard/booking-list";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function BookingsPage() {
  const session = await requireRole(["RENTER", "BUYER", "LANDLORD", "AGENT"]);
  const isOwner = session.user.role === "LANDLORD" || session.user.role === "AGENT";
  const bookings = isOwner ? await getOwnerBookings() : await getUserBookings();

  return (
    <DashboardSection
      title={isOwner ? "Tour requests" : "My bookings"}
      description={isOwner ? "Review and respond to tour booking requests." : "Track your property tour requests."}
    >
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <BookingList bookings={bookings} isOwner={isOwner} />
      </div>
    </DashboardSection>
  );
}
