import { requireRole } from "@/lib/auth/roles";
import { getOwnerBookings, getUserBookings } from "@/lib/actions/bookings";
import { BookingList } from "@/components/dashboard/booking-list";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function BookingsPage() {
  const session = await requireRole(["USER", "AGENT"]);
  const isOwner = session.user.role === "AGENT";
  const bookings = isOwner ? await getOwnerBookings() : await getUserBookings();

  return (
    <DashboardSection
      title="Bookings"
      description={isOwner ? "Tour and purchase-interest requests on your listings." : "Your tour and purchase-interest requests."}
    >
      <BookingList bookings={bookings} isOwner={isOwner} />
    </DashboardSection>
  );
}
