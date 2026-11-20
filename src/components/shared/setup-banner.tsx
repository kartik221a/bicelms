"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface SessionInfo {
  setupMode: boolean;
  dataProvider: string;
  integrations: { firebase: boolean; razorpay: boolean; cloudinary: boolean; email: boolean };
}

/**
 * Setup-state banner (master prompt §17): when external integrations lack
 * credentials, the platform is honest about what is active vs pending.
 */
export function SetupBanner() {
  const [info, setInfo] = useState<SessionInfo | null>(null);

  useEffect(() => {
    fetch("/api/v1/auth/session")
      .then((r) => r.json())
      .then((d) => setInfo(d.data))
      .catch(() => {});
  }, []);

  if (!info?.setupMode) return null;
  const missing = Object.entries(info.integrations)
    .filter(([, ok]) => !ok)
    .map(([k]) => k);

  return (
    <div className="border-b border-amber-200 bg-amber-50 text-amber-900">
      <div className="mx-auto max-w-7xl px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-semibold">Setup mode</span>
          <span className="text-amber-800">
            — running on the local data provider (<code className="rounded bg-amber-100 px-1">{info.dataProvider}</code>).
            Pending integrations: {missing.join(", ") || "none"}. Add the environment
            variables from <code className="rounded bg-amber-100 px-1">.env.example</code> to activate them.
          </span>
          <a href="https://github.com/kartik221a/bicelms#environment-variables" target="_blank" rel="noreferrer" className="ml-auto hidden items-center gap-1 font-medium underline sm:flex">
            Setup guide <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
      <Progress value={40} className="hidden h-0" />
    </div>
  );
}
