import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type HomeConnectLogoProps = {
  href?: string | null;
  /** full = mark + wordmark; mark = icon only */
  variant?: "full" | "mark";
  /** Use light wordmark on dark surfaces */
  onDark?: boolean;
  className?: string;
  /** Height in px for the rendered logo */
  height?: number;
  priority?: boolean;
};

const FULL_ASPECT = 609 / 142;
const MARK_ASPECT = 1;

export function HomeConnectLogo({
  href = "/",
  variant = "full",
  onDark = false,
  className,
  height = 32,
  priority = false,
}: HomeConnectLogoProps) {
  const isMark = variant === "mark";
  const src = isMark
    ? "/brand/homeconnect-mark.png"
    : onDark
      ? "/brand/homeconnect-logo-light.png"
      : "/brand/homeconnect-logo.png";
  const aspect = isMark ? MARK_ASPECT : FULL_ASPECT;
  const width = Math.round(height * aspect);

  const img = (
    <Image
      src={src}
      alt="HomeConnect"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height, width: "auto" }}
    />
  );

  if (href === null) {
    return img;
  }

  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="HomeConnect home">
      {img}
    </Link>
  );
}
