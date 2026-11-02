import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function KycRequiredBanner({
  href = "/dashboard/kyc",
  requiredTier = 1,
  className,
}: {
  href?: string;
  requiredTier?: number;
  className?: string;
}) {
  const label =
    requiredTier >= 3
      ? "Complete Tier 3 (Enhanced) KYC to unlock this feature."
      : "Complete Tier 1 KYC verification to continue.";

  return (
    <div
      className={`mb-4 flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${className ?? ""}`}
    >
      <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-700" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-amber-900/80">
          Verification protects buyers, renters, and professionals on HomeConnect.
        </p>
        <Link href={href} className="mt-2 inline-block text-xs font-semibold underline">
          Continue KYC →
        </Link>
      </div>
    </div>
  );
}
