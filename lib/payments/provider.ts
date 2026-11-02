/**
 * Paystack payment adapter for escrow holds.
 * Secret key stays server-side only (PAYSTACK_SECRET_KEY).
 */

export type PaymentHoldInput = {
  amount: number;
  reference: string;
  email: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
};

export type PaymentHoldResult = {
  provider: "paystack";
  reference: string;
  status: "PENDING" | "FAILED";
  authorizationUrl?: string;
  accessCode?: string;
  message?: string;
};

export type PaymentVerifyResult = {
  provider: "paystack";
  reference: string;
  status: "HELD" | "FAILED" | "PENDING";
  amount?: number;
  paidAt?: string;
  message?: string;
};

function secretKey() {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || "";
}

export function isPaystackConfigured() {
  return Boolean(secretKey());
}

export function paystackPublicKey() {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() || "";
}

/** Paystack expects amount in the smallest currency unit (kobo for NGN). */
export function toPaystackAmount(naira: number) {
  return Math.round(naira * 100);
}

export async function createPaymentHold(input: PaymentHoldInput): Promise<PaymentHoldResult> {
  const key = secretKey();
  if (!key) {
    return {
      provider: "paystack",
      reference: input.reference,
      status: "FAILED",
      message: "Paystack is not configured",
    };
  }
  if (input.amount <= 0) {
    return { provider: "paystack", reference: input.reference, status: "FAILED", message: "Invalid amount" };
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: toPaystackAmount(input.amount),
      reference: input.reference,
      callback_url: input.callbackUrl,
      currency: "NGN",
      metadata: input.metadata ?? {},
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; access_code?: string; reference?: string };
  } | null;

  if (!res.ok || !json?.status || !json.data?.authorization_url) {
    return {
      provider: "paystack",
      reference: input.reference,
      status: "FAILED",
      message: json?.message || `Paystack initialize failed (${res.status})`,
    };
  }

  return {
    provider: "paystack",
    reference: json.data.reference || input.reference,
    status: "PENDING",
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
  };
}

export async function verifyPayment(reference: string): Promise<PaymentVerifyResult> {
  const key = secretKey();
  if (!key) {
    return { provider: "paystack", reference, status: "FAILED", message: "Paystack is not configured" };
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });

  const json = (await res.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: {
      status?: string;
      amount?: number;
      paid_at?: string;
      reference?: string;
    };
  } | null;

  if (!res.ok || !json?.status || !json.data) {
    return {
      provider: "paystack",
      reference,
      status: "FAILED",
      message: json?.message || `Paystack verify failed (${res.status})`,
    };
  }

  const st = String(json.data.status || "").toLowerCase();
  if (st === "success") {
    return {
      provider: "paystack",
      reference: json.data.reference || reference,
      status: "HELD",
      amount: typeof json.data.amount === "number" ? json.data.amount / 100 : undefined,
      paidAt: json.data.paid_at,
    };
  }
  if (st === "abandoned" || st === "failed") {
    return { provider: "paystack", reference, status: "FAILED", message: json.message || st };
  }
  return { provider: "paystack", reference, status: "PENDING", message: st };
}

export async function releasePaymentHold(reference: string): Promise<{ status: "RELEASED" }> {
  // Escrow release to landlord is an internal ledger event for now.
  // Funds settlement can be wired to Paystack Transfer later.
  void reference;
  return { status: "RELEASED" };
}

export async function refundPaymentHold(reference: string, amountNaira?: number): Promise<{
  status: "REFUNDED" | "FAILED";
  message?: string;
}> {
  const key = secretKey();
  if (!key) return { status: "FAILED", message: "Paystack is not configured" };

  const body: Record<string, unknown> = { transaction: reference };
  if (amountNaira != null && amountNaira > 0) {
    body.amount = toPaystackAmount(amountNaira);
  }

  const res = await fetch("https://api.paystack.co/refund", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string } | null;
  if (!res.ok || !json?.status) {
    return { status: "FAILED", message: json?.message || `Refund failed (${res.status})` };
  }
  return { status: "REFUNDED" };
}
