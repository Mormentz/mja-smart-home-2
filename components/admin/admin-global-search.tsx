"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminGlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();

  function go(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    start(() => router.push(`/admin/users?q=${encodeURIComponent(query)}`));
  }

  return (
    <form onSubmit={go} className="relative hidden max-w-xs flex-1 md:block">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search users…"
        className="h-9 pl-8"
        disabled={pending}
      />
    </form>
  );
}
