import Link from "next/link";
import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircleQuestion, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ContactForm } from "@/components/public/contact-form";
import { getSettings } from "@/services/settings.service";

export const metadata: Metadata = { title: "Contact Us" };

export default async function ContactPage() {
  const settings = await getSettings();

  const infoCards = [
    {
      icon: Mail,
      label: "Email us",
      value: settings.contactEmail,
      hint: "For course, payment and certificate questions",
    },
    ...(settings.contactPhone
      ? [
          {
            icon: Phone,
            label: "Call / WhatsApp",
            value: settings.contactPhone,
            hint: "Mon–Sat, 9:00 AM – 7:00 PM IST",
          },
        ]
      : []),
    ...(settings.address
      ? [
          {
            icon: MapPin,
            label: "Visit the institute",
            value: settings.address,
            hint: "Walk-in counselling on weekdays",
          },
        ]
      : []),
    {
      icon: Clock,
      label: "Response time",
      value: "Within 1 business day",
      hint: "We reply to every serious enquiry",
    },
  ];

  return (
    <div className="flex w-full flex-col">
      {/* Header band */}
      <section className="w-full bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl space-y-3 px-4 text-center sm:px-6 lg:px-8">
          <span className="text-sm font-bold uppercase tracking-wider text-[#4f46e5]">Contact</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Talk to the BICE team
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
            Choosing a course, need an invoice for your employer, or stuck on a lesson? Send us a
            message — a real member of the faculty team will reply, not a bot.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* Info cards */}
          <div className="space-y-5 lg:col-span-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {infoCards.map((c) => (
                <Card key={c.label} className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                  <CardContent className="flex items-start gap-4 p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-[#4f46e5]">
                      <c.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{c.label}</p>
                      <p className="break-words text-sm text-slate-600">{c.value}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{c.hint}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-[#4f46e5]/30 bg-[#eef2ff]/50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardContent className="flex flex-col gap-2 p-5">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <MessageCircleQuestion className="h-4 w-4 text-[#4f46e5]" /> Looking for quick answers?
                </span>
                <p className="text-sm text-slate-600">
                  Payments, certificates and refunds are covered in our{" "}
                  <Link href="/faq" className="font-semibold text-[#4f46e5] hover:underline">
                    FAQ
                  </Link>
                  . Already a student? Raise questions from your dashboard after login.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900">Send us a message</h2>
                  <p className="text-sm text-slate-500">
                    Fill in the form below. We reply within 1 business day from{" "}
                    <span className="font-medium text-slate-700">{settings.contactEmail}</span>.
                  </p>
                </div>
                <ContactForm supportEmail={settings.contactEmail} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
