import { store } from "@/repositories";

export interface SettingsDoc {
  id: string;
  instituteName: string;
  tagline: string;
  logoUrl?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  address?: string | null;
  socials: string;
  currency: string;
  taxPercent: number;
  razorpayKeyId?: string | null;
  videoSessionLimit: number;
  watermarkOpacity: number;
  playbackTokenTtlMin: number;
  downloadsEnabled: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  updatedAt: string;
}

const SINGLETON_ID = "singleton";

export async function getSettings(): Promise<SettingsDoc> {
  let s = await store.get<SettingsDoc>("platformSettings", SINGLETON_ID);
  if (!s) {
    s = await store.create<SettingsDoc>("platformSettings", { id: SINGLETON_ID });
  }
  return s;
}

export async function updateSettings(patch: Partial<SettingsDoc>) {
  const current = await getSettings();
  return store.update<SettingsDoc>("platformSettings", current.id, patch);
}

export function parseSocials(s?: string | null): Record<string, string> {
  try {
    return JSON.parse(s ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}
