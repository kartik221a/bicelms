"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  ArrowRight,
  Lock,
  LogIn,
  Loader2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import { loginSchema } from "@/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordInput } from "@/components/auth/password-input";
import { GoogleButton } from "@/components/auth/google-button";
import { DemoAccountsHint } from "@/components/auth/demo-accounts-hint";
import {
  exchangeIdTokenForSession,
  firebaseErrorMessageFor,
  firebaseSignInWithEmail,
  isFirebaseClientConfigured,
} from "@/components/auth/firebase-client";
import { AuthApiError, postJson } from "@/components/auth/auth-api";

type LoginFormValues = z.infer<typeof loginSchema>;

function safeRedirectTarget(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rememberMe, setRememberMe] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const target = safeRedirectTarget(searchParams.get("next"));

  async function onSubmit(values: LoginFormValues) {
    try {
      if (isFirebaseClientConfigured()) {
        // Firebase mode: client SDK sign-in, then exchange ID token for session cookie.
        const idToken = await firebaseSignInWithEmail(values.email, values.password);
        await exchangeIdTokenForSession(idToken);
      } else {
        // Setup mode: local credentials + HMAC session cookie via the API.
        await postJson<{ user: { name: string } }>("/api/v1/auth/login", values);
      }
      toast.success("Welcome back!");
      router.push(target);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof AuthApiError || err instanceof Error
          ? err.message
          : await firebaseErrorMessageFor(err);
      setError("root", { message });
      toast.error(message);
    }
  }

  return (
    <Card className="w-full rounded-xl border-slate-200/90 shadow-sm">
      <CardHeader className="gap-4 p-8 pb-0 sm:p-10 sm:pb-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/10 bg-accent text-primary">
          <LogIn className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log in to continue learning on BICE LMS
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-6 sm:p-10 sm:pt-6">
        <DemoAccountsHint />

        {errors.root?.message ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Sign-in failed</AlertTitle>
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        ) : null}

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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className="pl-10"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex cursor-pointer select-none items-center gap-2">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                aria-label="Remember me"
              />
              <span className="text-xs font-medium text-slate-600">Remember me</span>
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Logging in…
              </>
            ) : (
              <>
                Log in
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>

          <div className="relative flex items-center justify-center py-1">
            <div className="w-full border-t border-border" />
            <div className="absolute bg-white px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              or
            </div>
          </div>

          <GoogleButton className="w-full" redirectTo={target} />
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t border-slate-100 p-8 pt-6 sm:p-10 sm:pt-6">
        <p className="text-xs text-muted-foreground">
          New to BICE?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

function LoginFormFallback() {
  return (
    <Card className="w-full rounded-xl border-slate-200/90 shadow-sm">
      <CardHeader className="gap-4 p-8 pb-0 sm:p-10 sm:pb-0">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-8 pt-6 sm:p-10 sm:pt-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-[460px] flex-col items-center">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <span>
          Secured with <strong className="font-medium text-slate-700">Firebase Authentication</strong>{" "}
          &bull; 256-bit TLS encryption
        </span>
      </p>
    </div>
  );
}
