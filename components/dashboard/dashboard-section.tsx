import { DashboardPageToolbar } from "@/components/dashboard/dashboard-header";

export function DashboardSection({
  title,
  description,
  children,
  showToolbar = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  showToolbar?: boolean;
}) {
  return (
    <div className="space-y-6">
      {showToolbar ? (
        <DashboardPageToolbar title={title} />
      ) : (
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
