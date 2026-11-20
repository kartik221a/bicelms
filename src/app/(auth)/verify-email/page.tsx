"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogIn,
  MailCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthApiError, postJson } from "@/components/auth/auth-api";

type VerifyState = "verifying" | "success" | "error";

function VerifyEmailResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [state, setState] = useState<VerifyState | null>(token ? "verifying" : null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    // Initial state is already "verifying" when a token is present; only
    // async results update state from here.
    postJson<{ message: string }>("/api/v1/auth/verify-email", { token })
      .then(() => {
        setState("success");
        router.refresh();
      })
      .catch((err: unknown) => {
        setErrorMessage(
          err instanceof AuthApiError ? err.message : "Something went wrong. Please try again."
        );
        setState("error");
      });
  }, [token, router]);

  if (token) {
    if (state === "verifying") {
      return (
        <Card className="w-full max-w-[460px] rounded-xl border-slate-200/90 shadow-sm">
          <CardContent className="flex flex-col items-center p-8 text-center sm:p-10">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Verifying your email…</h1>
            <p className="mt-2 text-sm text-muted-foreground">This will only take a moment.</p>
          </CardContent>
        </Card>
      );
    }

    if (state === "success") {
      return (
        <Card className="w-full max-w-[460px] rounded-xl border-slate-200/90 shadow-sm">
          <CardContent className="flex flex-col items-center p-8 text-center sm:p-10">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden="true" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Email verified</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your email address is confirmed. You now have full access to your account.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link href="/dashboard">Go to your dashboard</Link>
            </Button>
            <Button variant="ghost" asChild className="mt-2 w-full">
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
        <CardContent className="flex flex-col items-center p-8 text-center sm:p-10">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-200 bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Verification failed</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {errorMessage ?? "This verification link is invalid or has expired."}
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/login">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Back to login
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No token: "Check your inbox" state (optionally personalised with ?email=…).
  return (
    <Card className="w-full max-w-[460px] rounded-xl border-slate-200/90 shadow-sm">
      <CardContent className="flex flex-col items-center p-8 text-center sm:p-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-accent">
          <MailCheck className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Check your inbox</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {email ? (
            <>
              We sent a verification link to{" "}
              <span className="font-medium text-slate-700">{email}</span>. Click the link in the
              email to verify your address.
            </>
          ) : (
            <>
              We sent a verification link to your email address. Click the link in the email to
              verify your address.
            </>
          )}
        </p>
        <p className="mt-3 rounded-lg bg-muted/70 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          Verification links expire after 60 minutes. Didn&apos;t receive the email? Check your
          spam folder, or wait a few minutes and register again with the same address to get a
          fresh link.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/dashboard">Continue to dashboard</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/login">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Back to login
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VerifyEmailFallback() {
  return (
    <Card className="w-full max-w-[460px] rounded-xl border-slate-200/90 shadow-sm">
      <CardContent className="flex flex-col items-center gap-3 p-8 sm:p-10">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailResult />
    </Suspense>
  );
}
