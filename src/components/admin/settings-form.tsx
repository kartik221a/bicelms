"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SettingsFormInitial {
  instituteName: string;
  tagline: string;
  contactEmail: string;
  contactPhone?: string | null;
  address?: string | null;
  videoSessionLimit: number;
  watermarkOpacity: number;
  playbackTokenTtlMin: number;
  downloadsEnabled: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

const TTL_OPTIONS = [5, 10, 15, 30, 60];

export function SettingsForm({
  initial,
  action,
}: {
  initial: SettingsFormInitial;
  action: (formData: FormData) => Promise<unknown>;
}) {
  const [pending, startTransition] = useTransition();
  const [opacity, setOpacity] = useState(initial.watermarkOpacity ?? 0.12);
  const [ttl, setTtl] = useState(String(initial.playbackTokenTtlMin ?? 15));
  const [downloads, setDownloads] = useState(initial.downloadsEnabled ?? false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("watermarkOpacity", String(opacity));
    fd.set("playbackTokenTtlMin", ttl);
    fd.set("downloadsEnabled", downloads ? "on" : "");
    startTransition(async () => {
      try {
        await action(fd);
        toast.success("Settings saved");
        form.reset();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save settings");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Institute profile */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Institute profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="instituteName">Institute name</Label>
            <Input id="instituteName" name="instituteName" defaultValue={initial.instituteName} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" name="tagline" defaultValue={initial.tagline} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input id="contactPhone" name="contactPhone" defaultValue={initial.contactPhone ?? ""} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" rows={2} defaultValue={initial.address ?? ""} />
          </div>
        </div>
      </section>

      {/* Video security */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Video security</h2>
        <p className="mt-1 text-xs text-slate-500">
          Anti-piracy controls applied to every playback session: per-student watermark, signed short-lived tokens and
          session caps.
        </p>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="videoSessionLimit">Concurrent video sessions per student</Label>
            <Input id="videoSessionLimit" name="videoSessionLimit" type="number" min={1} max={10} defaultValue={String(initial.videoSessionLimit)} />
          </div>
          <div className="space-y-1.5">
            <Label>Playback token lifetime</Label>
            <input type="hidden" name="playbackTokenTtlMin" value={ttl} />
            <Select value={ttl} onValueChange={setTtl}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TTL_OPTIONS.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m} minutes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="watermarkOpacity">Watermark opacity</Label>
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">{opacity.toFixed(2)}</span>
            </div>
            <Slider
              id="watermarkOpacity"
              min={0.05}
              max={0.3}
              step={0.01}
              value={[opacity]}
              onValueChange={(v) => setOpacity(v[0] ?? opacity)}
              className="max-w-sm"
              aria-label="Watermark opacity"
            />
            <p className="text-xs text-slate-500">Range 0.05 – 0.30. Lower = subtler, higher = stronger deterrent.</p>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 md:col-span-2">
            <div>
              <p className="text-sm font-medium text-slate-800">Resource downloads</p>
              <p className="text-xs text-slate-500">Allow enrolled students to download gated resources and assignments.</p>
            </div>
            <Switch checked={downloads} onCheckedChange={setDownloads} aria-label="Toggle downloads" />
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">SEO</h2>
        <div className="mt-4 grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input id="seoTitle" name="seoTitle" defaultValue={initial.seoTitle ?? ""} placeholder="BICE Academy — Master Data Skills That Drive Your Career" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seoDescription">SEO description</Label>
            <Textarea id="seoDescription" name="seoDescription" rows={2} defaultValue={initial.seoDescription ?? ""} />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={pending} className="bg-[#dc2626] text-white hover:bg-[#b91c1c]">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save all settings
        </Button>
      </div>
    </form>
  );
}
