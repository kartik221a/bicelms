import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service" };

const SECTIONS: { heading: string; paragraphs?: string[]; bullets?: string[] }[] = [
  {
    heading: "1. Agreement",
    paragraphs: [
      "These Terms of Service (“Terms”) govern your use of the BICE Academy platform at bice.example, including all courses, videos, downloadable resources, certificates and related services. By creating an account, enrolling in a course, or using any part of the platform, you agree to these Terms. If you are enrolling on behalf of an employer, you confirm you are authorised to bind that entity.",
      "BICE Academy is operated from Mumbai, Maharashtra, India. Courses are delivered in English and priced in Indian Rupees (INR).",
    ],
  },
  {
    heading: "2. Accounts and eligibility",
    paragraphs: [
      "You must provide accurate registration details and keep them up to date. Accounts are personal: you may not share your credentials, automate access, or allow multiple people to use one student account. Sessions are secured via Firebase Authentication and HTTP-only cookies; you are responsible for activity that occurs under your login. We may suspend accounts engaged in credential sharing, scraping, payment fraud or abuse of instructors and staff.",
    ],
  },
  {
    heading: "3. Enrollments, pricing and taxes",
    paragraphs: [
      "Course prices are displayed in INR and payable through Razorpay (UPI, cards, net banking, wallets). The price you pay is confirmed at checkout; the applicable coupon discount, if any, is validated server-side before the order is created.",
      "Prices are inclusive of applicable taxes for Indian consumers, and every paid order generates a GST-compliant invoice bearing the order number, course description and the tax treatment applicable at the time of sale. Employers can request invoice copies at support@bice.example with the order number.",
      "Enrollment is granted only after payment is verified — either through Razorpay checkout signature verification or a trusted webhook event. Free courses and 100%-coupon enrollments are activated immediately without a payment step.",
    ],
  },
  {
    heading: "4. License to course content",
    paragraphs: [
      "All video lessons, slides, practice files, cheat sheets and templates are owned by BICE Academy or its instructors and are licensed to you, the enrolled student, for personal, non-commercial learning. When you enroll you receive a perpetual, non-exclusive, non-transferable license to:",
    ],
    bullets: [
      "Stream the enrolled course's videos for yourself, on any device, for as long as the platform operates;",
      "Download and use the resources attached to your enrolled courses for your own work and study;",
      "Use completed project artifacts (dashboards, scripts, models you build following the course) freely in your job or portfolio.",
    ],
  },
  {
    heading: "5. Prohibited conduct",
    paragraphs: [
      "You may not record, redistribute, resell or publicly screen course videos; share downloadable resources outside your organisation's normal internal use in a manner that substitutes for enrollment; circumvent watermarking, signed URLs or playback controls; scrape the platform or attempt to access other students' data; or misrepresent certificates as professional licences. Certificates attest to course completion only and are verifiable exclusively through our official verification page.",
    ],
  },
  {
    heading: "6. Certificates",
    paragraphs: [
      "Certificates are issued automatically when every published lesson of a certificate-enabled course is completed. Each certificate carries a unique ID that anyone can verify publicly. BICE may revoke a certificate obtained through fraudulent means (for example, scripted completion or account sharing) and will refund nothing in such cases beyond statutory requirements.",
    ],
  },
  {
    heading: "7. Refunds",
    paragraphs: [
      "Paid courses carry a 30-day, no-questions-asked refund window from the date of purchase. Refund mechanics, exclusions (for example abuse of repeated refund requests) and processing timelines are described in the Refund Policy, which forms part of these Terms.",
    ],
  },
  {
    heading: "8. Availability and changes",
    paragraphs: [
      "We aim for continuous availability but do not guarantee uninterrupted service; maintenance windows are announced in advance where possible. We may update course content, add lessons, correct errors or retire outdated material — enrolled students retain access to the updated curriculum. If we ever discontinue a course you are enrolled in, we will provide reasonable notice and either retain access to existing material or offer a comparable alternative.",
    ],
  },
  {
    heading: "9. Limitation of liability and governing law",
    paragraphs: [
      "The platform and content are provided “as is”. While our curriculum is designed with care, BICE does not guarantee specific employment, salary or exam outcomes, and to the maximum extent permitted by law our aggregate liability for any claim is limited to the amount you paid for the course giving rise to the claim. These Terms are governed by the laws of India, and courts in Mumbai, Maharashtra shall have exclusive jurisdiction.",
    ],
  },
  {
    heading: "10. Contact",
    paragraphs: [
      "Questions about these Terms can be sent to support@bice.example or submitted through the contact page. Related documents: Privacy Policy and Refund Policy.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="flex w-full flex-col">
      <section className="w-full bg-slate-50 py-14">
        <div className="mx-auto max-w-4xl space-y-3 px-4 sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-wider text-[#4f46e5]">Legal</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Terms of Service</h1>
          <p className="text-sm text-slate-500">Last updated: 1 January 2025 · Applies to bice.example</p>
        </div>
      </section>

      <article className="mx-auto w-full max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {SECTIONS.map((s) => (
          <section key={s.heading} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">{s.heading}</h2>
            {s.paragraphs?.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
            {s.bullets ? (
              <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-slate-600">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Related pages:{" "}
          <Link href="/privacy-policy" className="font-semibold text-[#4f46e5] hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/refund-policy" className="font-semibold text-[#4f46e5] hover:underline">
            Refund Policy
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
