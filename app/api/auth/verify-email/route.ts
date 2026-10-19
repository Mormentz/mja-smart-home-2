import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/email/smtp";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  const base = appBaseUrl();

  if (!token) {
    return NextResponse.redirect(`${base}/login?verified=missing`);
  }

  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: token },
  });

  if (!user) {
    return NextResponse.redirect(`${base}/login?verified=invalid`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
    },
  });

  const next =
    user.role === "ARTISAN"
      ? "/dashboard/onboarding/artisan?verified=1"
      : "/dashboard?verified=1";

  return NextResponse.redirect(`${base}${next}`);
}
