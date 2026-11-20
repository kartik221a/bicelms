import { BarChart3, BookOpen, GraduationCap, IndianRupee, Lightbulb, Target, TrendingUp, Users } from "lucide-react";
import { getAdminStats } from "@/services/analytics.service";
import { formatINR } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { CompletionBarChart, RevenueAreaChart, SalesBarChart } from "@/components/admin/charts";
import { formatDateTime } from "@/components/admin/format";

export const metadata = { title: "Analytics — BICE Admin" };

export default async function AdminAnalyticsPage() {
  const stats = await getAdminStats();
  const { totals } = stats;

  const trend = stats.revenueTrend;
  const thisMonth = trend[trend.length - 1]?.revenue ?? 0;
  const lastMonth = trend[trend.length - 2]?.revenue ?? 0;
  const monthDelta = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  const totalSalesRevenue = stats.popularCourses.reduce((a, c) => a + c.revenue, 0);
  const topCourse = stats.popularCourses[0];
  const topShare = topCourse && totalSalesRevenue > 0 ? Math.round((topCourse.revenue / totalSalesRevenue) * 100) : 0;
  const bestCompletion = stats.completion[0];
  const avgCompletion = stats.completion.length
    ? Math.round(stats.completion.reduce((a, c) => a + c.percent, 0) / stats.completion.length)
    : 0;
  const belowTarget = stats.completion.filter((c) => c.percent < 80).length;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Revenue, course performance and learning completion across the last 12 months."
      />

      {/* KPI strip */}
      <section aria-label="Analytics KPIs" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={IndianRupee} label="Gross revenue" value={formatINR(totals.revenue, { compact: true })} hint="Lifetime" />
        <StatCard icon={TrendingUp} label="This month" value={formatINR(totals.monthlyRevenue, { compact: true })} hint={monthDelta === null ? "Baseline month" : `${monthDelta >= 0 ? "+" : ""}${monthDelta}% vs last month`} />
        <StatCard icon={GraduationCap} label="Active enrollments" value={totals.enrollments.toLocaleString("en-IN")} hint={`${totals.students.toLocaleString("en-IN")} students`} />
        <StatCard icon={Target} label="Avg completion" value={`${avgCompletion}%`} hint="Across tracked courses" />
        <StatCard icon={BookOpen} label="Published courses" value={totals.courses.toLocaleString("en-IN")} hint={`${belowTarget} below 80% target`} />
      </section>

      {/* Revenue trend */}
      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">Revenue trend (last 12 months)</CardTitle>
          <p className="text-xs text-slate-500">Gross revenue per month — includes all paid orders</p>
        </CardHeader>
        <CardContent className="pl-2">
          <RevenueAreaChart data={trend} />
        </CardContent>
      </Card>

      {/* Course sales + completion */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Course sales</CardTitle>
            <p className="text-xs text-slate-500">Revenue by course — top sellers</p>
          </CardHeader>
          <CardContent className="pl-2">
            {stats.popularCourses.length === 0 ? (
              <EmptyState icon={BarChart3} title="No sales data yet" description="Course revenue appears after the first paid order." />
            ) : (
              <SalesBarChart data={stats.popularCourses.map((c) => ({ title: c.title, revenue: c.revenue }))} />
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Completion rates</CardTitle>
            <p className="text-xs text-slate-500">Share of possible lesson completions — 80% target line</p>
          </CardHeader>
          <CardContent className="pl-2">
            {stats.completion.length === 0 ? (
              <EmptyState icon={Target} title="No completion data yet" description="Once students start finishing lessons, rates appear here." />
            ) : (
              <CompletionBarChart data={stats.completion} />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Registrations + insights */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">Registrations</CardTitle>
            <p className="text-xs text-slate-500">Newest student sign-ups</p>
          </CardHeader>
          <CardContent className="max-h-72 overflow-y-auto">
            {stats.recentRegistrations.length === 0 ? (
              <EmptyState icon={Users} title="No registrations yet" />
            ) : (
              <ul className="space-y-2.5">
                {stats.recentRegistrations.map((r) => (
                  <li key={r.email} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{r.name}</p>
                      <p className="truncate text-xs text-slate-500">{r.email}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{formatDateTime(r.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#c7d2fe] bg-[#eef2ff]/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Lightbulb className="h-4 w-4 text-[#4f46e5]" /> Insights from your data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Top course drives {topShare}% of tracked sales</p>
              <p className="mt-1 text-xs text-slate-500">
                {topCourse && topCourse.revenue > 0
                  ? `“${topCourse.title}” generated ${formatINR(topCourse.revenue)} of the ${formatINR(totalSalesRevenue)} tracked across the top 5 courses (${topCourse.students.toLocaleString("en-IN")} students). Consider bundling weaker sellers with it.`
                  : "Once courses start selling, revenue concentration will be computed here."}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">
                {bestCompletion ? `“${bestCompletion.course}” has the highest completion at ${bestCompletion.percent}%` : "No completion data yet"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {bestCompletion && bestCompletion.percent >= 80
                  ? "Great pacing — replicate this course's section length and quiz cadence in other titles."
                  : bestCompletion
                    ? `Still ${80 - bestCompletion.percent}% short of the 80% target. Try shorter lessons or mid-course assignments to lift completion.`
                    : "Completion rates appear once lessons are completed by enrolled students."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
