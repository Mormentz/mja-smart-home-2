"use server";

import { revalidatePath } from "next/cache";
import { WithdrawalStatus } from "@/generated/prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { getAdminSessionOrNull } from "@/lib/auth/admin";
import { writeAdminAudit } from "@/lib/admin/audit";
import { kycGateError, requireProTier3 } from "@/lib/auth/kyc-gate";
import { prisma } from "@/lib/prisma";
import { emitAdminNotification } from "@/lib/actions/admin-notifications";

async function getOrCreateWallet(userId: string) {
  return prisma.walletAccount.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function getAgentWallet() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "AGENT") return null;
  const account = await getOrCreateWallet(session.user.id);
  const [ledger, banks, withdrawals] = await Promise.all([
    prisma.walletLedgerEntry.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.bankAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.withdrawalRequest.findMany({
      where: { userId: session.user.id },
      include: { bankAccount: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);
  return { account, ledger, banks, withdrawals };
}

const bankSchema = z.object({
  bankName: z.string().min(2).max(80),
  accountName: z.string().min(2).max(120),
  accountNumber: z.string().regex(/^\d{10}$/, "Account number must be 10 digits"),
  bankCode: z.string().max(20).optional(),
});

export async function saveBankAccount(data: z.infer<typeof bankSchema>) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "AGENT") return { error: "Unauthorized" };
  const kyc = await requireProTier3(session.user.id);
  if (!kyc.ok) return kycGateError(kyc);

  const parsed = bankSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid bank details" };

  await prisma.bankAccount.updateMany({
    where: { userId: session.user.id, isDefault: true },
    data: { isDefault: false },
  });

  await prisma.bankAccount.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
      bankCode: parsed.data.bankCode || null,
      isDefault: true,
    },
  });

  revalidatePath("/dashboard/wallet");
  return { success: true };
}

export async function requestWithdrawal(amount: number, bankAccountId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "AGENT") return { error: "Unauthorized" };
  const kyc = await requireProTier3(session.user.id);
  if (!kyc.ok) return kycGateError(kyc);

  const amt = Math.round(Number(amount));
  if (!Number.isFinite(amt) || amt < 1000) return { error: "Minimum withdrawal is ₦1,000" };

  const bank = await prisma.bankAccount.findFirst({
    where: { id: bankAccountId, userId: session.user.id },
  });
  if (!bank) return { error: "Bank account not found" };

  const account = await getOrCreateWallet(session.user.id);
  if (account.availableBalance < amt) return { error: "Insufficient wallet balance" };

  await prisma.$transaction([
    prisma.walletAccount.update({
      where: { id: account.id },
      data: {
        availableBalance: { decrement: amt },
        pendingWithdrawal: { increment: amt },
      },
    }),
    prisma.withdrawalRequest.create({
      data: {
        userId: session.user.id,
        bankAccountId: bank.id,
        amount: amt,
        status: WithdrawalStatus.PENDING,
      },
    }),
  ]);

  await emitAdminNotification({
    type: "WITHDRAWAL_PENDING",
    title: "Withdrawal request",
    body: `${session.user.email ?? session.user.id} requested ₦${amt.toLocaleString()}`,
    href: "/admin/withdrawals",
    entityType: "withdrawal",
    entityId: session.user.id,
    severity: "ACTION",
  });

  revalidatePath("/dashboard/wallet");
  revalidatePath("/admin/withdrawals");
  return { success: true };
}

export async function listAdminWithdrawals(status?: string) {
  const admin = await getAdminSessionOrNull();
  if (!admin) return [];
  const st =
    status && ["PENDING", "APPROVED", "REJECTED", "PAID"].includes(status)
      ? (status as WithdrawalStatus)
      : undefined;
  return prisma.withdrawalRequest.findMany({
    where: st ? { status: st } : undefined,
    include: {
      user: { select: { id: true, name: true, email: true } },
      bankAccount: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function decideWithdrawal(
  id: string,
  decision: "PAID" | "REJECTED",
  adminNote?: string,
) {
  const admin = await getAdminSessionOrNull();
  if (!admin) return { error: "Unauthorized" };

  const row = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!row || row.status !== WithdrawalStatus.PENDING) {
    return { error: "Request not found or already processed" };
  }

  const account = await getOrCreateWallet(row.userId);

  if (decision === "REJECTED") {
    await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: WithdrawalStatus.REJECTED,
          adminNote: adminNote ?? null,
          processedAt: new Date(),
        },
      }),
      prisma.walletAccount.update({
        where: { id: account.id },
        data: {
          availableBalance: { increment: row.amount },
          pendingWithdrawal: { decrement: row.amount },
        },
      }),
      prisma.walletLedgerEntry.create({
        data: {
          accountId: account.id,
          amount: row.amount,
          type: "WITHDRAWAL_REVERSAL",
          note: adminNote || "Withdrawal rejected — balance restored",
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.withdrawalRequest.update({
        where: { id },
        data: {
          status: WithdrawalStatus.PAID,
          adminNote: adminNote ?? null,
          processedAt: new Date(),
        },
      }),
      prisma.walletAccount.update({
        where: { id: account.id },
        data: { pendingWithdrawal: { decrement: row.amount } },
      }),
      prisma.walletLedgerEntry.create({
        data: {
          accountId: account.id,
          amount: -row.amount,
          type: "WITHDRAWAL",
          note: adminNote || "Withdrawal paid",
        },
      }),
    ]);
  }

  await writeAdminAudit({
    actorId: admin.user.id,
    action: `WITHDRAWAL_${decision}`,
    entity: "WithdrawalRequest",
    entityId: id,
    meta: { amount: row.amount, adminNote },
  });

  revalidatePath("/admin/withdrawals");
  revalidatePath("/dashboard/wallet");
  return { success: true };
}

/** Credit agent wallet after dual escrow confirmation. */
export async function creditWalletFromEscrow(opts: {
  agentUserId: string;
  amount: number;
  escrowPaymentId: string;
}) {
  const account = await getOrCreateWallet(opts.agentUserId);
  const existing = await prisma.walletLedgerEntry.findFirst({
    where: { escrowPaymentId: opts.escrowPaymentId, type: "CREDIT_ESCROW" },
  });
  if (existing) return { alreadyCredited: true as const };

  await prisma.$transaction([
    prisma.walletAccount.update({
      where: { id: account.id },
      data: { availableBalance: { increment: opts.amount } },
    }),
    prisma.walletLedgerEntry.create({
      data: {
        accountId: account.id,
        amount: opts.amount,
        type: "CREDIT_ESCROW",
        escrowPaymentId: opts.escrowPaymentId,
        note: "Rent escrow released after handover confirmation",
      },
    }),
  ]);
  return { success: true as const };
}
