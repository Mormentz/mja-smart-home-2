import { NextResponse } from "next/server";
import { getAdminSessionOrNull } from "@/lib/auth/admin";

/** Lightweight admin session probe — requires hc-admin cookie (also gated by proxy). */
export async function GET() {
  const session = await getAdminSessionOrNull();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    },
  });
}
