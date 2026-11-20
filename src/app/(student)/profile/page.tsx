import { redirect } from "next/navigation";
import { Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/components/lms/profile-form";
import { getSession } from "@/services/auth/session";
import { store } from "@/repositories";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await store.get<{
    id: string;
    name: string;
    phone?: string | null;
    createdAt?: string;
  }>("users", session.id);

  const memberSince = user?.createdAt ? new Date(user.createdAt) : null;

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your account details and contact information.</p>
      </div>

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-2xl font-bold text-[#dc2626]">
              {session.photoUrl ? (
                 
                <img src={session.photoUrl} alt={session.name} className="h-20 w-20 rounded-full object-cover" />
              ) : (
                session.name.slice(0, 1).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900">{session.name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <Mail className="h-4 w-4" /> {session.email}
                {session.emailVerified ? (
                  <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Verified
                  </span>
                ) : null}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <UserIcon className="h-4 w-4" />
                Member since{" "}
                {memberSince
                  ? memberSince.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Edit profile</h2>
          <ProfileForm initialName={session.name} initialPhone={user?.phone ?? ""} />
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-[#dc2626]" /> Account &amp; security
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Role: <span className="font-medium capitalize text-slate-700">{session.role.replace("_", " ")}</span>.
              Change your password and review security options in Settings.
            </p>
          </div>
          <Link
            href="/settings"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Open security settings
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
