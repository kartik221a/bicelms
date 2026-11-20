"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export function CouponActiveSwitch({
  couponId,
  active,
  onToggle,
}: {
  couponId: string;
  active: boolean;
  onToggle: (active: boolean) => Promise<unknown>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={active}
      disabled={pending}
      aria-label={`${active ? "Deactivate" : "Activate"} coupon`}
      onCheckedChange={(next) => {
        startTransition(async () => {
          try {
            await onToggle(next);
            toast.success(next ? "Coupon activated" : "Coupon deactivated");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not update coupon");
          }
        });
      }}
    />
  );
}
