import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="text-sm text-white/60">Loading…</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
