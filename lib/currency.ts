/** HomeConnect is Naira-first (NGN). */

export const CURRENCY_CODE = "NGN";
export const CURRENCY_SYMBOL = "₦";

/** Normalize legacy "$" / "USD" records to Naira for display. */
export function resolveCurrencySymbol(currency?: string | null) {
  if (!currency || currency === "$" || currency.toUpperCase() === "USD") {
    return CURRENCY_SYMBOL;
  }
  if (currency === "NGN" || currency === "Naira") return CURRENCY_SYMBOL;
  return currency;
}

export function formatMoney(
  amount: number | null | undefined,
  opts?: { currency?: string | null; compact?: boolean },
) {
  const value = Number(amount ?? 0);
  const symbol = resolveCurrencySymbol(opts?.currency);
  const formatted = value.toLocaleString("en-NG", {
    maximumFractionDigits: opts?.compact ? 0 : value % 1 === 0 ? 0 : 2,
  });
  return `${symbol}${formatted}`;
}

export function formatMoneyPerHour(
  amount: number | null | undefined,
  opts?: { currency?: string | null },
) {
  return `${formatMoney(amount, opts)}/hr`;
}
