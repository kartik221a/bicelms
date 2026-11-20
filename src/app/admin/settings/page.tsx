import { KeyRound, ShieldCheck, Webhook } from "lucide-react";
import { getSettings } from "@/services/settings.service";
import { updateSettingsAction } from "@/app/admin/actions";
import { flags, env } from "@/config/env";
import { site } from "@/config/site";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { CopyText } from "@/components/admin/copy-text";

export const metadata = { title: "Settings — BICE Admin" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  const webhookUrl = `${site.url}/api/v1/webhooks/razorpay`;

  return (
    <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Institute profile, payment integration status, video anti-piracy controls and SEO defaults."
      />

      {/* Payments — configuration status (env-driven; secrets are never displayed) */}
      <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <KeyRound className="h-4 w-4 text-[#4f46e5]" /> Payments — Razorpay
          </CardTitle>
          <CardDescription>
            Checkout, webhook verification and refunds run through Razorpay. Status is read from server environment
            variables — secrets are never shown here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">API keys (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET):</span>
            {flags.razorpayConfigured ? (
              <Badge className="border-0 bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <ShieldCheck className="h-3 w-3" /> Configured
              </Badge>
            ) : (
              <Badge className="border-0 bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/25">
                Not configured — add the env vars and restart
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">Webhook secret (RAZORPAY_WEBHOOK_SECRET):</span>
            <Badge variant="outline" className={flags.razorpayConfigured ? "border-emerald-200 text-emerald-700" : "border-slate-200 text-slate-500"}>
              {env.RAZORPAY_WEBHOOK_SECRET ? "Configured" : "Not set — webhooks will be rejected"}
            </Badge>
          </div>
          <div className="rounded-lg border border-[#c7d2fe] bg-[#eef2ff]/50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <Webhook className="h-4 w-4 text-[#4f46e5]" /> Webhook endpoint
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Register this URL in the Razorpay dashboard for <span className="font-mono">payment.captured</span>,{" "}
              <span className="font-mono">payment.failed</span> and <span className="font-mono">refund.processed</span> events.
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <code className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-700">{webhookUrl}</code>
              <CopyText value={webhookUrl} label="Copy URL" />
            </div>
          </div>
        </CardContent>
      </Card>

      <SettingsForm
        initial={{
          instituteName: settings.instituteName,
          tagline: settings.tagline,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone ?? null,
          address: settings.address ?? null,
          videoSessionLimit: settings.videoSessionLimit,
          watermarkOpacity: settings.watermarkOpacity,
          playbackTokenTtlMin: settings.playbackTokenTtlMin,
          downloadsEnabled: settings.downloadsEnabled,
          seoTitle: settings.seoTitle ?? null,
          seoDescription: settings.seoDescription ?? null,
        }}
        action={updateSettingsAction}
      />
    </div>
  );
}
