import Link from "next/link";
import { Suspense } from "react";
import { requireAdminSession } from "@/lib/auth/admin";
import { getAdminSecurityData, listAdminAuditLog } from "@/lib/actions/admin-security";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { AdminPrivacyActions } from "@/components/dashboard/admin-privacy-actions";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminEmpty } from "@/components/admin/admin-stat-card";
import { ClosePrivacyRequestButton, ResolveFlagButton } from "@/components/admin/admin-security-actions";
import { fmtDateTime, personLabel } from "@/components/admin/admin-format";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminSecurityPage({ searchParams }: PageProps) {
  await requireAdminSession();
  const sp = (await searchParams) ?? {};
  const tab = one(sp.tab) || "flags";
  const q = one(sp.q)?.trim();
  const entity = one(sp.entity)?.trim();
  const state = one(sp.state)?.trim();

  const [security, audit] = await Promise.all([
    getAdminSecurityData({ flagStatus: state, privacyStatus: state }),
    tab === "audit"
      ? listAdminAuditLog({ q, entity, action: one(sp.action)?.trim(), take: 150 })
      : Promise.resolve(null),
  ]);

  const counts = security?.counts ?? { openFlags: 0, openPrivacy: 0 };

  return (
    <DashboardSection
      title="Security & NDPA"
      description="Anti-fraud flags, privacy requests, and the admin audit trail. Admins should use MFA at the identity provider / hosting layer."
    >
      <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        NDPA 2023 checklist: TLS, hashed passwords (Auth.js), role-based admin routes, audit logs, retention via
        privacy deletion, encrypted transport. Complete a formal DPIA before production launch of Jobs/Rentals.
      </div>

      <Suspense fallback={null}>
        <AdminTabs
          defaultTab="flags"
          tabs={[
            { id: "flags", label: "Suspicious activity", count: counts.openFlags },
            { id: "privacy", label: "Privacy requests", count: counts.openPrivacy },
            { id: "audit", label: "Audit log" },
          ]}
        />
      </Suspense>

      <div className="mt-4 space-y-4">
        {tab === "flags" && (
          <>
            <Suspense fallback={null}>
              <AdminFilterBar
                hideSearch
                chipParam="state"
                chips={[
                  { id: "resolved", label: "Resolved" },
                  { id: "all", label: "All" },
                ]}
              />
            </Suspense>
            {!security || security.flags.length === 0 ? (
              <AdminEmpty>No flagged accounts in this view.</AdminEmpty>
            ) : (
              <ul className="space-y-2">
                {security.flags.map((f) => (
                  <li key={f.id} className="rounded-xl border border-border/60 bg-card p-3.5 text-sm shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/admin/users/${f.user.id}`} className="font-medium hover:underline">
                            {personLabel(f.user)}
                          </Link>
                          <AdminStatusBadge status={f.resolved ? "RESOLVED" : "OPEN"} />
                          {!f.user.active && <AdminStatusBadge status="SUSPENDED" />}
                        </div>
                        <p>{f.reason}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {f.user.email} · {fmtDateTime(f.createdAt)}
                        </p>
                      </div>
                      {!f.resolved && <ResolveFlagButton flagId={f.id} />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "privacy" && (
          <>
            <Suspense fallback={null}>
              <AdminFilterBar
                hideSearch
                chipParam="state"
                chips={[
                  { id: "closed", label: "Closed" },
                  { id: "all", label: "All" },
                ]}
              />
            </Suspense>
            {!security || security.privacy.length === 0 ? (
              <AdminEmpty>No privacy requests in this view.</AdminEmpty>
            ) : (
              <ul className="space-y-2">
                {security.privacy.map((p) => (
                  <li key={p.id} className="rounded-xl border border-border/60 bg-card p-3.5 text-sm shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium capitalize">{p.kind.toLowerCase()} request</span>
                          <AdminStatusBadge status={p.status} />
                        </div>
                        <p className="text-xs">
                          <Link href={`/admin/users/${p.user.id}`} className="hover:underline">
                            {personLabel(p.user)}
                          </Link>{" "}
                          · {fmtDateTime(p.createdAt)}
                          {p.closedAt ? ` · closed ${fmtDateTime(p.closedAt)}` : ""}
                        </p>
                        {p.note && <p className="whitespace-pre-wrap text-xs text-muted-foreground">{p.note}</p>}
                      </div>
                      {p.status === "OPEN" &&
                        (p.kind === "DELETION" ? (
                          <AdminPrivacyActions userId={p.userId} />
                        ) : (
                          <ClosePrivacyRequestButton requestId={p.id} kind={p.kind} />
                        ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {tab === "audit" && (
          <>
            <Suspense fallback={null}>
              <AdminFilterBar
                searchPlaceholder="Search action, entity, ID, actor email…"
                chipParam="entity"
                chips={(audit?.entities ?? []).map((e) => ({ id: e, label: e }))}
              />
            </Suspense>
            {!audit || audit.entries.length === 0 ? (
              <AdminEmpty>No audit entries match.</AdminEmpty>
            ) : (
              <div className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60 bg-card">
                {audit.entries.map((a) => (
                  <div key={a.id} className="px-4 py-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono font-semibold">{a.action}</span>
                      {a.entity && (
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                          {a.entity}
                          {a.entityId ? `/${a.entityId.slice(0, 12)}` : ""}
                        </span>
                      )}
                      <span className="text-muted-foreground">{fmtDateTime(a.createdAt)}</span>
                      <span className="text-muted-foreground">
                        {a.actor ? personLabel(a.actor) : a.actorId ? a.actorId.slice(0, 8) : "system"}
                      </span>
                    </div>
                    {a.meta != null && typeof a.meta === "object" && Object.keys(a.meta).length > 0 && (
                      <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                        {JSON.stringify(a.meta)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardSection>
  );
}
