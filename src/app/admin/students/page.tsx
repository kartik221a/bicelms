import { Search, Users } from "lucide-react";
import { store } from "@/repositories";
import { EnrollmentDoc } from "@/services/enrollment.types";
import { OrderDoc } from "@/services/payment.service";
import { CourseDoc } from "@/services/course.service";
import { manuallyEnrollStudent, revokeEnrollment, setUserStatus } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { StatusPill } from "@/components/admin/status-pill";
import { StudentRowActions } from "@/components/admin/student-row-actions";
import { StudentDetailDialog, StudentDetailData } from "@/components/admin/student-detail";
import { formatDate } from "@/components/admin/format";

export const metadata = { title: "Students — BICE Admin" };

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; student?: string }>;
}) {
  const { q = "", student: selectedId } = await searchParams;
  const query = q.trim().toLowerCase();

  const [users, enrollments, orders, courses] = await Promise.all([
    store.list<UserRow>("users", { orderBy: [{ field: "createdAt", direction: "desc" }], limit: 5000 }),
    store.list<EnrollmentDoc>("enrollments", { limit: 20000 }),
    store.list<OrderDoc>("orders", { orderBy: [{ field: "createdAt", direction: "desc" }], limit: 5000 }),
    store.list<CourseDoc>("courses", { orderBy: [{ field: "title" }], limit: 500 }),
  ]);

  const students = users.filter((u) => u.role === "student");
  const courseById = new Map(courses.map((c) => [c.id, c]));

  const statsByUser = new Map<string, { count: number; avgProgress: number }>();
  for (const e of enrollments) {
    if (e.status !== "active") continue;
    const s = statsByUser.get(e.userId) ?? { count: 0, avgProgress: 0 };
    s.avgProgress = (s.avgProgress * s.count + (e.progressPercent || 0)) / (s.count + 1);
    s.count += 1;
    statsByUser.set(e.userId, s);
  }

  const filtered = students.filter((s) => {
    if (!query) return true;
    return s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query);
  });

  const selected = selectedId ? students.find((s) => s.id === selectedId) : undefined;

  const detail: StudentDetailData | null = selected
    ? {
        id: selected.id,
        name: selected.name,
        email: selected.email,
        status: selected.status,
        joined: formatDate(selected.createdAt),
        enrollments: enrollments
          .filter((e) => e.userId === selected.id)
          .map((e) => ({
            id: e.id,
            courseTitle: courseById.get(e.courseId)?.title ?? "Unknown course",
            progressPercent: Math.round(e.progressPercent || 0),
            status: e.status,
            source: e.source,
          })),
        orders: orders
          .filter((o) => o.userId === selected.id)
          .map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            courseTitle: o.courseId ? courseById.get(o.courseId)?.title ?? "—" : "—",
            finalAmount: o.finalAmount,
            status: o.status,
            date: o.createdAt,
          })),
      }
    : null;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Students"
        count={`${students.length} students`}
        description="Manage learner accounts, review progress and grant or revoke course access."
      />

      <form method="GET" action="/admin/students" className="flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input name="q" defaultValue={q} placeholder="Search by name or email…" className="pl-9" aria-label="Search students" />
        </div>
        <Button type="submit" variant="outline" className="shrink-0">
          Search
        </Button>
      </form>

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="px-0 pb-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title="No students found" description="Student accounts will appear here after sign-up." />
            </div>
          ) : (
            <div className="max-h-[680px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[220px]">Student</TableHead>
                    <TableHead className="text-right">Courses</TableHead>
                    <TableHead className="min-w-[180px]">Avg progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((student) => {
                    const s = statsByUser.get(student.id);
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-sm font-bold text-[#4f46e5]">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">{student.name}</p>
                              <p className="max-w-[220px] truncate text-xs text-slate-500">{student.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-slate-700">{s?.count ?? 0}</TableCell>
                        <TableCell>
                          {s && s.count > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-[#4f46e5]" style={{ width: `${Math.round(s.avgProgress)}%` }} />
                              </div>
                              <span className="text-xs font-medium text-slate-600">{Math.round(s.avgProgress)}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusPill status={student.status} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500">{formatDate(student.createdAt)}</TableCell>
                        <TableCell>
                          <StudentRowActions
                            userId={student.id}
                            name={student.name}
                            status={student.status}
                            setStatus={setUserStatus.bind(null, student.id)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {detail ? (
        <StudentDetailDialog
          student={detail}
          courses={courses.map((c) => ({ id: c.id, title: c.title }))}
          onRevoke={revokeEnrollment}
          onManualEnroll={manuallyEnrollStudent.bind(null, detail.id)}
        />
      ) : null}
    </div>
  );
}
