"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ variant = "button" }: { variant?: "button" | "menu" }) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    if (pending) return;
    setPending(true);
    try {
      await signOut({ callbackUrl: "/" });
    } finally {
      setPending(false);
    }
  }

  if (variant === "menu") {
    return (
      <button
        type="button"
        className="flex w-full items-center gap-2 text-sm"
        disabled={pending}
        onClick={() => void handleSignOut()}
      >
        <LogOut size={16} />
        {pending ? "Signing out…" : "Sign out"}
      </button>
    );
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => void handleSignOut()}>
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
