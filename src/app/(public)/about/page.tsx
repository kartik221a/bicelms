import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Award,
  BookOpen,
  Compass,
  HeartHandshake,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listPublishedCourses } from "@/services/course.service";
import { store } from "@/repositories";

export const metadata: Metadata = { title: "About Us" };

interface InstructorInfo {
  id: string;
  name: string;
  title?: string | null;
  bio?: string | null;
  credentials?: string | null;
  photoUrl?: string | null;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AboutPage() {
  const [catalog, instructors] = await Promise.all([
    listPublishedCourses({ sort: "popularity", page: 1, pageSize: 48 }),
    store.list<InstructorInfo>("instructors", { orderBy: [{ field: "createdAt" }] }),
  ]);

  const courses = catalog.items;
  const studentsTrained = courses.reduce((acc, c) => acc + (c.studentsCount ?? 0), 0);
  const rated = courses.filter((c) => c.ratingCount > 0);
  const avgRating =
    rated.length > 0
      ? Math.round((rated.reduce((acc, c) => acc + c.ratingAvg, 0) / rated.length) * 10) / 10
      : null;
  const leadInstructor = instructors[0];

  const mission = [
    {
      icon: Lightbulb,
      title: "Practical-first curriculum",
      body: "Every lesson is built around a dataset you would actually meet at work — GL extracts, sales pipelines, marketing exports. Theory is taught only where it makes the practice stick.",
    },
    {
      icon: Award,
      title: "Verified outcomes",
      body: "Completion is measured lesson by lesson. Certificates are issued automatically once every published lesson is finished, and each one carries a publicly verifiable ID.",
    },
    {
      icon: HeartHandshake,
      title: "Support that outlasts the course",
      body: "Lifetime access to videos and resources, regular doubt-clearing sessions for enrolled students, and moderated Q&A — because careers are marathons, not weekend sprints.",
    },
  ];

  const milestones = [
    { label: "Founded", value: "2016", hint: "Mumbai, India" },
    { label: "Professionals trained", value: `${studentsTrained.toLocaleString("en-IN")}+`, hint: "Across published programs" },
    { label: "Published programs", value: String(courses.length), hint: "Excel, SQL, Python, BI" },
    { label: "Average rating", value: avgRating ? `${avgRating.toFixed(1)} / 5` : "—", hint: "Verified student reviews" },
  ];

  return (
    <div className="flex w-full flex-col">
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#4f46e5] py-20 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative mx-auto max-w-4xl space-y-6 px-4 text-center sm:px-6 lg:px-8">
          <Badge className="bg-white/10 uppercase tracking-wider text-indigo-200 hover:bg-white/10">
            Business Intelligence &amp; Corporate Education
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            We turn spreadsheet users into data professionals
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-indigo-200 sm:text-base">
            BICE Academy is a Mumbai-based coaching institute for working professionals. Since 2016 we
            have helped analysts, accountants and operations teams move from copy-paste Excel to
            automated Power Query pipelines, production SQL and decision-grade dashboards.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button asChild size="lg" className="h-12 bg-white px-6 text-base font-semibold text-[#4f46e5] hover:bg-indigo-50">
              <Link href="/courses">Explore courses</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/30 bg-transparent px-6 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/contact">Talk to our team</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="w-full border-b border-slate-200 bg-white py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {milestones.map((m) => (
            <div key={m.label} className="flex flex-col space-y-1">
              <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{m.value}</div>
              <div className="text-sm font-semibold text-[#4f46e5]">{m.label}</div>
              <p className="text-xs text-slate-500">{m.hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="w-full bg-slate-50 py-20">
        <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-2 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-[#4f46e5]">Our story</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Built by practitioners, for practitioners
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            BICE started in a single classroom in Andheri with one conviction: corporate training was
            teaching tools, not judgement. Professionals were memorising formula syntax but freezing when
            a real GL dump landed in their inbox at 6 PM on a Friday. So we rebuilt the curriculum around
            the messy, urgent, real work — cleaning exports that don&apos;t match, reconciling ledgers
            that disagree, and turning raw numbers into decks that executives actually trust.
          </p>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            As cohorts grew, the classroom moved online without losing its soul. Today the BICE platform
            streams every lesson with progress tracking and per-student watermarks, issues verified
            certificates on completion, and accepts secure INR payments through Razorpay — but the core
            is unchanged: small, rigorous, hands-on programs taught by people who do this work for a
            living.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="w-full bg-white py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="space-y-2 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-[#4f46e5]">Mission</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              What we promise every learner
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {mission.map((m) => (
              <Card key={m.title} className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                <CardContent className="flex flex-col gap-3 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#eef2ff] text-[#4f46e5]">
                    <m.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold text-slate-900">{m.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{m.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor profile */}
      {leadInstructor ? (
        <section className="w-full bg-slate-50 py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <Card className="border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <CardContent className="grid gap-8 p-6 md:grid-cols-[auto_1fr] md:p-8">
                {leadInstructor.photoUrl ? (
                  <img
                    src={leadInstructor.photoUrl}
                    alt={leadInstructor.name}
                    className="h-28 w-28 rounded-full object-cover ring-4 ring-[#eef2ff]"
                  />
                ) : (
                  <span className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#0f172a] to-[#4f46e5] text-3xl font-bold text-white ring-4 ring-[#eef2ff]">
                    {initialsOf(leadInstructor.name)}
                  </span>
                )}
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4f46e5]">Faculty spotlight</span>
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{leadInstructor.name}</h2>
                  <p className="text-sm font-medium text-slate-600">{leadInstructor.title}</p>
                  {leadInstructor.bio ? (
                    <p className="text-sm leading-relaxed text-slate-600">{leadInstructor.bio}</p>
                  ) : null}
                  {leadInstructor.credentials ? (
                    <Badge className="w-fit bg-[#eef2ff] text-[#4f46e5] hover:bg-[#eef2ff]">
                      <Award className="h-3.5 w-3.5" /> {leadInstructor.credentials}
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {/* How we teach */}
      <section className="w-full bg-white py-20">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="space-y-2 text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-[#4f46e5]">Teaching approach</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              The BICE learning loop
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {[
              { icon: Compass, step: "01", title: "Watch", body: "Short, focused lessons — no filler. Each concept demonstrated on a live dataset." },
              { icon: BookOpen, step: "02", title: "Practice", body: "You redo the exact workflow on the downloadable dataset before moving on." },
              { icon: Target, step: "03", title: "Build", body: "Section projects combine skills into deliverables you can show your manager." },
              { icon: TrendingUp, step: "04", title: "Certify", body: "Finish all lessons, earn your verified certificate, and add it to your resume." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef2ff] text-[#4f46e5]">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="text-2xl font-extrabold text-slate-200">{s.step}</span>
                </div>
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-slate-50 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
            <Users className="h-7 w-7" />
          </span>
          <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Join the next cohort and upgrade the way you work with data
          </h2>
          <Button asChild size="lg" className="h-12 bg-[#4f46e5] px-6 text-base font-semibold hover:bg-[#4338ca]">
            <Link href="/courses">
              Browse courses <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
