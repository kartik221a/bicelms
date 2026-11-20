import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

const SECTIONS: { heading: string; paragraphs: string[] }[] = [
  {
    heading: "1. Who we are",
    paragraphs: [
      "BICE Academy (“BICE”, “we”, “us”) operates an online learning platform offering coaching courses in Excel, Power Query, SQL, Python and business dashboards. This Privacy Policy explains what personal data we collect when you browse bice.example, enroll in a course, or contact our team, and how that data is used, stored and protected. It applies to students, prospective students and visitors in India and elsewhere.",
    ],
  },
  {
    heading: "2. Data we collect",
    paragraphs: [
      "Account data: when you register, we collect your name, email address and (optionally) phone number. Passwords are never stored in plain text — credentials are verified through Firebase Authentication, and our servers retain only an identity reference plus your role and account status.",
      "Learning data: to run the classroom, we record which courses you enroll in, which lessons you open, your watch position and completion status, notes you write, and certificates you earn. This data exists to give you progress tracking and to issue certificates you can verify.",
      "Order data: when you purchase a course, we store an order record containing the course, amount, currency, applied coupon and payment status. Card numbers, UPI PINs and bank credentials are never entered on our platform and never reach our servers — all payment instrument data is captured and processed by Razorpay under its PCI-DSS Level 1 certification.",
      "Support data: messages you send through the contact form or by email are retained so we can answer them and keep a service history.",
      "Technical data: like most web services, we log IP address, browser type and timestamps for security auditing, abuse prevention and troubleshooting.",
    ],
  },
  {
    heading: "3. How we use your data",
    paragraphs: [
      "We use personal data to: create and secure your account; provide access to enrolled courses; track progress and issue verified certificates; process payments, refunds and GST-compliant invoices through Razorpay; send transactional emails (enrollment confirmations, payment receipts, certificate issuance, password resets); respond to support requests; and improve course content based on aggregated, anonymised learning patterns.",
      "We do not sell or rent personal data. We do not use your learning data for advertising, and we do not send marketing emails unless you explicitly subscribe to the newsletter — from which you can unsubscribe at any time.",
    ],
  },
  {
    heading: "4. Where your data is stored and who processes it",
    paragraphs: [
      "Application data is stored in our managed databases. Authentication is handled by Google Firebase Authentication, which processes your email and credential tokens as an independent controller under its own privacy terms. Course media are delivered through Cloudinary's CDN infrastructure, which stores video assets and signed delivery URLs. Payment processing, order creation and refund settlement are performed by Razorpay Software Private Limited, which acts as a controller for the payment data you enter in its checkout window.",
      "These providers are engaged purely to operate the service. We share the minimum data each provider needs: Firebase receives authentication identifiers, Razorpay receives the order amount and receipt reference, and Cloudinary handles media delivery without access to your account data.",
    ],
  },
  {
    heading: "5. Data retention",
    paragraphs: [
      "Account, enrollment and certificate records are retained for as long as your account is active, because they are required to honour lifetime access and public certificate verification. Order and invoice records are retained for the period required under Indian tax and accounting rules. Support correspondence is retained for up to 24 months. Password reset and email verification tokens expire automatically within hours of issue.",
      "You may request deletion of your account by writing to support@bice.example from your registered email address. We will remove or anonymise your personal data except for records we are legally required to keep (invoices, payment references) and except for issued certificates, which remain publicly verifiable to protect the integrity of the credential.",
    ],
  },
  {
    heading: "6. Your rights",
    paragraphs: [
      "Subject to applicable Indian law (including the Digital Personal Data Protection Act, 2023) you may request access to the personal data we hold about you, ask for correction of inaccurate data, and withdraw consent for optional communications. Requests are handled within 30 days via support@bice.example.",
      "Certificate records are intentionally public by design: anyone holding a certificate ID can verify the student name, course and issue date on our verification page. No other personal data is exposed through verification.",
    ],
  },
  {
    heading: "7. Security",
    paragraphs: [
      "We apply defence-in-depth measures: HTTP-only signed session cookies, server-side authorisation on every protected page and API route, per-student watermarking on streamed video, signed and expiring media URLs, and webhook signature verification for payment events. No system is perfectly secure; if a breach affecting your data ever occurs, we will notify affected users and applicable authorities without undue delay.",
    ],
  },
  {
    heading: "8. Changes and contact",
    paragraphs: [
      "We may update this policy as the platform evolves; material changes will be announced on this page with a new “last updated” date. Questions about this policy can be sent to support@bice.example or raised through the contact form. See also our Terms of Service and Refund Policy.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-slate-50 py-14">
        <div className="mx-auto max-w-4xl space-y-3 px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-wider text-[#dc2626]">Legal</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: 1 January 2025 · Applies to bice.example</p>
        </div>
      </section>

      <article className="mx-auto w-full max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {SECTIONS.map((s) => (
          <section key={s.heading} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
          </section>
        ))}
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          This document is provided for transparency about how the platform operates. Related pages:{" "}
          <Link href="/terms" className="font-semibold text-[#dc2626] hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/refund-policy" className="font-semibold text-[#dc2626] hover:underline">
            Refund Policy
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
