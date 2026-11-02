export const EQUIPMENT_CONDITIONS = [
  { value: "BRAND_NEW", label: "Brand new" },
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "REQUIRES_MAINTENANCE", label: "Requires maintenance" },
] as const;

export const RENTAL_DISPUTE_TYPES = [
  { value: "NOT_DELIVERED", label: "Equipment not delivered / handed over" },
  { value: "WRONG_EQUIPMENT", label: "Wrong equipment" },
  { value: "FAULTY", label: "Faulty or not working" },
  { value: "MISSING_ACCESSORIES", label: "Missing accessories" },
  { value: "DAMAGE", label: "Damage" },
  { value: "LATE_RETURN", label: "Late return" },
  { value: "PAYMENT", label: "Payment issue" },
  { value: "DEPOSIT", label: "Security deposit" },
  { value: "SUSPECTED_FRAUD", label: "Suspected fraud" },
  { value: "OTHER", label: "Other" },
] as const;

export type EquipmentConditionValue = (typeof EQUIPMENT_CONDITIONS)[number]["value"];
export type RentalDisputeTypeValue = (typeof RENTAL_DISPUTE_TYPES)[number]["value"];

export const OWNER_KINDS = ["INDIVIDUAL", "BUSINESS"] as const;
