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
    <div className="min-w-0 space-y-3 overflow-x-hidden lg:space-y-4">
      {showToolbar ? (
        <DashboardPageToolbar title={title} />
      ) : (
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">{description}</p>
          )}
        </div>
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
