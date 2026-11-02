import { requireRole } from "@/lib/auth/roles";
import { getAgentWallet, requestWithdrawal, saveBankAccount } from "@/lib/actions/wallet";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { AgentWalletPanel } from "@/components/dashboard/agent-wallet-panel";

export default async function AgentWalletPage() {
  await requireRole(["AGENT"]);
  const data = await getAgentWallet();

  return (
    <DashboardSection
      title="Wallet & withdrawals"
      description="Rent escrow credits appear here after dual handover confirmation. Request payouts to your bank."
    >
      <AgentWalletPanel
        data={data}
        saveBank={saveBankAccount}
        requestWithdraw={requestWithdrawal}
      />
    </DashboardSection>
  );
}
