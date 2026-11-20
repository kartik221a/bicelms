"use client";

import * as React from "react";
import { Info, X } from "lucide-react";
import { fetchSessionInfo } from "@/components/auth/auth-api";

/**
 * Dismissible dev/demo hint shown on the login card only while the platform is
 * in setup mode (local auth provider, no Firebase). Fetches the session info
 * client-side and stays hidden when setupMode is false.
 */
export function DemoAccountsHint() {
  const [visible, setVisible] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetchSessionInfo()
      .then((info) => {
        if (!cancelled && info?.setupMode) setVisible(true);
      })
      .catch(() => {
        // session probe failed — never block the login form for a hint
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div
      role="note"
      aria-label="Demo accounts available in setup mode"
      className="mb-6 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-accent/60 p-3 text-xs text-accent-foreground"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1 leading-relaxed">
        <span className="font-semibold">Demo accounts (dev):</span>{" "}
        <span className="font-mono text-[11px]">admin@bice.local / Admin@12345</span>
        <span className="mx-1.5">&middot;</span>
        <span className="font-mono text-[11px]">rahul@example.com / Student@12345</span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss demo accounts hint"
        className="rounded p-0.5 text-accent-foreground/70 transition-colors hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
