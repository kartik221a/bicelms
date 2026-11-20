"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Newsletter signup — client-side confirmation only. This component does not
 * pretend to hit a backend: it validates the address and confirms the intent
 * to the user with a toast.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setPending(true);
    toast.success("You're on the list!");
    setEmail("");
    window.setTimeout(() => setPending(false), 400);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
      aria-label="Newsletter subscription"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <Input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 flex-1 border-white/20 bg-white/10 text-white placeholder:text-red-200 focus-visible:ring-white/40"
      />
      <Button
        type="submit"
        disabled={pending}
        className="h-11 gap-2 bg-white text-[#dc2626] hover:bg-red-50"
      >
        Subscribe <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
