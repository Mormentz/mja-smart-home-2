import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ADMIN_SESSION_COOKIE } from "@/admin-auth.config";

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");
  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  const consumerToken = await getToken({
    req,
    secret,
    cookieName: "hc-session",
  });

  const adminToken = await getToken({
    req,
    secret,
    cookieName: ADMIN_SESSION_COOKIE,
  });

  // Legacy admin paths → /admin
  if (pathname === "/dashboard/admin" || pathname.startsWith("/dashboard/admin/")) {
    const dest = pathname.replace(/^\/dashboard\/admin/, "/admin") || "/admin";
    return withSecurityHeaders(NextResponse.redirect(new URL(dest + req.nextUrl.search, req.url)));
  }

  const isAdminLogin = pathname === "/admin/login";
  const isAdminApp = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/auth");
  const isDashboard = pathname.startsWith("/dashboard");

  if ((isAdminApp && !isAdminLogin) || isAdminApi) {
    if (!adminToken || adminToken.role !== "ADMIN") {
      if (isAdminApi) {
        return withSecurityHeaders(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        );
      }
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  if (isAdminLogin && adminToken?.role === "ADMIN") {
    return withSecurityHeaders(NextResponse.redirect(new URL("/admin", req.url)));
  }

  if (isDashboard) {
    if (!consumerToken?.sub) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
    if (consumerToken.role === "ADMIN") {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin", req.url)));
    }
    if (consumerToken.emailVerified === false) {
      const verifyUrl = new URL("/login", req.url);
      verifyUrl.searchParams.set("verify", "1");
      if (typeof consumerToken.email === "string") {
        verifyUrl.searchParams.set("email", consumerToken.email);
      }
      return withSecurityHeaders(NextResponse.redirect(verifyUrl));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/admin/:path*"],
};
