import { requireAuth } from "@/lib/auth/roles";
import { getConversations } from "@/lib/actions/messages";
import { ConversationInbox } from "@/components/dashboard/message-thread";

export default async function MessagesPage() {
  const session = await requireAuth();
  const conversations = await getConversations();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 hidden shrink-0 lg:block">
        <h1 className="font-display text-xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Threaded conversations with agents, landlords, and clients.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <ConversationInbox
          conversations={conversations}
          currentUserId={session.user.id}
          role={session.user.role}
        />
      </div>
    </div>
  );
}
