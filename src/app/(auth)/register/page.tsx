"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Mail,
  Phone,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { registerSchema } from "@/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { GoogleButton } from "@/components/auth/google-button";
import {
  exchangeIdTokenForSession,
  firebaseCreateUserWithEmail,
  firebaseErrorMessageFor,
  isFirebaseClientConfigured,
} from "@/components/auth/firebase-client";
import { AuthApiError, postJson } from "@/components/auth/auth-api";

/**
 * Server contract is registerSchema (name/email/phone/password). The form adds
 * confirmPassword + a required terms consent, validated client-side only.
 */
const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirm your password"),
    terms: z.boolean().refine((v) => v, {
      message: "You must accept the Terms of Service and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "", terms: false },
    mode: "onTouched",
  });

  // Tracked separately from RHF's watch() for React Compiler compatibility.
  const [passwordValue, setPasswordValue] = useState("");

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      if (isFirebaseClientConfigured()) {
        // Firebase mode: create the auth account with the client SDK, persist
        // the profile record server-side, then exchange the ID token.
        const idToken = await firebaseCreateUserWithEmail(values.email, values.password);
        await postJson("/api/v1/auth/register", {
          name: values.name,
          email: values.email,
          phone: values.phone || "",
          password: values.password,
        });
        await exchangeIdTokenForSession(idToken);
      } else {
        // Setup mode: single local register call (also issues the session cookie).
        await postJson<{ user: { name: string } }>("/api/v1/auth/register", {
          name: values.name,
          email: values.email,
          phone: values.phone || "",
          password: values.password,
        });
      }
      toast.success("Account created — check your inbox for the verification link");
      router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    } catch (err) {
      const message =
        err instanceof AuthApiError || err instanceof Error
          ? err.message
          : await firebaseErrorMessageFor(err);
      setServerError(message);
      toast.error(message);
      if (err instanceof AuthApiError && err.code === "conflict") {
        setError("email", { message });
      }
    }
  }

  return (
    <Card className="w-full max-w-[480px] rounded-xl border-slate-200/90 shadow-sm">
      <CardHeader className="gap-4 p-8 pb-0 sm:p-10 sm:pb-0">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-accent text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started with access to masterclasses and enterprise roadmaps
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-6 sm:p-10 sm:pt-6">
        {serverError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Registration failed</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
              Full name
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                autoComplete="name"
                placeholder="e.g. Samantha Patel"
                className="pl-10"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
            </div>
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

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
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">
                Phone number
              </Label>
              <span className="text-[11px] font-medium text-muted-foreground">Optional</span>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-muted-foreground">
                <Phone className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-semibold text-slate-600">+91</span>
              </span>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                className="pl-[72px]"
                aria-invalid={Boolean(errors.phone)}
                {...register("phone")}
              />
            </div>
            {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
              Password
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
              Confirm password
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
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5 pt-1">
            {/* Radix Checkbox is a button (not a native input), so it must be
                wired through a Controller — register() cannot read its state. */}
            <Controller
              control={control}
              name="terms"
              render={({ field }) => (
                <label
                  htmlFor="terms-consent"
                  className="flex cursor-pointer select-none items-start gap-2.5"
                >
                  <Checkbox
                    id="terms-consent"
                    className="mt-0.5"
                    checked={field.value === true}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    aria-invalid={Boolean(errors.terms)}
                  />
                  <span className="text-xs leading-relaxed text-slate-600">
                    I agree to the{" "}
                    <Link href="/terms" className="font-medium text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy" className="font-medium text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              )}
            />
            {errors.terms ? (
              <p className="text-xs text-destructive">{errors.terms.message}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              <>
                Create Account
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

          <GoogleButton className="w-full" label="Sign up with Google" redirectTo="/dashboard" />

          <p className="flex items-start gap-2 rounded-lg bg-muted/70 p-2.5 text-xs leading-relaxed text-muted-foreground">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            We&apos;ll send a verification link to your email address
          </p>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t border-slate-100 p-8 pt-6 sm:p-10 sm:pt-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
