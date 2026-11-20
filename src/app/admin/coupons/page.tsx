import { TicketPercent, Trash2 } from "lucide-react";
import { couponService } from "@/services/coupon.service";
import { createCoupon, deleteCoupon, toggleCoupon } from "@/app/admin/actions";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { CouponActiveSwitch } from "@/components/admin/coupon-active-switch";
import { CouponCreateDialog } from "@/components/admin/coupon-create-dialog";
import { ConfirmDialogButton } from "@/components/admin/confirm-dialog";
import { formatDate } from "@/components/admin/format";

export const metadata = { title: "Coupons — BICE Admin" };

export default async function AdminCouponsPage() {
  const coupons = await couponService.list();

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
      <PageHeader
        title="Coupons"
        count={`${coupons.length} coupons`}
        description="Discount codes students can apply at checkout — percent or fixed amount."
      >
        <CouponCreateDialog action={createCoupon} />
      </PageHeader>

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="px-0 pb-0">
          {coupons.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={TicketPercent}
                title="No coupons yet"
                description="Create your first discount code — e.g. LAUNCH25 for 25% off."
                action={<CouponCreateDialog action={createCoupon} />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Min order</TableHead>
                    <TableHead className="text-center">Usage</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="w-12" aria-label="Actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((c) => {
                    const expired = c.expiresAt ? new Date(c.expiresAt).getTime() < Date.now() : false;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sm font-semibold tracking-wide text-slate-900">{c.code}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              c.type === "percent"
                                ? "border-0 bg-[#fef2f2] text-[#dc2626] ring-1 ring-inset ring-[#dc2626]/20"
                                : "border-0 bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20"
                            }
                          >
                            {c.type === "percent" ? "Percent" : "Fixed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {c.type === "percent" ? `${c.value}%` : formatINR(c.value)}
                        </TableCell>
                        <TableCell className="text-slate-600">{c.minOrderValue > 0 ? formatINR(c.minOrderValue) : "—"}</TableCell>
                        <TableCell className="text-center text-slate-600">
                          <span className="font-medium text-slate-800">{c.usesCount ?? 0}</span>
                          {c.maxUses ? ` / ${c.maxUses}` : " / ∞"}
                        </TableCell>
                        <TableCell className={expired ? "text-xs font-medium text-rose-600" : "text-xs text-slate-500"}>
                          {c.expiresAt ? (expired ? `Expired ${formatDate(c.expiresAt)}` : formatDate(c.expiresAt)) : "Never"}
                        </TableCell>
                        <TableCell className="text-center">
                          <CouponActiveSwitch couponId={c.id} active={c.active} onToggle={toggleCoupon.bind(null, c.id)} />
                        </TableCell>
                        <TableCell>
                          <ConfirmDialogButton
                            trigger={
                              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50" aria-label={`Delete coupon ${c.code}`}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            }
                            title="Delete coupon?"
                            description={`"${c.code}" will stop applying immediately. Past redemptions stay in order history.`}
                            confirmLabel="Delete coupon"
                            onConfirm={deleteCoupon.bind(null, c.id)}
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
    </div>
  );
}
