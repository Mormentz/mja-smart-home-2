"use client";

import { useState } from "react";
import { updateServiceProfile } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ServiceProfileFormProps = {
  profile: { trade: string; bio: string; verified: boolean } | null;
};

export function ServiceProfileForm({ profile }: ServiceProfileFormProps) {
  const [trade, setTrade] = useState(profile?.trade ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await updateServiceProfile({ trade, bio });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-border bg-card p-6 space-y-4 max-w-2xl">
      {profile?.verified && (
        <p className="text-sm text-success font-medium">Verified artisan profile</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="trade">Trade / specialty</Label>
        <Input id="trade" value={trade} onChange={(e) => setTrade(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} required />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
