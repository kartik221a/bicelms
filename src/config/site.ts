export const site = {
  name: "BICE Academy",
  shortName: "BICE",
  tagline: "Master Data Skills That Drive Your Career",
  description:
    "BICE is a professional coaching institute for data skills — Advanced Excel, Power Query, SQL, Python and Business Dashboards — with structured courses, hands-on projects and verified certificates.",
  supportEmail: "support@bice.example",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  socials: {
    twitter: "https://twitter.com/biceacademy",
    linkedin: "https://linkedin.com/company/biceacademy",
    youtube: "https://youtube.com/@biceacademy",
    instagram: "https://instagram.com/biceacademy",
  },
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_LINKS = {
  platform: [
    { href: "/courses", label: "All Courses" },
    { href: "/dashboard", label: "Student Dashboard" },
    { href: "/certificates", label: "Certificates" },
    { href: "/verify-certificate", label: "Verify a Certificate" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "FAQ" },
  ],
  legal: [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/refund-policy", label: "Refund Policy" },
  ],
} as const;

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const RESOURCE_TYPES = [
  "pdf",
  "cheatsheet",
  "practice_file",
  "template",
  "assignment",
  "external",
  "other",
] as const;
