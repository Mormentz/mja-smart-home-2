"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function AdminFilterBar({
  searchPlaceholder = "Search…",
  searchParam = "q",
  chips,
  chipParam = "role",
  hideSearch = false,
}: {
  searchPlaceholder?: string;
  searchParam?: string;
  chips?: { id: string; label: string }[];
  chipParam?: string;
  hideSearch?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();
  const q = searchParams.get(searchParam) ?? "";
  const activeChip = searchParams.get(chipParam) ?? "";

  function update(key: string, value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    start(() => router.push(`${pathname}?${sp.toString()}`));
  }

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", pending && "opacity-70")}>
      {!hideSearch && (
      <div className="relative min-w-0 flex-1">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          defaultValue={q}
          placeholder={searchPlaceholder}
          className="h-9 pl-8"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              update(searchParam, (e.target as HTMLInputElement).value.trim());
            }
          }}
        />
      </div>
      )}
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => update(chipParam, "")}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition",
              !activeChip ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            All
          </button>
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => update(chipParam, c.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                activeChip === c.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
