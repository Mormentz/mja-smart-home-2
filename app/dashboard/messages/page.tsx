import { requireAuth } from "@/lib/auth/roles";
import { getConversations } from "@/lib/actions/messages";
import { ConversationInbox } from "@/components/dashboard/message-thread";
import { DashboardSection } from "@/components/dashboard/dashboard-section";

export default async function MessagesPage() {
  const session = await requireAuth();
  const conversations = await getConversations();

  return (
    <DashboardSection title="Messages" description="Threaded conversations with agents, landlords, and clients.">
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <ConversationInbox conversations={conversations} currentUserId={session.user.id} />
      </div>
    </DashboardSection>
  );
}
