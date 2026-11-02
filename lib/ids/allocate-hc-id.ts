"use server";

import { prisma } from "@/lib/prisma";
import { formatHcId, stateToHcRegion, type HcKind } from "@/lib/ids/hc-id";

export async function allocateHcId(kind: HcKind, stateCode?: string | null): Promise<string> {
  const region = stateToHcRegion(stateCode);
  const row = await prisma.hcIdCounter.upsert({
    where: { kind_region: { kind, region } },
    create: { kind, region, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  return formatHcId(kind, region, row.lastSeq);
}
