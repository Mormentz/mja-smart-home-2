export type RentalPriceInput = {
  start: Date;
  end: Date;
  hourlyPrice?: number | null;
  dailyPrice?: number | null;
  weeklyPrice?: number | null;
  monthlyPrice?: number | null;
  securityDeposit?: number | null;
  deliveryCharge?: number | null;
  pickupCharge?: number | null;
  operatorCharge?: number | null;
  pickupOrDelivery?: "PICKUP" | "DELIVERY";
  operatorRequired?: boolean;
  quantity?: number;
};

export type RentalPriceBreakdown = {
  rentalSubtotal: number;
  deliveryOrPickup: number;
  operator: number;
  deposit: number;
  estimatedTotal: number;
  billableHours: number;
};

function hoursBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
}

/** Pick the cheapest applicable rate band for the duration. */
export function estimateRentalTotal(input: RentalPriceInput): RentalPriceBreakdown {
  const qty = Math.max(1, input.quantity ?? 1);
  const hours = hoursBetween(input.start, input.end);
  const days = Math.ceil(hours / 24);
  const weeks = Math.ceil(days / 7);
  const months = Math.ceil(days / 30);

  const candidates: number[] = [];
  if (input.hourlyPrice != null) candidates.push(input.hourlyPrice * hours);
  if (input.dailyPrice != null) candidates.push(input.dailyPrice * days);
  if (input.weeklyPrice != null) candidates.push(input.weeklyPrice * weeks);
  if (input.monthlyPrice != null) candidates.push(input.monthlyPrice * months);
  const rentalSubtotal = (candidates.length ? Math.min(...candidates) : 0) * qty;

  const deliveryOrPickup =
    input.pickupOrDelivery === "DELIVERY"
      ? input.deliveryCharge ?? 0
      : input.pickupCharge ?? 0;
  const operator = input.operatorRequired ? input.operatorCharge ?? 0 : 0;
  const deposit = (input.securityDeposit ?? 0) * qty;
  const estimatedTotal = rentalSubtotal + deliveryOrPickup + operator + deposit;

  return { rentalSubtotal, deliveryOrPickup, operator, deposit, estimatedTotal, billableHours: hours };
}
