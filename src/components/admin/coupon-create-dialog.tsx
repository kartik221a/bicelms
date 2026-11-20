"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CouponCreateDialog({
  action,
}: {
  action: (formData: FormData) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState("percent");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const rawValue = String(fd.get("valueRupees") ?? "").trim();
    const minRupees = String(fd.get("minOrderRupees") ?? "").trim();
    if (type === "fixed") {
      // fixed coupon value arrives in rupees → convert to paise
      fd.set("value", rawValue === "" ? "" : String(Math.round(Number(rawValue) * 100)));
    } else {
      fd.set("value", rawValue);
    }
    fd.set("minOrderValue", minRupees === "" ? "0" : String(Math.round(Number(minRupees) * 100)));
    startTransition(async () => {
      try {
        await action(fd);
        toast.success(`Coupon ${String(fd.get("code") ?? "").toUpperCase()} created`);
        form.reset();
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not create coupon");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#dc2626] text-white hover:bg-[#b91c1c]">
          <Plus className="h-4 w-4" /> New coupon
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create coupon</DialogTitle>
          <DialogDescription>Codes are uppercase; students redeem them at checkout.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="coupon-code">Code *</Label>
            <Input id="coupon-code" name="code" required placeholder="LAUNCH25" className="font-mono uppercase" pattern="[A-Za-z0-9_-]{3,24}" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <input type="hidden" name="type" value={type} />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent (%)</SelectItem>
                  <SelectItem value="fixed">Fixed (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-value">{type === "percent" ? "Value (%)*" : "Value (₹ rupees)*"}</Label>
              <Input id="coupon-value" name="valueRupees" type="number" min={type === "percent" ? 1 : 1} max={type === "percent" ? 100 : undefined} required placeholder={type === "percent" ? "25" : "500"} />
              {type === "fixed" ? <p className="text-xs text-slate-500">Entered in rupees, stored as paise.</p> : null}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-min">Min order (₹ rupees)</Label>
              <Input id="coupon-min" name="minOrderRupees" type="number" min={0} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="coupon-max">Max uses</Label>
              <Input id="coupon-max" name="maxUses" type="number" min={1} placeholder="unlimited" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-expires">Expires on</Label>
              <Input id="coupon-expires" name="expiresAt" type="date" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox name="active" defaultChecked />
                Active immediately
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="bg-[#dc2626] text-white hover:bg-[#b91c1c]">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create coupon
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
