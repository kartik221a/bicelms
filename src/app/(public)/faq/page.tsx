import Link from "next/link";
import type { Metadata } from "next";
import { Award, BookOpen, CreditCard, LifeBuoy } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const metadata: Metadata = { title: "FAQ" };

const GROUPS = [
  {
    id: "courses",
    icon: BookOpen,
    title: "Courses & learning",
    items: [
      {
        q: "What courses does BICE offer?",
        a: "We publish structured programs across five disciplines: Advanced Excel, Power Query, SQL, Python for data analysis, and business dashboards (Power BI). Each course includes video lessons, downloadable practice files, and hands-on projects built on real business datasets.",
      },
      {
        q: "Can I try a course before buying?",
        a: "Yes. Most courses have one or more lessons marked as “Free Preview” — you can watch them on the course page without an account. If a course offers a free introductory course (like Excel for Beginners), you can enroll at zero cost from the catalog.",
      },
      {
        q: "How long do I have access after enrolling?",
        a: "Lifetime access. Videos, resources and any future updates to the course remain available on your dashboard permanently — there is no expiry or renewal fee.",
      },
      {
        q: "How is my progress tracked?",
        a: "The platform records your watching position per lesson. A lesson is marked complete automatically once you have watched at least 90% of it (or when you mark it complete manually if the instructor enabled that rule). Your course progress percentage updates as lessons complete.",
      },
      {
        q: "Can I download the videos?",
        a: "No — videos are streamed with per-student watermarking to protect instructor content. All practice files, cheat sheets and templates, however, are downloadable from your dashboard once you reach the required lesson.",
      },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Payments & refunds",
    items: [
      {
        q: "Which payment methods are accepted?",
        a: "We accept UPI, credit/debit cards, net banking and popular wallets in INR, processed securely through Razorpay. BICE never sees or stores your card details — they are handled entirely by Razorpay's PCI-DSS compliant checkout.",
      },
      {
        q: "Can I use a coupon code?",
        a: "Yes. Enter the coupon code on the checkout panel of the course page before clicking Enroll. The discount is validated and applied server-side; if a coupon brings the price to zero, you are enrolled instantly without any payment step.",
      },
      {
        q: "Do I get a GST invoice?",
        a: "Yes. Every paid order generates an order number and a GST-compliant invoice. Orders are recorded with the applicable tax treatment for Indian customers, and the invoice is included in your payment confirmation email.",
      },
      {
        q: "What is your refund policy?",
        a: "We offer a 30-day money-back guarantee on every paid course: if you are not satisfied within 30 days of purchase, write to support@bice.example (or use the Contact page) with your order number and we will process a full refund to the original payment method. Refunds typically reflect in 5–7 working days.",
      },
      {
        q: "My payment succeeded but the course is not unlocked.",
        a: "Enrollment is created immediately after Razorpay's signature verification succeeds. If your payment was captured but access did not open (for example, you closed the browser before the redirect), contact support with the Razorpay payment ID — we reconcile it against the webhook record and activate your enrollment manually.",
      },
    ],
  },
  {
    id: "certificates",
    icon: Award,
    title: "Certificates",
    items: [
      {
        q: "How do I earn a certificate?",
        a: "Complete every published lesson of a certificate-enabled course. The platform verifies completion automatically and issues a BICE certificate with a unique ID — no manual application needed.",
      },
      {
        q: "Can anyone verify my certificate?",
        a: "Yes. Every certificate carries a public verification link of the form /verify-certificate/<ID>. Anyone — including recruiters — can enter the ID on the Verify a Certificate page to confirm the student name, course, issue date and instructor.",
      },
      {
        q: "Can I download the certificate as a PDF?",
        a: "Yes. From the certificate verification page (or your certificates dashboard) you can download a print-ready PDF, signed by the institute and including the verification URL.",
      },
      {
        q: "I lost my certificate ID. What do I do?",
        a: "Log in and open the Certificates section of your dashboard — all issued certificates are listed there with their IDs and download links. If you cannot access your account, email support@bice.example from your registered address.",
      },
    ],
  },
  {
    id: "account",
    icon: LifeBuoy,
    title: "Account & platform",
    items: [
      {
        q: "How do I create an account?",
        a: "Click “Get Started” in the header and register with your name, email and a password. Sessions are secured with HTTP-only cookies and your credentials are verified through Firebase Authentication.",
      },
      {
        q: "I forgot my password.",
        a: "Use the “Forgot password” link on the login page. We email you a time-limited, single-use reset link. If the email does not arrive within a few minutes, check spam or contact support.",
      },
      {
        q: "Who can see my data?",
        a: "Your name and email are used for enrollment, certificates and order records. Instructors and admins can see your progress within the courses you enroll in. We never sell personal data — see the Privacy Policy for the full picture.",
      },
      {
        q: "Can I switch devices and continue where I left off?",
        a: "Yes. Progress, notes and watch positions are stored against your account, so you can start a lesson on your laptop and resume it on your phone from the exact same position.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl space-y-3 px-4 text-center sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-wider text-[#dc2626]">Help center</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
            Everything about courses, payments, certificates and your account. Still stuck?{" "}
            <Link href="/contact" className="font-semibold text-[#dc2626] hover:underline">
              Contact the team
            </Link>{" "}
            — we reply within one business day.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {GROUPS.map((group) => (
          <div key={group.id} className="space-y-4">
            <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fef2f2] text-[#dc2626]">
                <group.icon className="h-4.5 w-4.5" />
              </span>
              {group.title}
            </h2>
            <Accordion type="single" collapsible className="rounded-xl border border-slate-200 bg-white px-5">
              {group.items.map((item, i) => (
                <AccordionItem key={item.q} value={`${group.id}-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold text-slate-900 sm:text-base">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-slate-600">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </section>
    </div>
  );
}
