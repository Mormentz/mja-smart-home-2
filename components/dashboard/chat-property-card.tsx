"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { imageSrc, resolveImage } from "@/lib/properties";
import { cn } from "@/lib/utils";

export function ChatPropertyCard({
  property,
  compact,
  className,
  interactive = true,
}: {
  property: {
    id: string;
    title: string;
    location: string;
    price: number;
    currency: string;
    type: string;
    image: string;
  };
  compact?: boolean;
  className?: string;
  /** When false, renders a static card (e.g. inside a picker button). */
  interactive?: boolean;
}) {
  const typeLabel = property.type === "FOR_RENT" || property.type === "For Rent" ? "For Rent" : "For Sale";
  const body = (
    <div className={cn("flex gap-3", compact ? "p-2" : "p-2.5")}>
      <img
        src={imageSrc(resolveImage(property.image))}
        alt=""
        className={cn("rounded-lg object-cover shrink-0", compact ? "h-14 w-14" : "h-16 w-16")}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{property.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{property.location}</p>
        <p className="mt-1 text-xs font-medium text-primary">
          {property.currency}
          {property.price.toLocaleString()}
          {typeLabel === "For Rent" ? "/mo" : ""}
          <span className="ml-1.5 font-normal text-muted-foreground">· {typeLabel}</span>
        </p>
      </div>
      {interactive && (
        <ExternalLink size={14} className="mt-1 shrink-0 text-muted-foreground" />
      )}
    </div>
  );

  const shell = cn(
    "block min-w-0 max-w-full overflow-hidden rounded-xl border border-border/70 bg-card text-left shadow-sm",
    interactive && "transition hover:border-primary/40 hover:shadow-md",
    className,
  );

  if (!interactive) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <Link href={`/properties/${property.id}`} className={shell}>
      {body}
    </Link>
  );
}
