import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ReceiptText, ShoppingBag, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { getSession } from "@/services/auth/session";
import { store } from "@/repositories";
import { listUserOrders, type OrderDoc } from "@/services/payment.service";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  created: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orders = await listUserOrders(session.id);

  const totalSpent = orders
    .filter((o) => o.status === "paid")
    .reduce((acc, o) => acc + (o.finalAmount ?? 0), 0);
  const refunds = orders.filter((o) => o.status === "refunded").length;

  const courseIds = [...new Set(orders.map((o) => o.courseId).filter((id): id is string => Boolean(id)))];
  const courses = new Map(
    await Promise.all(
      courseIds.map(async (id) => {
        const c = await store.get<{ id: string; title: string; slug: string; thumbnailUrl?: string | null }>("courses", id);
        return [id, c ?? null] as const;
      })
    )
  );

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Your purchase history and payment status.</p>
      </div>

      <section aria-label="Order statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Total spent" value={formatINR(totalSpent)} />
        <StatCard icon={ShoppingBag} label="Orders" value={orders.length} />
        <StatCard icon={ReceiptText} label="Refunds" value={refunds} />
      </section>

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="When you enroll in a paid course, your order and payment status will show up here."
          action={
            <Button asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Order ID</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <OrderRow key={o.id} order={o} course={o.courseId ? courses.get(o.courseId) ?? null : null} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OrderRow({ order, course }: { order: OrderDoc; course: { title: string; slug: string; thumbnailUrl?: string | null } | null }) {
  const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1);
  return (
    <TableRow>
      <TableCell className="pl-5 font-mono text-xs font-semibold text-slate-700">{order.orderNumber}</TableCell>
      <TableCell>
        {course ? (
          <div className="flex items-center gap-3">
            {course.thumbnailUrl ? (
               
              <img
                src={course.thumbnailUrl}
                alt={`Thumbnail of ${course.title}`}
                className="h-10 w-16 rounded border border-slate-200 object-cover"
              />
            ) : (
              <span className="flex h-10 w-16 items-center justify-center rounded border border-slate-200 bg-slate-50">
                <BookOpen className="h-4 w-4 text-slate-300" />
              </span>
            )}
            <Link
              href={`/courses/${course.slug}`}
              className="line-clamp-2 max-w-[220px] text-sm font-medium text-slate-800 hover:text-[#dc2626]"
            >
              {course.title}
            </Link>
          </div>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-slate-600">
        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
      </TableCell>
      <TableCell className="whitespace-nowrap font-semibold text-slate-900">{formatINR(order.finalAmount)}</TableCell>
      <TableCell className="text-sm text-slate-600">
        {order.razorpayPaymentId ? <Badge variant="secondary">Razorpay</Badge> : <span className="text-slate-400">—</span>}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
            STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600 border-slate-200"
          )}
        >
          {statusLabel}
        </span>
      </TableCell>
      <TableCell className="pr-5 text-right">
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex cursor-not-allowed rounded-md" aria-label="Invoice unavailable">
              <Button variant="outline" size="sm" disabled className="h-8 pointer-events-none">
                Invoice
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Invoices are available once email delivery is configured</TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
