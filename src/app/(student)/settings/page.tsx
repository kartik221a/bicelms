import Link from "next/link";
import { KeyRound, MoonStar, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PasswordForm } from "@/components/lms/password-form";
import { getSession } from "@/services/auth/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Security and account preferences.</p>
      </div>

      {/* Change password */}
      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <KeyRound className="h-5 w-5 text-[#4f46e5]" /> Change password
          </h2>
          <p className="mb-5 mt-1 text-sm text-slate-500">
            Use at least 8 characters. You will stay signed in on this device after the change.
          </p>
          <PasswordForm />
        </CardContent>
      </Card>

      {/* Preferences — honest placeholder, no fake toggle */}
      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <MoonStar className="h-5 w-5 text-[#4f46e5]" /> Preferences
          </h2>
          <div className="mt-3 flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">Dark mode</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Coming with the next iteration — the interface currently follows a single light theme.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Planned
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone — informational only, stays honest */}
      <Card className="border-rose-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-rose-700">
            <ShieldAlert className="h-5 w-5" /> Danger zone
          </h2>
          <div className="mt-3 space-y-3 rounded-lg border border-rose-100 bg-rose-50/50 p-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Log out everywhere</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Session revocation across all devices is coming with the next iteration. For now, use the
                “Log out” link in the sidebar to end the session on this device.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">Delete account</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Account deletion requires verification of active enrollments and payment records — contact
                support from your registered email to request it.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Looking for name or phone changes?{" "}
            <Link href="/profile" className="font-semibold text-[#4f46e5] hover:underline">
              Edit your profile
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
