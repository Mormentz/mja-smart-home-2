"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SKILL_PROFICIENCY_LABELS,
  SKILL_PROFICIENCY_LEVELS,
  type SkillProficiencyLevel,
} from "@/lib/services/skill-proficiency";

export type TaxonomyOption = {
  id: string;
  slug: string;
  name: string;
  isPrimary: boolean;
  subcategories: { id: string; name: string; slug: string }[];
};

export type TradeSelection = {
  subcategoryId: string;
  proficiency: SkillProficiencyLevel;
};

export function TradePicker({
  categories,
  selected,
  onChange,
}: {
  categories: TaxonomyOption[];
  selected: TradeSelection[];
  onChange: (next: TradeSelection[]) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedMap = useMemo(
    () => new Map(selected.map((s) => [s.subcategoryId, s.proficiency])),
    [selected],
  );

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
    if (selectedMap.has(id)) {
      onChange(selected.filter((x) => x.subcategoryId !== id));
    } else {
      onChange([...selected, { subcategoryId: id, proficiency: "INTERMEDIATE" }]);
    }
  }

  function setProficiency(id: string, proficiency: SkillProficiencyLevel) {
    onChange(
      selected.map((s) => (s.subcategoryId === id ? { ...s, proficiency } : s)),
    );
  }

  return (
    <div className="space-y-3">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search trades (electrical, POP, borehole…)"
      />
      <p className="text-xs text-muted-foreground">
        {selected.length} selected — set proficiency for each skill
      </p>
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
                const checked = selectedMap.has(sub.id);
                const proficiency = selectedMap.get(sub.id) ?? "INTERMEDIATE";
                return (
                  <div
                    key={sub.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      checked ? "border-ink bg-muted/60" : "border-border/70"
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(sub.id)}
                        className="mt-0.5"
                      />
                      <span>{sub.name}</span>
                    </label>
                    {checked && (
                      <div className="mt-2 pl-6">
                        <label className="sr-only" htmlFor={`prof-${sub.id}`}>
                          Proficiency for {sub.name}
                        </label>
                        <select
                          id={`prof-${sub.id}`}
                          value={proficiency}
                          onChange={(e) =>
                            setProficiency(sub.id, e.target.value as SkillProficiencyLevel)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs"
                        >
                          {SKILL_PROFICIENCY_LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {SKILL_PROFICIENCY_LABELS[level]}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
