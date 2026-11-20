import Link from "next/link";
import { GraduationCap, Twitter, Linkedin, Youtube, Instagram, Mail, MapPin } from "lucide-react";
import { FOOTER_LINKS, site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="relative mt-auto bg-[#0a0a0a] text-neutral-300">
      {/* brand hairline */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-600 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-0 dot-grid opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dc2626] text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold text-white">{site.shortName.toUpperCase()} Academy</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{site.description}</p>
            <div className="mt-4 flex gap-3">
              {[
                { icon: Twitter, href: site.socials.twitter, label: "Twitter" },
                { icon: Linkedin, href: site.socials.linkedin, label: "LinkedIn" },
                { icon: Youtube, href: site.socials.youtube, label: "YouTube" },
                { icon: Instagram, href: site.socials.instagram, label: "Instagram" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="rounded-lg bg-white/5 p-2 text-neutral-300 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-600 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {[
            { title: "Platform", links: FOOTER_LINKS.platform },
            { title: "Company", links: FOOTER_LINKS.company },
            { title: "Legal", links: FOOTER_LINKS.legal },
          ].map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <div className="flex flex-col gap-1 sm:items-end">
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {site.supportEmail}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Mumbai, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
