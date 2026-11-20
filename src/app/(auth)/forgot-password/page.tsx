"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";

import { forgotPasswordSchema } from "@/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthApiError, postJson } from "@/components/auth/auth-api";

type ForgotFormValues = z.infer<typeof forgotPasswordSchema>;

const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function requestReset(email: string) {
    await postJson<{ message: string }>("/api/v1/auth/forgot-password", { email });
    setSentTo(email);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  async function onSubmit(values: ForgotFormValues) {
    try {
      await requestReset(values.email);
      toast.success("Reset link sent");
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    }
  }

  async function onResend() {
    if (!sentTo || cooldown > 0) return;
    setResending(true);
    try {
      await requestReset(sentTo);
      toast.success("Reset link sent again");
    } catch (err) {
      const message = err instanceof AuthApiError ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setResending(false);
    }
  }

  if (sentTo) {
    return (
      <Card className="w-full max-w-[460px] rounded-xl border-slate-200/90 shadow-sm">
        <CardContent className="flex flex-col items-center p-8 text-center sm:p-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Reset link sent</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Reset link sent — check your inbox. Link expires in 30 minutes.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sent to <span className="font-medium text-slate-700">{sentTo}</span>
          </p>

          <div className="mt-6 flex w-full flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onResend}
              disabled={cooldown > 0 || resending}
              className="w-full"
            >
              {resending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                  {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend email"}
                </>
              )}
            </Button>
            <Button type="button" variant="ghost" asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[460px] rounded-xl border-slate-200/90 shadow-sm">
      <CardHeader className="gap-4 p-8 pb-0 sm:p-10 sm:pb-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/10 bg-accent text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Forgot your password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-6 sm:p-10 sm:pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
              Email address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                className="pl-10"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
            </div>
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
