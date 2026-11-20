"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Change password → POST /api/v1/users/me/password. Server errors (including
 * Firebase-managed auth and validation limits) are surfaced verbatim so the
 * UI never fakes a success or hides a setup limitation.
 */
export function PasswordForm() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/v1/users/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        // Show the honest server-side message (e.g. Firebase-managed auth).
        toast.error(json.error?.message ?? "Could not change your password.");
        return;
      }
      toast.success("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Network error — password not changed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="border-slate-200"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="border-slate-200"
            required
          />
          <p className="text-xs text-slate-500">At least 8 characters.</p>
        </div>
      </div>
      <div className="max-w-sm">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          className="mt-2 border-slate-200"
          required
        />
      </div>
      <div className="flex items-center justify-end gap-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <KeyRound className="h-3.5 w-3.5" /> You stay signed in on this device
        </span>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Update password
        </Button>
      </div>
    </form>
  );
}
