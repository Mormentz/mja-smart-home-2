"use client";

import { useState } from "react";
import { setPropertyFeatured, upsertSiteContent } from "@/lib/actions/admin";
import { SITE_CONTENT_FIELDS } from "@/lib/admin/content-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { toast } from "sonner";

type PropOption = { id: string; title: string; featured: boolean };

export function AdminContentForm({
  values,
  properties,
}: {
  /** Current stored values by key (missing keys fall back to field defaults). */
  values: Record<string, string>;
  properties: PropOption[];
}) {
  const [state, setState] = useState<Record<string, string>>(() =>
    Object.fromEntries(SITE_CONTENT_FIELDS.map((f) => [f.key, values[f.key] ?? f.defaultValue])),
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [featured, setFeatured] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(properties.map((p) => [p.id, p.featured])),
  );
  const [filter, setFilter] = useState("");

  async function save(key: string, label: string) {
    setSaving(key);
    const result = await upsertSiteContent(key, state[key] ?? "");
    setSaving(null);
    if (result.error) toast.error(result.error);
    else toast.success(`${label} saved`);
  }

  async function toggleFeatured(id: string, next: boolean) {
    const result = await setPropertyFeatured(id, next);
    if (result.error) toast.error(result.error);
    else {
      setFeatured((f) => ({ ...f, [id]: next }));
      toast.success(next ? "Featured" : "Unfeatured");
    }
  }

  const shown = properties.filter((p) => p.title.toLowerCase().includes(filter.trim().toLowerCase()));
  const featuredCount = Object.values(featured).filter(Boolean).length;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-3">
        {SITE_CONTENT_FIELDS.map((f) => {
          const value = state[f.key] ?? "";
          const stored = values[f.key] ?? f.defaultValue;
          const dirty = value !== stored;
          return (
            <DashboardPanel key={f.key} title={f.label} description={f.description}>
              <div className="space-y-2">
                <Label htmlFor={`content-${f.key}`} className="sr-only">
                  {f.label}
                </Label>
                {f.multiline ? (
                  <Textarea
                    id={`content-${f.key}`}
                    rows={4}
                    maxLength={f.maxLength}
                    placeholder={f.placeholder}
                    value={value}
                    onChange={(e) => setState((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                ) : (
                  <Input
                    id={`content-${f.key}`}
                    maxLength={f.maxLength}
                    placeholder={f.placeholder}
                    value={value}
                    onChange={(e) => setState((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                )}
                <div className="flex items-center justify-between gap-2">
                  <Button size="sm" onClick={() => save(f.key, f.label)} disabled={saving === f.key || !dirty}>
                    {saving === f.key ? "Saving…" : "Save"}
                  </Button>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {value.length}/{f.maxLength}
                    {dirty ? " · unsaved" : ""}
                  </span>
                </div>
              </div>
            </DashboardPanel>
          );
        })}
      </div>

      <DashboardPanel
        title="Featured properties"
        description={`Toggle homes highlighted on the public site (${featuredCount} featured).`}
        className="h-fit lg:sticky lg:top-4"
      >
        <Input
          className="mb-2 h-8"
          placeholder="Filter properties…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <ul className="max-h-[480px] space-y-1.5 overflow-y-auto">
          {shown.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-2.5 py-1.5"
            >
              <span className="truncate text-sm">{p.title}</span>
              <Button
                size="sm"
                className="h-7 shrink-0 text-xs"
                variant={featured[p.id] ? "default" : "outline"}
                onClick={() => toggleFeatured(p.id, !featured[p.id])}
              >
                {featured[p.id] ? "Featured" : "Feature"}
              </Button>
            </li>
          ))}
          {shown.length === 0 && <li className="text-sm text-muted-foreground">No properties match.</li>}
        </ul>
      </DashboardPanel>
    </div>
  );
}
