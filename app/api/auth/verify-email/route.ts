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

  const loginPath = user.role === "ADMIN" ? "/admin/login" : "/login";
  const params = new URLSearchParams({
    verified: "1",
    email: user.email,
  });

  return NextResponse.redirect(`${base}${loginPath}?${params.toString()}`);
}
