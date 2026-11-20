"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Copies the public verification URL for a certificate to the clipboard. */
export function CopyVerificationButton({ certificateId }: { certificateId: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/verify-certificate/${certificateId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Verification link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — your browser blocked clipboard access.");
    }
  }

  return (
    <Button variant="outline" onClick={() => void copy()} className="gap-2">
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : "Copy verification link"}
    </Button>
  );
}
