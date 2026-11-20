import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Refund Policy" };

const STEPS = [
  {
    title: "1. Write to us within 30 days",
    body: "Email support@bice.example (or use the Contact page) with your order number and the registered email address. No explanation is required, though we genuinely welcome feedback.",
  },
  {
    title: "2. We verify the order",
    body: "We locate the order in our records and confirm it falls within the refund window and has not already been refunded. Orders paid via a 100%-discount coupon are reviewed case by case.",
  },
  {
    title: "3. Refund is raised on Razorpay",
    body: "We raise the refund through Razorpay to the original payment method. Razorpay returns the funds to your bank or card issuer, which typically posts the credit in 5–7 working days depending on your provider.",
  },
  {
    title: "4. Access is revoked",
    body: "Once the refund is processed, enrollment for that course is closed and the course disappears from your dashboard. Certificates already earned before the refund are voided for that course.",
  },
];

const FAQS = [
  {
    q: "What if I bought more than one course?",
    a: "Each course is refunded individually against its own order number. Refunding one course does not affect your other enrollments.",
  },
  {
    q: "Can I get a refund after earning the certificate?",
    a: "If the refund request falls within the 30-day window, yes — but the certificate for that course is voided, since the credential and the refund cannot both stand.",
  },
  {
    q: "What about partial refunds or price drops?",
    a: "We do not offer partial refunds for lessons already watched, and price promotions are time-limited offers that do not retroactively adjust completed orders. Coupons used at checkout are honoured as recorded on the order.",
  },
  {
    q: "Are taxes refunded too?",
    a: "Yes. The full amount charged — including the applicable tax portion on the invoice — is refunded, and a credit note is issued against the original GST-compliant invoice.",
  },
  {
    q: "My refund is taking longer than 7 working days.",
    a: "Occasionally bank or card issuers take extra time to post the credit. Send us the refund reference from your Razorpay confirmation email and we will follow up with the payment processor on your behalf.",
  },
];

export default function RefundPolicyPage() {
  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-slate-50 py-14">
        <div className="mx-auto max-w-4xl space-y-3 px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-wider text-[#4f46e5]">Legal</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Refund Policy</h1>
          <p className="text-sm text-slate-500">Last updated: 1 January 2025 · 30-day money-back guarantee</p>
        </div>
      </section>

      <article className="mx-auto w-full max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Our promise</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Every paid course on BICE Academy comes with a 30-day, no-questions-asked money-back
            guarantee. If a course is not right for you, tell us within 30 days of the purchase date and
            we will refund the full amount you paid — including the tax component — to your original
            payment method. We would rather return your money than keep an unhappy student enrolled.
          </p>
          <p className="text-sm leading-relaxed text-slate-600">
            All payments are processed in INR through Razorpay. Refunds are likewise settled through
            Razorpay to the same instrument used at checkout — we never redirect refunds to a different
            account, and we never ask for your card details or OTP to process a refund.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">How to request a refund</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Refund scenarios</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Situation</th>
                  <th className="px-4 py-3 font-semibold">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="px-4 py-3">Request within 30 days of purchase</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">Full refund to original payment method</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Free course (price ₹0) or 100% coupon</td>
                  <td className="px-4 py-3">Nothing to refund; access is simply removed on request</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Request after 30 days</td>
                  <td className="px-4 py-3">Outside the guarantee window — handled as goodwill on a case-by-case basis</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Duplicate / accidental purchase</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">Full refund, even beyond 30 days, when reported promptly</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Payment captured but course never unlocked</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">Immediate enrollment activation or full refund — your choice</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Repeated refund abuse across orders</td>
                  <td className="px-4 py-3">We may decline further refunds after multiple refunded purchases</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Refund questions</h2>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">{f.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          This policy is part of our{" "}
          <Link href="/terms" className="font-semibold text-[#4f46e5] hover:underline">
            Terms of Service
          </Link>
          . Data handling during refunds is described in the{" "}
          <Link href="/privacy-policy" className="font-semibold text-[#4f46e5] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
