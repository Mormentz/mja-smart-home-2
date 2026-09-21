import { requireAuth } from "@/lib/auth/roles";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage() {
  const session = await requireAuth();
  const data = await getDashboardData(session.user.id, session.user.role, session.user.name);

  return <DashboardOverview data={data} />;
}
