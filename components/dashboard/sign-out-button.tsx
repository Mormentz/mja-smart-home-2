"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ variant = "button" }: { variant?: "button" | "menu" }) {
  if (variant === "menu") {
    return (
      <button
        type="button"
        className="flex w-full items-center gap-2 text-sm"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut size={16} />
        Sign out
      </button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
      Sign out
    </Button>
  );
}
