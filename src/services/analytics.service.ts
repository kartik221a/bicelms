import { store } from "@/repositories";
import { CourseDoc } from "./course.service";
import { OrderDoc } from "./payment.service";
import { LessonDoc } from "./course.service";
import { ProgressDoc } from "./progress.service";

/**
 * Admin analytics (master prompt §10/§15). Aggregation is computed from store
 * queries so it works identically on both providers; swap for native
 * aggregations (Firestore aggregation queries / SQL GROUP BY) at scale.
 */

export interface AdminStats {
  totals: { students: number; courses: number; enrollments: number; revenue: number; monthlyRevenue: number };
  revenueTrend: { month: string; revenue: number }[];
  enrollmentsByCategory: { category: string; count: number }[];
  recentPurchases: { orderNumber: string; student: string; course: string; amount: number; status: string; date: string }[];
  recentRegistrations: { name: string; email: string; date: string }[];
  popularCourses: { title: string; students: number; revenue: number }[];
  completion: { course: string; percent: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const [users, courses, enrollments, orders, categories, progress, lessons] = await Promise.all([
    store.list<{ id: string; role: string; name: string; email: string; createdAt: string }>("users", { limit: 5000 }),
    store.list<CourseDoc>("courses", { limit: 1000 }),
    store.list<{ id: string; courseId: string; status: string; enrolledAt: string }>("enrollments", { limit: 20000 }),
    store.list<OrderDoc & { createdAt: string }>("orders", {
      where: [{ field: "status", op: "==", value: "paid" }],
      orderBy: [{ field: "createdAt", direction: "desc" }],
      limit: 5000,
    }),
    store.list<{ id: string; name: string }>("categories", { limit: 100 }),
    store.list<ProgressDoc>("lessonProgress", { limit: 50000 }),
    store.list<LessonDoc>("lessons", { limit: 20000 }),
  ]);

  const students = users.filter((u) => u.role === "student");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const revenueTrend: { month: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const revenue = orders
      .filter((o) => new Date(o.createdAt).getTime() >= d.getTime() && new Date(o.createdAt).getTime() < next.getTime())
      .reduce((a, o) => a + o.finalAmount, 0);
    revenueTrend.push({ month: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }), revenue });
  }

  const courseById = new Map(courses.map((c) => [c.id, c]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const byCategory = new Map<string, number>();
  for (const e of enrollments.filter((e) => e.status === "active")) {
    const course = courseById.get(e.courseId);
    const cat = course?.categoryId ? categoryById.get(course.categoryId)?.name ?? "Other" : "Other";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + 1);
  }

  const recentPurchases = await Promise.all(
    orders.slice(0, 8).map(async (o) => {
      const [student, course] = await Promise.all([
        store.get<{ name: string; email: string }>("users", o.userId),
        o.courseId ? store.get<CourseDoc>("courses", o.courseId) : null,
      ]);
      return {
        orderNumber: o.orderNumber,
        student: student?.name ?? "—",
        course: course?.title ?? "—",
        amount: o.finalAmount,
        status: o.status,
        date: o.createdAt,
      };
    })
  );

  const popularCourses = [...courses]
    .sort((a, b) => b.studentsCount - a.studentsCount)
    .slice(0, 5)
    .map((c) => ({
      title: c.title,
      students: c.studentsCount,
      revenue: orders.filter((o) => o.courseId === c.id).reduce((a, o) => a + o.finalAmount, 0),
    }));

  const lessonsByCourse = new Map<string, number>();
  for (const l of lessons.filter((l) => l.status === "published")) {
    lessonsByCourse.set(l.courseId, (lessonsByCourse.get(l.courseId) ?? 0) + 1);
  }
  const completion = courses
    .filter((c) => (lessonsByCourse.get(c.id) ?? 0) > 0)
    .map((c) => {
      const enrolled = enrollments.filter((e) => e.courseId === c.id && e.status === "active");
      const totalPossible = enrolled.length * (lessonsByCourse.get(c.id) ?? 0);
      const done = progress.filter(
        (p) => p.courseId === c.id && p.status === "completed"
      ).length;
      return {
        course: c.title,
        percent: totalPossible ? Math.min(100, Math.round((done / totalPossible) * 100)) : 0,
      };
    })
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);

  return {
    totals: {
      students: students.length,
      courses: courses.filter((c) => c.status === "published").length,
      enrollments: enrollments.filter((e) => e.status === "active").length,
      revenue: orders.reduce((a, o) => a + o.finalAmount, 0),
      monthlyRevenue: orders
        .filter((o) => new Date(o.createdAt).getTime() >= monthStart)
        .reduce((a, o) => a + o.finalAmount, 0),
    },
    revenueTrend,
    enrollmentsByCategory: [...byCategory.entries()].map(([category, count]) => ({ category, count })),
    recentPurchases,
    recentRegistrations: students
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map((u) => ({ name: u.name, email: u.email, date: u.createdAt })),
    popularCourses,
    completion,
  };
}
