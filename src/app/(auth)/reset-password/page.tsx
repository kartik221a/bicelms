"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  LogIn,
  ShieldX,
} from "lucide-react";
import { toast } from "sonner";

import { passwordSchema } from "@/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { AuthApiError, postJson } from "@/components/auth/auth-api";

const resetFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetFormValues = z.infer<typeof resetFormSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  // Tracked separately from RHF's watch() for React Compiler compatibility.
  const [passwordValue, setPasswordValue] = useState("");

  async function onSubmit(values: ResetFormValues) {
    try {
      await postJson<{ message: string }>("/api/v1/auth/reset-password", {
        token,
        password: values.password,
      });
      setDone(true);
      toast.success("Password updated");
      // Give the toast a moment to be seen, then land on the login page.
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      const message =
        err instanceof AuthApiError ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-[460px] rounded-xl border-slate-200/90 shadow-sm">
        <CardContent className="flex flex-col items-center p-8 text-center sm:p-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-200 bg-red-50">
            <ShieldX className="h-7 w-7 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Invalid reset link</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This password reset link is missing or malformed. Please request a new one.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/forgot-password">Request a new reset link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-[460px] rounded-xl border-slate-200/90 shadow-sm">
        <CardContent className="flex flex-col items-center p-8 text-center sm:p-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Password updated</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your password has been changed. You can now log in with your new password.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/login">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Go to login
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[460px] rounded-xl border-slate-200/90 shadow-sm">
      <CardHeader className="gap-4 p-8 pb-0 sm:p-10 sm:pb-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/10 bg-accent text-primary">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a strong password you haven&apos;t used before.
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-6 sm:p-10 sm:pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
              New password
            </Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              className="pl-10"
              aria-invalid={Boolean(errors.password)}
              {...register("password", { onChange: (e) => setPasswordValue(e.target.value) })}
            />
            <PasswordStrengthMeter password={passwordValue} />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
              Confirm new password
            </Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="pl-10"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <Alert variant="destructive" className="mt-1 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {errors.confirmPassword.message}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Updating password…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ResetPasswordFormFallback() {
  return (
    <Card className="w-full max-w-[460px] rounded-xl border-slate-200/90 shadow-sm">
      <CardHeader className="gap-4 p-8 pb-0 sm:p-10 sm:pb-0">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-8 pt-6 sm:p-10 sm:pt-6">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFormFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
