import type { Role } from "@prisma/client";
import { Calendar, Home, MessageSquare, Wrench } from "lucide-react";

type StatsCardsProps = {
  role: Role;
  stats: {
    bookings: number;
    listings: number;
    messages: number;
    pendingBookings: number;
  };
};

export function StatsCards({ role, stats }: StatsCardsProps) {
  const cards = getCardsForRole(role, stats);

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3 text-muted-foreground">
            {card.icon}
            <span className="text-sm">{card.label}</span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function getCardsForRole(role: Role, stats: StatsCardsProps["stats"]) {
  switch (role) {
    case "RENTER":
    case "BUYER":
      return [
        { label: "My bookings", value: stats.bookings, icon: <Calendar size={18} /> },
        { label: "Unread messages", value: stats.messages, icon: <MessageSquare size={18} /> },
      ];
    case "LANDLORD":
    case "AGENT":
      return [
        { label: "Active listings", value: stats.listings, icon: <Home size={18} /> },
        { label: "Pending tours", value: stats.pendingBookings, icon: <Calendar size={18} /> },
        { label: "Unread messages", value: stats.messages, icon: <MessageSquare size={18} /> },
      ];
    case "ARTISAN":
      return [
        { label: "Unread messages", value: stats.messages, icon: <MessageSquare size={18} /> },
        { label: "Service profile", value: "Active", icon: <Wrench size={18} /> },
      ];
    default:
      return [];
  }
}
