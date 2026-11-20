"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Heart, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ------------------------------------------------------------------ */
/* Razorpay checkout typing (script loaded lazily from Razorpay CDN)   */
/* ------------------------------------------------------------------ */

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number; // paise
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string };
  theme?: { color: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface OrderApiResult {
  ok: boolean;
  data?: {
    order: { finalAmount: number; status: string };
    razorpay: { keyId: string; orderId: string; amount: number; currency: string } | null;
    setupRequired?: { integration: string; envVars: string[] };
  };
  error?: { code: string; message: string };
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ------------------------------------------------------------------ */
/* Enroll / buy button                                                 */
/* ------------------------------------------------------------------ */

export function EnrollButton({
  courseId,
  courseTitle,
  slug,
  isLoggedIn,
  studentName,
  studentEmail,
}: {
  courseId: string;
  courseTitle: string;
  slug: string;
  isLoggedIn: boolean;
  studentName?: string;
  studentEmail?: string;
}) {
  const router = useRouter();
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupMsg, setSetupMsg] = useState<{ integration: string; envVars: string[] } | null>(null);

  function verifyAndFinish(resp: RazorpayHandlerResponse) {
    fetch("/api/v1/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resp),
    })
      .then((r) => r.json())
      .then((body: { ok: boolean; error?: { message: string } }) => {
        if (!body.ok) {
          toast.error(body.error?.message ?? "Payment verification failed.");
          return;
        }
        toast.success("Payment successful — you're enrolled!");
        router.push("/dashboard?enrolled=1");
      })
      .catch(() => toast.error("Could not verify the payment. Contact support if money was debited."));
  }

  async function handleEnroll() {
    if (!isLoggedIn) {
      router.push(`/login?next=/courses/${slug}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          ...(coupon.trim() ? { couponCode: coupon.trim() } : {}),
        }),
      });
      const body = (await res.json()) as OrderApiResult;

      if (!body.ok || !body.data) {
        toast.error(body.error?.message ?? "Could not start the checkout.");
        return;
      }

      const { order, razorpay, setupRequired } = body.data;

      // Free course (or 100% coupon): the order is already paid server-side.
      if (!razorpay && !setupRequired) {
        if (order.status === "paid") {
          toast.success("You're enrolled — welcome aboard!");
          router.push("/dashboard?enrolled=1");
        }
        return;
      }

      // Honest setup state: Razorpay keys are not configured on the server.
      if (setupRequired) {
        setSetupMsg(setupRequired);
        setSetupOpen(true);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        toast.error("Could not load the payment gateway. Check your connection and retry.");
        return;
      }
      if (!razorpay) {
        toast.error("Payment gateway did not return an order. Please try again.");
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpay.keyId,
        order_id: razorpay.orderId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        name: "BICE Academy",
        description: courseTitle,
        prefill: { name: studentName, email: studentEmail },
        theme: { color: "#dc2626" },
        handler: verifyAndFinish,
        modal: { ondismiss: () => toast.info("Checkout closed before payment.") },
      });
      rzp.open();
    } catch {
      toast.error("Something went wrong while starting checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor="coupon-code" className="mb-1.5 block text-xs font-medium text-slate-500">
          Have a coupon code?
        </label>
        <Input
          id="coupon-code"
          placeholder="e.g. WELCOME10"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          className="h-10"
        />
      </div>
      <Button
        onClick={handleEnroll}
        disabled={loading}
        size="lg"
        className="h-12 w-full gap-2 bg-[#dc2626] text-base font-semibold hover:bg-[#b91c1c]"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-5 w-5" />}
        {isLoggedIn ? "Enroll now" : "Log in to enroll"}
      </Button>

      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" /> Online payments are not configured
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                <p>
                  Razorpay is not configured — add{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-semibold">
                    {setupMsg?.envVars.join(" and ") ?? "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"}
                  </code>{" "}
                  to the environment to enable real checkout.
                </p>
                <p className="mt-2">
                  No fake payments are simulated. Your order was recorded but stays unpaid until the
                  gateway is set up.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wishlist (localStorage)                                             */
/* ------------------------------------------------------------------ */

const WISHLIST_KEY = "bice:wishlist";

function readWishlist(): string[] {
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function WishlistButton({ slug, title }: { slug: string; title: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(readWishlist().includes(slug));
  }, [slug]);

  function toggle() {
    const list = readWishlist();
    const next = list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    setActive(next.includes(slug));
    if (next.includes(slug)) {
      toast.success(`Saved “${title}” to your wishlist.`);
    } else {
      toast.info(`Removed “${title}” from your wishlist.`);
    }
  }

  return (
    <Button
      onClick={toggle}
      variant="outline"
      size="lg"
      className={`h-12 w-full gap-2 ${active ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" : ""}`}
      aria-pressed={active}
    >
      <Heart className={`h-5 w-5 ${active ? "fill-rose-500 text-rose-500" : ""}`} />
      {active ? "Saved to wishlist" : "Add to Wishlist"}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Enrolled state                                                      */
/* ------------------------------------------------------------------ */

export function GoToCourseButton({ slug }: { slug: string }) {
  return (
    <Button
      asChild
      size="lg"
      className="h-12 w-full gap-2 bg-emerald-600 text-base font-semibold hover:bg-emerald-700"
    >
      <Link href="/my-courses">
        <BadgeCheck className="h-5 w-5" /> Go to course
      </Link>
    </Button>
  );
}
