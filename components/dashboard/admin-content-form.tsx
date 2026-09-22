"use client";

import { useState } from "react";
import { setPropertyFeatured, upsertSiteContent } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { toast } from "sonner";

type PropOption = { id: string; title: string; featured: boolean };

export function AdminContentForm({
  aboutBlurb,
  properties,
}: {
  aboutBlurb: string;
  properties: PropOption[];
}) {
  const [blurb, setBlurb] = useState(aboutBlurb);
  const [loading, setLoading] = useState(false);

  async function saveBlurb() {
    setLoading(true);
    const result = await upsertSiteContent("about_blurb", blurb);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("About blurb saved");
  }

  async function toggleFeatured(id: string, featured: boolean) {
    const result = await setPropertyFeatured(id, featured);
    if (result.error) toast.error(result.error);
    else toast.success(featured ? "Featured" : "Unfeatured");
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <DashboardPanel title="About blurb">
        <div className="space-y-3">
          <Label className="sr-only">About blurb</Label>
          <Textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} rows={5} />
          <Button size="sm" onClick={saveBlurb} disabled={loading}>
            {loading ? "Saving…" : "Save blurb"}
          </Button>
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Featured properties"
        description="Toggle homes highlighted on the public site."
      >
        <ul className="max-h-[320px] space-y-1.5 overflow-y-auto">
          {properties.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-2.5 py-1.5"
            >
              <span className="truncate text-sm">{p.title}</span>
              <Button
                size="sm"
                className="h-7 text-xs shrink-0"
                variant={p.featured ? "default" : "outline"}
                onClick={() => toggleFeatured(p.id, !p.featured)}
              >
                {p.featured ? "Featured" : "Feature"}
              </Button>
            </li>
          ))}
        </ul>
      </DashboardPanel>
    </div>
  );
}
