import Link from "next/link";
import type {
  listAdminApplications,
  listAdminEmployers,
  listAdminJobFlags,
  listAdminJobSeekers,
  listAdminVacancies,
} from "@/lib/actions/admin-jobs";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminJobFlagActions } from "@/components/admin/admin-job-flag-actions";
import {
  DashboardDataTable,
  DashboardTableCell,
  DashboardTableHead,
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "@/components/dashboard/dashboard-data-table";
import { Button } from "@/components/ui/button";

type Seekers = Awaited<ReturnType<typeof listAdminJobSeekers>>;
type Employers = Awaited<ReturnType<typeof listAdminEmployers>>;
type Vacancies = Awaited<ReturnType<typeof listAdminVacancies>>;
type Applications = Awaited<ReturnType<typeof listAdminApplications>>;
type Flags = Awaited<ReturnType<typeof listAdminJobFlags>>;

function Empty({ cols, text }: { cols: number; text: string }) {
  return (
    <TableRow>
      <DashboardTableCell colSpan={cols} className="py-8 text-center text-muted-foreground">
        {text}
      </DashboardTableCell>
    </TableRow>
  );
}

export function AdminSeekersList({ rows }: { rows: Seekers }) {
  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Seeker</DashboardTableHead>
            <DashboardTableHead>Category</DashboardTableHead>
            <DashboardTableHead>Identity</DashboardTableHead>
            <DashboardTableHead>Guarantor</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((s) => (
            <TableRow key={s.id} className="border-border/40">
              <DashboardTableCell>
                <Link href={`/admin/jobs/seekers/${s.id}`} className="font-medium hover:underline">
                  {s.fullName ?? s.user.name ?? s.user.email}
                </Link>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {s.hcId} · {s.email ?? s.user.email}
                </p>
              </DashboardTableCell>
              <DashboardTableCell>{s.primaryJobCategory ?? "—"}</DashboardTableCell>
              <DashboardTableCell>
                <div className="flex flex-wrap gap-1">
                  <AdminStatusBadge status={s.identityStatus} />
                  {s.profileHidden && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">Hidden</span>
                  )}
                </div>
              </DashboardTableCell>
              <DashboardTableCell>
                <AdminStatusBadge status={s.guarantorStatus} />
              </DashboardTableCell>
              <DashboardTableCell className="text-right">
                <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                  <Link href={`/admin/jobs/seekers/${s.id}`}>Manage</Link>
                </Button>
              </DashboardTableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <Empty cols={5} text="No job seekers found." />}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}

export function AdminEmployersList({ rows }: { rows: Employers }) {
  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Employer</DashboardTableHead>
            <DashboardTableHead>Kind</DashboardTableHead>
            <DashboardTableHead>Verification</DashboardTableHead>
            <DashboardTableHead className="text-right">Vacancies</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((e) => (
            <TableRow key={e.id} className="border-border/40">
              <DashboardTableCell>
                <Link href={`/admin/jobs/employers/${e.id}`} className="font-medium hover:underline">
                  {e.companyName || e.fullName || e.user.name || e.user.email}
                </Link>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {e.hcId} · {e.officialEmail ?? e.user.email}
                </p>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs capitalize">{e.kind.toLowerCase()}</DashboardTableCell>
              <DashboardTableCell>
                <AdminStatusBadge status={e.verificationStatus} />
              </DashboardTableCell>
              <DashboardTableCell className="text-right tabular-nums">{e._count.vacancies}</DashboardTableCell>
              <DashboardTableCell className="text-right">
                <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                  <Link href={`/admin/jobs/employers/${e.id}`}>Manage</Link>
                </Button>
              </DashboardTableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <Empty cols={5} text="No employers found." />}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}

export function AdminVacanciesList({ rows }: { rows: Vacancies }) {
  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Vacancy</DashboardTableHead>
            <DashboardTableHead>Employer</DashboardTableHead>
            <DashboardTableHead>Status</DashboardTableHead>
            <DashboardTableHead className="text-right">Applicants</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((v) => (
            <TableRow key={v.id} className="border-border/40">
              <DashboardTableCell>
                <Link href={`/admin/jobs/vacancies/${v.id}`} className="font-medium hover:underline">
                  {v.title}
                </Link>
                <p className="text-[11px] text-muted-foreground">
                  {[v.category, v.location].filter(Boolean).join(" · ") || "—"}
                </p>
              </DashboardTableCell>
              <DashboardTableCell>
                <Link href={`/admin/jobs/employers/${v.employer.id}`} className="text-xs hover:underline">
                  {v.employer.companyName || v.employer.fullName || v.employer.hcId}
                </Link>
              </DashboardTableCell>
              <DashboardTableCell>
                <AdminStatusBadge
                  status={v.pendingReview ? "PENDING" : v.published ? "ACTIVE" : "CLOSED"}
                />
              </DashboardTableCell>
              <DashboardTableCell className="text-right tabular-nums">{v._count.applications}</DashboardTableCell>
              <DashboardTableCell className="text-right">
                <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                  <Link href={`/admin/jobs/vacancies/${v.id}`}>{v.pendingReview ? "Review" : "Manage"}</Link>
                </Button>
              </DashboardTableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <Empty cols={5} text="No vacancies found." />}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}

export function AdminApplicationsList({ rows }: { rows: Applications }) {
  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Applicant</DashboardTableHead>
            <DashboardTableHead>Vacancy</DashboardTableHead>
            <DashboardTableHead>Employer</DashboardTableHead>
            <DashboardTableHead>Applied</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
            <TableRow key={a.id} className="border-border/40">
              <DashboardTableCell>
                <Link href={`/admin/jobs/seekers/${a.seekerProfile.id}`} className="font-medium hover:underline">
                  {a.seekerProfile.fullName ?? a.seekerProfile.hcId}
                </Link>
                <p className="font-mono text-[11px] text-muted-foreground">{a.seekerProfile.hcId}</p>
              </DashboardTableCell>
              <DashboardTableCell>
                <Link href={`/admin/jobs/vacancies/${a.vacancy.id}`} className="hover:underline">
                  {a.vacancy.title}
                </Link>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs">
                <Link href={`/admin/jobs/employers/${a.vacancy.employer.id}`} className="hover:underline">
                  {a.vacancy.employer.companyName || a.vacancy.employer.fullName || "—"}
                </Link>
              </DashboardTableCell>
              <DashboardTableCell className="text-xs text-muted-foreground">
                {new Date(a.createdAt).toLocaleDateString()}
              </DashboardTableCell>
            </TableRow>
          ))}
          {rows.length === 0 && <Empty cols={4} text="No applications found." />}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}

export function AdminFlagsList({ rows }: { rows: Flags }) {
  return (
    <DashboardDataTable>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <DashboardTableHead>Account</DashboardTableHead>
            <DashboardTableHead>Reason</DashboardTableHead>
            <DashboardTableHead>Status</DashboardTableHead>
            <DashboardTableHead>Raised</DashboardTableHead>
            <DashboardTableHead className="text-right">Actions</DashboardTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((f) => {
            const href = f.user.employerProfile
              ? `/admin/jobs/employers/${f.user.employerProfile.id}`
              : f.user.jobSeekerProfile
                ? `/admin/jobs/seekers/${f.user.jobSeekerProfile.id}`
                : `/admin/users/${f.user.id}`;
            return (
              <TableRow key={f.id} className="border-border/40">
                <DashboardTableCell>
                  <Link href={href} className="font-medium hover:underline">
                    {f.user.name ?? f.user.email}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">{f.user.email}</p>
                </DashboardTableCell>
                <DashboardTableCell className="max-w-xs truncate text-xs">{f.reason}</DashboardTableCell>
                <DashboardTableCell>
                  <AdminStatusBadge status={f.resolved ? "RESOLVED" : "OPEN"} />
                </DashboardTableCell>
                <DashboardTableCell className="text-xs text-muted-foreground">
                  {new Date(f.createdAt).toLocaleDateString()}
                </DashboardTableCell>
                <DashboardTableCell className="text-right">
                  <AdminJobFlagActions flagId={f.id} resolved={f.resolved} />
                </DashboardTableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && <Empty cols={5} text="No flags found." />}
        </TableBody>
      </Table>
    </DashboardDataTable>
  );
}
