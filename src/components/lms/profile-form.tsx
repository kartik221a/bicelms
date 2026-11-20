"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Editable profile fields (name, phone) → PUT /api/v1/users/me. */
export function ProfileForm({
  initialName,
  initialPhone,
}: {
  initialName: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() ? phone.trim() : null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast.error(json.error?.message ?? "Could not update your profile.");
        return;
      }
      toast.success("Profile updated");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Network error — profile not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Full name</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="border-slate-200"
            maxLength={80}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">Phone</Label>
          <Input
            id="profile-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="border-slate-200"
            maxLength={20}
            inputMode="tel"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
        </Button>
      </div>
    </form>
  );
}
