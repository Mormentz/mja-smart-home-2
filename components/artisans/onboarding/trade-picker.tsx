"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export type TaxonomyOption = {
  id: string;
  slug: string;
  name: string;
  isPrimary: boolean;
  subcategories: { id: string; name: string; slug: string }[];
};

export function TradePicker({
  categories,
  selected,
  onChange,
}: {
  categories: TaxonomyOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        subcategories: c.subcategories.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.slug.includes(q),
        ),
      }))
      .filter((c) => c.subcategories.length > 0 || c.name.toLowerCase().includes(q));
  }, [categories, query]);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search trades (electrical, POP, borehole…)"
      />
      <p className="text-xs text-muted-foreground">{selected.length} selected</p>
      <div className="max-h-[420px] space-y-4 overflow-y-auto rounded-xl border border-border/70 p-3">
        {filtered.map((cat) => (
          <div key={cat.id}>
            <div className="mb-2 flex items-center gap-2">
              <p className="text-sm font-semibold">{cat.name}</p>
              {cat.isPrimary && (
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-medium text-ink">
                  Primary
                </span>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {cat.subcategories.map((sub) => {
                const checked = selectedSet.has(sub.id);
                return (
                  <label
                    key={sub.id}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                      checked ? "border-ink bg-muted/60" : "border-border/70"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(sub.id)}
                      className="mt-0.5"
                    />
                    <span>{sub.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
