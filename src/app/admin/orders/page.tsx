import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { store } from "@/repositories";
import { OrderDoc } from "@/services/payment.service";
import { CourseDoc } from "@/services/course.service";
import { formatINR } from "@/lib/money";
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
import { formatDateTime } from "@/components/admin/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders — BICE Admin" };

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "created", label: "Created" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

interface UserRow {
  id: string;
  name: string;
  email: string;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "", q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const [orders, users, courses] = await Promise.all([
    store.list<OrderDoc>("orders", { orderBy: [{ field: "createdAt", direction: "desc" }], limit: 5000 }),
    store.list<UserRow>("users", { limit: 5000 }),
    store.list<CourseDoc>("courses", { limit: 500 }),
  ]);

  const userById = new Map(users.map((u) => [u.id, u]));
  const courseById = new Map(courses.map((c) => [c.id, c]));

  const filtered = orders.filter((o) => {
    if (status && o.status !== status) return false;
    if (query) {
      const hay = `${o.orderNumber} ${o.razorpayPaymentId ?? ""} ${userById.get(o.userId)?.name ?? ""} ${userById.get(o.userId)?.email ?? ""}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Orders"
        count={`${filtered.length} shown`}
        description="Every checkout attempt — paid, pending, failed or refunded."
      />

      {/* Status tabs via URL params */}
      <nav aria-label="Filter orders by status" className="flex flex-wrap items-center gap-1.5">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value;
          const href = tab.value ? `/admin/orders?status=${tab.value}` : "/admin/orders";
          return (
            <Link
              key={tab.label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#0f172a] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <form method="GET" action="/admin/orders" className="flex max-w-md gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <div className="relative flex-1">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search order number, payment ID or student…"
            className="pl-9"
            aria-label="Search orders"
          />
        </div>
        <Button type="submit" variant="outline" className="shrink-0">
          Search
        </Button>
      </form>

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="px-0 pb-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={ShoppingBag}
                title="No orders found"
                description="Orders appear here the moment a student starts a checkout."
              />
            </div>
          ) : (
            <div className="max-h-[680px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Order ID</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Razorpay payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => {
                    const user = userById.get(o.userId);
                    const course = o.courseId ? courseById.get(o.courseId) : undefined;
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs font-medium text-slate-700">{o.orderNumber}</TableCell>
                        <TableCell className="max-w-[180px]">
                          <p className="truncate font-medium text-slate-800">{user?.name ?? "—"}</p>
                          <p className="max-w-[180px] truncate text-xs text-slate-400">{user?.email ?? ""}</p>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-slate-600">{course?.title ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-slate-900">{formatINR(o.finalAmount)}</span>
                          {o.discount > 0 ? (
                            <span className="ml-1.5 text-xs text-slate-400 line-through">{formatINR(o.amount)}</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{o.razorpayPaymentId ?? "—"}</TableCell>
                        <TableCell>
                          <StatusPill status={o.status} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500">{formatDateTime(o.createdAt)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
