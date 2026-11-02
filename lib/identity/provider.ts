/**
 * Authorized identity verification provider integration (Phase 6).
 * Stores result + reference; avoids retaining full NIN when a result is sufficient.
 */

export type IdentityVerifyInput = {
  userId: string;
  documentType: "NIN" | "PASSPORT" | "DRIVERS_LICENCE" | "VOTERS_CARD";
  /** Full identifier — used for provider call only, not persisted by default. */
  documentNumber: string;
};

export type IdentityVerifyResult = {
  provider: string;
  referenceId: string;
  status: "VERIFIED" | "FAILED" | "PENDING";
};

export async function verifyIdentityWithProvider(
  input: IdentityVerifyInput,
): Promise<IdentityVerifyResult> {
  // Stub: replace with authorized provider SDK. Never log full document numbers.
  const referenceId = `idprv_${input.userId.slice(0, 8)}_${Date.now()}`;
  const ok = input.documentNumber.trim().length >= 5;
  return {
    provider: process.env.IDENTITY_PROVIDER ?? "homeconnect-admin-bridge",
    referenceId,
    status: ok ? "VERIFIED" : "FAILED",
  };
}

export function shouldRetainFullIdNumber(_result: IdentityVerifyResult): boolean {
  // When provider result is sufficient, do not retain full NIN/document number.
  return false;
}
