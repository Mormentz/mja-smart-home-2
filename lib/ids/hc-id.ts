export type HcKind = "JOB" | "EMP" | "OWN" | "RENT" | "EQC";

export function formatHcId(kind: HcKind, stateCode: string, sequence: number): string {
  const state = (stateCode || "NG").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "NG";
  const seq = String(Math.max(0, Math.floor(sequence))).padStart(6, "0");
  return `HC-${kind}-${state}-${seq}`;
}

export function nextHcSequence(currentMax: number): number {
  return Math.max(0, Math.floor(currentMax)) + 1;
}

/** Map common Nigerian state names/codes to short HC region codes. */
export function stateToHcRegion(stateCodeOrName: string | null | undefined): string {
  const raw = (stateCodeOrName ?? "NG").trim().toUpperCase();
  if (raw === "FCT" || raw === "ABUJA" || raw.includes("FEDERAL CAPITAL")) return "ABJ";
  if (raw.length <= 3) return raw;
  return raw.slice(0, 3);
}
