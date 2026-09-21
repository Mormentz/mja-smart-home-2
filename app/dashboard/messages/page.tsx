import { requireAuth } from "@/lib/auth/roles";
import { getUserMessages } from "@/lib/actions/messages";
import { MessageList } from "@/components/dashboard/message-thread";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function MessagesPage() {
  const session = await requireAuth();
  const messages = await getUserMessages();

  return (
    <DashboardSection title="Messages" description="Your conversations with agents, landlords, and clients.">
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <MessageList messages={messages} currentUserId={session.user.id} />
      </div>
    </DashboardSection>
  );
}
