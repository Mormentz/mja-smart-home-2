import Link from "next/link";

export function AuthBrand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 mb-10 lg:mb-14">
      <span className="grid place-items-center w-8 h-8 rounded-lg bg-ink text-ink-foreground">
        <span className="w-2.5 h-2.5 rounded-sm bg-ink-foreground rotate-45" />
      </span>
      <span className="font-display text-base font-bold tracking-[0.2em] uppercase text-ink">HomeConnect</span>
    </Link>
  );
}
