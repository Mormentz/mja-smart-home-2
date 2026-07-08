import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PropertyNotFound() {
  return (
    <div className="min-h-screen grid place-items-center text-center px-6 bg-background">
      <div>
        <h1 className="font-display text-4xl font-semibold">Property not found</h1>
        <p className="mt-3 text-muted-foreground">The home you&apos;re looking for isn&apos;t listed.</p>
        <Link href="/properties" className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground">
          <ArrowLeft size={16} /> Back to Properties
        </Link>
      </div>
    </div>
  );
}
