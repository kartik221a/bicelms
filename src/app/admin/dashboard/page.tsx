import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  IndianRupee,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getAdminStats } from "@/services/analytics.service";
import { formatINR } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusPill } from "@/components/admin/status-pill";
import { CategoryPieChart, RevenueAreaChart } from "@/components/admin/charts";
import { formatDate, formatDateTime } from "@/components/admin/format";

export const metadata = { title: "Dashboard overview — BICE Admin" };

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const { totals } = stats;

  const trend = stats.revenueTrend;
  const thisMonth = trend[trend.length - 1]?.revenue ?? 0;
  const lastMonth = trend[trend.length - 2]?.revenue ?? 0;
  const monthDelta =
    lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth > 0 ? null : 0;
  const maxStudents = Math.max(1, ...stats.popularCourses.map((c) => c.students));

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Dashboard overview"
        description="Real-time performance metrics, sales conversion and student learning trends across BICE Academy."
      >
        <Link
          href="/admin/courses/create"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#dc2626] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#b91c1c]"
        >
          <BookOpen className="h-4 w-4" /> Create course
        </Link>
      </PageHeader>

      {/* KPI cards */}
      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} label="Total students" value={totals.students.toLocaleString("en-IN")} hint={`${stats.recentRegistrations.length} new recently`} />
        <StatCard icon={BookOpen} label="Total courses" value={totals.courses.toLocaleString("en-IN")} hint="Published catalog" />
        <StatCard icon={GraduationCap} label="Total enrollments" value={totals.enrollments.toLocaleString("en-IN")} hint="Active enrollments" />
        <StatCard icon={IndianRupee} label="Total revenue" value={formatINR(totals.revenue, { compact: true })} hint="Lifetime gross" />
        <StatCard
          icon={TrendingUp}
          label="Monthly revenue"
          value={formatINR(totals.monthlyRevenue, { compact: true })}
          hint={
            monthDelta === null
              ? "First sales this month"
              : `${monthDelta >= 0 ? "+" : ""}${monthDelta}% vs last month`
          }
        />
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] lg:col-span-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Revenue trend (last 12 months)</CardTitle>
            <p className="text-xs text-slate-500">Monthly gross earnings in INR from paid orders</p>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueAreaChart data={trend} />
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Enrollments by category</CardTitle>
            <p className="text-xs text-slate-500">Active enrollments split by course category</p>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={stats.enrollmentsByCategory} />
          </CardContent>
        </Card>
      </section>

      {/* Purchases + registrations */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] lg:col-span-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Recent purchases</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {stats.recentPurchases.length === 0 ? (
              <div className="px-6 pb-6">
                <EmptyState icon={IndianRupee} title="No purchases yet" description="Paid orders will appear here as soon as students start buying." />
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Order ID</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentPurchases.map((p) => (
                      <TableRow key={p.orderNumber}>
                        <TableCell className="font-mono text-xs text-slate-600">{p.orderNumber}</TableCell>
                        <TableCell className="max-w-[140px] truncate font-medium text-slate-800">{p.student}</TableCell>
                        <TableCell className="max-w-[220px] truncate text-slate-600">{p.course}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">{formatINR(p.amount)}</TableCell>
                        <TableCell>
                          <StatusPill status={p.status} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500">{formatDateTime(p.date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Recent registrations</CardTitle>
            <p className="text-xs text-slate-500">Newest student accounts</p>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {stats.recentRegistrations.length === 0 ? (
              <EmptyState icon={Users} title="No students yet" description="New sign-ups will show up here." />
            ) : (
              <ul className="space-y-3">
                {stats.recentRegistrations.map((r) => (
                  <li key={r.email} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-sm font-bold text-[#dc2626]">
                      {r.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{r.name}</p>
                      <p className="truncate text-xs text-slate-500">{r.email}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{formatDate(r.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Popular courses */}
      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">Most popular courses</CardTitle>
          <p className="text-xs text-slate-500">Ranked by enrolled students, with revenue contribution</p>
        </CardHeader>
        <CardContent>
          {stats.popularCourses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses yet" description="Create your first course to see popularity stats." />
          ) : (
            <ol className="space-y-4">
              {stats.popularCourses.map((c, i) => (
                <li key={c.title} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-slate-800">{c.title}</p>
                      <span className="shrink-0 text-sm font-semibold text-slate-900">{formatINR(c.revenue, { compact: true })}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <Progress value={(c.students / maxStudents) * 100} className="h-1.5 flex-1" />
                      <span className="w-24 shrink-0 text-right text-xs text-slate-500">
                        {c.students.toLocaleString("en-IN")} students
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 pb-2 text-xs text-slate-400">
        {monthDelta !== null && monthDelta < 0 ? (
          <>
            <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" /> Monthly revenue is down {Math.abs(monthDelta)}% versus last month.
          </>
        ) : (
          <>
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" /> Figures update in real time from orders and enrollments.
          </>
        )}
      </p>
    </div>
  );
}
