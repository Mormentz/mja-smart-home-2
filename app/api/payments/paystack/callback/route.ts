import { NextRequest, NextResponse } from "next/server";
import { appBaseUrl } from "@/lib/email/smtp";
import { confirmEscrowPayment } from "@/lib/actions/leases";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const base = appBaseUrl();
  const reference = req.nextUrl.searchParams.get("reference")?.trim()
    || req.nextUrl.searchParams.get("trxref")?.trim();
  const leaseIdParam = req.nextUrl.searchParams.get("leaseId")?.trim();

  if (!reference) {
    return NextResponse.redirect(`${base}/dashboard/leases?pay=missing`);
  }

  const result = await confirmEscrowPayment(reference);
  if (result.error) {
    return NextResponse.redirect(
      `${base}/dashboard/leases?pay=failed&reason=${encodeURIComponent(result.error)}`,
    );
  }

  let propertyId: string | null = null;
  const leaseId = result.leaseId || leaseIdParam;
  if (leaseId) {
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      select: { propertyId: true },
    });
    propertyId = lease?.propertyId ?? null;
  }

  if (propertyId) {
    return NextResponse.redirect(`${base}/properties/${propertyId}?escrow=secured`);
  }
  return NextResponse.redirect(`${base}/dashboard/leases?pay=success`);
}
