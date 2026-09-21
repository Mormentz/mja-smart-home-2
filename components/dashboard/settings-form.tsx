"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions/auth";
import { roleLabel } from "@/lib/auth/role-labels";
import type { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SettingsForm({
  name,
  email,
  role,
}: {
  name: string | null | undefined;
  email: string | null | undefined;
  role: Role;
}) {
  const [displayName, setDisplayName] = useState(name ?? "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile({ name: displayName });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-6 space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email ?? ""} disabled />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Input value={roleLabel(role)} disabled />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
