import { AlertCircle, CheckCircle2, CreditCard, ReceiptText, Undo2, Webhook } from "lucide-react";
import { store } from "@/repositories";
import { OrderDoc } from "@/services/payment.service";
import { flags } from "@/config/env";
import { site } from "@/config/site";
import { formatINR } from "@/lib/money";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CopyText } from "@/components/admin/copy-text";
import { formatDateTime } from "@/components/admin/format";

export const metadata = { title: "Payments — BICE Admin" };

interface PaymentRow {
  id: string;
  orderId: string;
  provider: string;
  providerPaymentId?: string | null;
  method?: string | null;
  status: string;
  amount: number;
  createdAt?: string;
}

export default async function AdminPaymentsPage() {
  const [payments, orders] = await Promise.all([
    store.list<PaymentRow>("payments", { orderBy: [{ field: "createdAt", direction: "desc" }], limit: 5000 }),
    store.list<OrderDoc>("orders", { limit: 5000 }),
  ]);

  const orderById = new Map(orders.map((o) => [o.id, o]));
  const webhookUrl = `${site.url}/api/v1/webhooks/razorpay`;

  const captured = payments.filter((p) => p.status === "captured");
  const failed = payments.filter((p) => p.status === "failed");
  const refunded = payments.filter((p) => p.status === "refunded");

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <PageHeader
        title="Payments"
        count={`${payments.length} transactions`}
        description="Raw provider transactions recorded from checkout callbacks and webhooks."
      />

      <section aria-label="Payment totals" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Captured amount" value={formatINR(captured.reduce((a, p) => a + (p.amount || 0), 0), { compact: true })} hint={`${captured.length} captured`} />
        <StatCard icon={AlertCircle} label="Failed payments" value={String(failed.length)} hint="Checkouts that did not complete" />
        <StatCard icon={Undo2} label="Refunded amount" value={formatINR(refunded.reduce((a, p) => a + (p.amount || 0), 0), { compact: true })} hint={`${refunded.length} refunds`} />
        <StatCard icon={CreditCard} label="Provider" value="Razorpay" hint={flags.razorpayConfigured ? "Configured" : "Not configured"} />
      </section>

      <Card className="border-[#fecaca] bg-[#fef2f2]/50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Webhook className="h-4 w-4 text-[#dc2626]" /> Razorpay webhook configuration
          </CardTitle>
          <CardDescription>
            Point a Razorpay webhook of type <span className="font-mono text-xs">payment.captured</span>,{" "}
            <span className="font-mono text-xs">payment.failed</span> and{" "}
            <span className="font-mono text-xs">refund.processed</span> at the endpoint below so payment states stay in
            sync even if a student closes the browser mid-checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <code className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700">{webhookUrl}</code>
          <CopyText value={webhookUrl} label="Copy URL" />
          <span className="text-xs text-slate-500">
            Status: <span className={flags.razorpayConfigured ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
              {flags.razorpayConfigured ? "Keys configured (webhook secret verifies signatures)" : "Razorpay not configured — set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET"}
            </span>
          </span>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {payments.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={ReceiptText} title="No payments recorded yet" description="Transactions appear after the first checkout callback or webhook event." />
            </div>
          ) : (
            <div className="max-h-[620px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Provider</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => {
                    const order = orderById.get(p.orderId);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium capitalize text-slate-800">{p.provider}</TableCell>
                        <TableCell className="text-slate-600">{p.method ?? "—"}</TableCell>
                        <TableCell className="max-w-[220px] truncate font-mono text-xs text-slate-500">
                          {p.providerPaymentId ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">{order?.orderNumber ?? p.orderId}</TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">{formatINR(p.amount || 0)}</TableCell>
                        <TableCell>
                          <StatusPill status={p.status} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500">{formatDateTime(p.createdAt)}</TableCell>
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
