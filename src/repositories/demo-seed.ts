import { Collection } from "./types";
import { hashPassword } from "@/lib/crypto";

/**
 * Demo seed for the in-memory setup-mode store — mirrors prisma/seed.ts so
 * the local SQLite provider and the serverless memory provider present the
 * same demo catalog (courses, curriculum, accounts, coupons, announcements).
 * Deterministic IDs keep deep links (course slugs, lesson deep links,
 * certificate lookups) stable between reloads of the demo data.
 */

const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
];

const iso = (d: Date) => d.toISOString();

export function buildDemoSeed(): Map<Collection, Map<string, Record<string, unknown>>> {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400e3);

  const cats: Record<Collection, Map<string, Record<string, unknown>>> = {
    users: new Map(),
    verificationTokens: new Map(),
    instructors: new Map(),
    categories: new Map(),
    courses: new Map(),
    sections: new Map(),
    lessons: new Map(),
    resources: new Map(),
    enrollments: new Map(),
    lessonProgress: new Map(),
    orders: new Map(),
    payments: new Map(),
    refunds: new Map(),
    coupons: new Map(),
    couponRedemptions: new Map(),
    reviews: new Map(),
    notes: new Map(),
    announcements: new Map(),
    notifications: new Map(),
    certificates: new Map(),
    videoSessions: new Map(),
    auditLogs: new Map(),
    platformSettings: new Map(),
  };
  const add = (c: Collection, row: Record<string, unknown>) => {
    cats[c].set(row.id as string, row);
    return row.id as string;
  };

  // --- Categories
  const catDefs = [
    { id: "cat_excel", name: "Microsoft Excel", slug: "excel", icon: "Grid3X3", description: "From spreadsheet fundamentals to automation-grade Excel.", position: 0 },
    { id: "cat_pq", name: "Power Query", slug: "power-query", icon: "DatabaseZap", description: "ETL and data cleaning with Power Query and M.", position: 1 },
    { id: "cat_sql", name: "SQL", slug: "sql", icon: "TerminalSquare", description: "Query, model and analyze relational data.", position: 2 },
    { id: "cat_py", name: "Python", slug: "python", icon: "Code2", description: "Python for analysts — pandas, automation, APIs.", position: 3 },
    { id: "cat_bi", name: "Dashboards & BI", slug: "dashboards", icon: "BarChart3", description: "Executive dashboards and business intelligence.", position: 4 },
  ];
  for (const c of catDefs) add("categories", { ...c, createdAt: iso(now), updatedAt: iso(now) });

  // --- Instructor
  add("instructors", {
    id: "ins_rohan",
    name: "CA Rohan Mehta",
    title: "Lead Data Faculty, BICE Academy",
    bio: "Chartered Accountant turned data educator. 14 years in FP&A and analytics teams at Big-4 and Fortune-500 finance departments. Rohan has trained 12,000+ professionals on Excel, Power Query, SQL and Python — with a focus on real finance and operations datasets, not toy examples.",
    credentials: "CA, M.Com | Microsoft Certified: Power BI Data Analyst (PL-300)",
    photoUrl: null,
    linkedinUrl: null,
    status: "active",
    createdAt: iso(now),
    updatedAt: iso(now),
  });

  // --- Users
  const userDefs = [
    { id: "usr_admin", email: "admin@bice.local", name: "BICE Admin", role: "super_admin", password: "Admin@12345", phone: null },
    { id: "usr_rahul", email: "rahul@example.com", name: "Rahul Sharma", role: "student", password: "Student@12345", phone: "+91 98200 00000" },
    { id: "usr_priya", email: "priya@example.com", name: "Priya Nair", role: "student", password: "Student@12345", phone: null },
  ];
  for (const u of userDefs) {
    add("users", {
      id: u.id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      photoUrl: null,
      passwordHash: hashPassword(u.password),
      firebaseUid: null,
      role: u.role,
      status: "active",
      emailVerified: true,
      createdAt: iso(daysAgo(30)),
      updatedAt: iso(daysAgo(30)),
    });
  }

  // --- Flagship course (full curriculum)
  const excelCourseId = "crs_excel_masterclass";
  add("courses", {
    id: excelCourseId,
    slug: "advanced-excel-masterclass",
    title: "Advanced Excel Masterclass",
    subtitle: "From spreadsheet basics to automation-grade Excel for analysts",
    description:
      "This is the flagship BICE program for professionals who live in spreadsheets. You will start with rock-solid fundamentals, master the modern formula stack (XLOOKUP, dynamic arrays, LET & LAMBDA), automate messy data with Power Query, and finish by building a full sales dashboard used in monthly business reviews.\n\nEvery module is taught on real datasets — sales extracts, GL dumps, and marketing reports — so what you practice here is what you will do at work on Monday.",
    thumbnailUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
    promoVideoUrl: SAMPLE_VIDEOS[0],
    categoryId: "cat_excel",
    instructorId: "ins_rohan",
    level: "intermediate",
    status: "published",
    price: 499900,
    originalPrice: 999900,
    durationMinutes: 32 * 60,
    tags: JSON.stringify(["Excel", "XLOOKUP", "Pivot Tables", "Power Query", "Dashboards"]),
    learningObjectives: JSON.stringify([
      "Master XLOOKUP, INDEX/MATCH, SUMIFS and nested IF logic",
      "Clean and transform messy data with Power Query",
      "Build interactive sales dashboards with PivotTables and slicers",
      "Use dynamic arrays, LET and LAMBDA to write maintainable formulas",
      "Automate monthly reporting workflows end-to-end",
    ]),
    prerequisites: JSON.stringify([
      "Basic familiarity with Excel (entering data, simple formulas)",
      "A Windows or Mac computer with Excel 2016+ or Microsoft 365",
    ]),
    targetAudience: JSON.stringify([
      "Analysts and accountants",
      "Finance and operations professionals",
      "Anyone who wants to automate Excel reporting",
    ]),
    skills: JSON.stringify(["XLOOKUP", "SUMIFS", "Power Query", "Pivot Tables", "Dashboard Design", "LET & LAMBDA"]),
    faqs: JSON.stringify([
      { q: "Do I need the paid Microsoft 365 version?", a: "No. Everything works in Excel 2016 or newer; dynamic array features are shown with alternatives for older versions." },
      { q: "How long do I have access?", a: "Lifetime access to all videos and resources, including future updates." },
      { q: "Will I get a certificate?", a: "Yes — a verified certificate is issued automatically when you complete all lessons." },
      { q: "Can I download the practice files?", a: "Yes, all practice datasets and cheat sheets are downloadable from your dashboard." },
    ]),
    seoTitle: "Advanced Excel Masterclass — BICE Academy",
    seoDescription: "Master XLOOKUP, Power Query and dashboard design in 32 hours of hands-on Excel training.",
    certificateEnabled: true,
    ratingAvg: 4.9,
    ratingCount: 412,
    studentsCount: 5230,
    createdAt: iso(daysAgo(120)),
    updatedAt: iso(now),
  });

  const sectionDefs: { id: string; title: string; lessons: { title: string; seconds: number; free?: boolean; desc?: string }[] }[] = [
    {
      id: "sec_excel_1",
      title: "Excel Fundamentals",
      lessons: [
        { title: "Introduction to Excel", seconds: 750, free: true, desc: "How Excel thinks: workbooks, sheets, references and the ribbon." },
        { title: "Understanding the Excel interface", seconds: 690 },
        { title: "Essential keyboard shortcuts", seconds: 840, free: true },
        { title: "Working with tables", seconds: 900 },
      ],
    },
    {
      id: "sec_excel_2",
      title: "Advanced Excel Formulas",
      lessons: [
        { title: "XLOOKUP deep dive", seconds: 1020 },
        { title: "INDEX and MATCH", seconds: 960 },
        { title: "SUMIFS and COUNTIFS", seconds: 1140 },
        { title: "IF, IFS and nested conditions", seconds: 1080 },
        { title: "Dynamic array formulas", seconds: 1260 },
        { title: "LET and LAMBDA", seconds: 1380 },
      ],
    },
    {
      id: "sec_excel_3",
      title: "Power Query",
      lessons: [
        { title: "Introduction to Power Query", seconds: 780 },
        { title: "Importing external data", seconds: 900 },
        { title: "Data cleaning", seconds: 1680 },
        { title: "Data transformation", seconds: 1320 },
        { title: "Combining datasets", seconds: 1140 },
        { title: "Automating repetitive tasks", seconds: 1500 },
      ],
    },
    {
      id: "sec_excel_4",
      title: "Practical Projects",
      lessons: [
        { title: "Sales dashboard project", seconds: 2820 },
        { title: "Business reporting project", seconds: 2400 },
        { title: "Automated data cleaning project", seconds: 1980 },
      ],
    },
  ];

  const excelLessonIds: string[] = [];
  let pos = 0;
  for (const [si, s] of sectionDefs.entries()) {
    add("sections", {
      id: s.id,
      courseId: excelCourseId,
      title: s.title,
      position: si,
      createdAt: iso(now),
      updatedAt: iso(now),
    });
    for (const l of s.lessons) {
      const id = `les_excel_${String(pos).padStart(2, "0")}`;
      add("lessons", {
        id,
        sectionId: s.id,
        courseId: excelCourseId,
        title: l.title,
        description: l.desc ?? `In this lesson you will work through ${l.title.toLowerCase()} with a hands-on dataset from the course resources.`,
        videoStorageId: SAMPLE_VIDEOS[pos % SAMPLE_VIDEOS.length],
        durationSeconds: l.seconds,
        position: pos++,
        isFreePreview: Boolean(l.free),
        status: "published",
        completionRule: "watch_90",
        createdAt: iso(now),
        updatedAt: iso(now),
      });
      excelLessonIds.push(id);
    }
  }

  // --- Remaining catalog courses
  const courseDefs = [
    {
      id: "crs_pq_bootcamp", slug: "power-query-bootcamp", title: "Power Query Bootcamp",
      subtitle: "Automate data cleaning and ETL without formulas",
      level: "intermediate", price: 399900, originalPrice: 699900, categoryId: "cat_pq",
      tags: ["Power Query", "M Language", "ETL"], studentsCount: 2140, rating: 4.7, lessons: 18,
      thumb: "https://images.unsplash.com/photo-1551288049-bebda4e38f62?w=1200&q=80",
    },
    {
      id: "crs_sql_analysis", slug: "sql-for-data-analysis", title: "SQL for Data Analysis",
      subtitle: "Query, join and analyze business data with confidence",
      level: "beginner", price: 349900, originalPrice: 599900, categoryId: "cat_sql",
      tags: ["SQL", "PostgreSQL", "Analytics"], studentsCount: 3120, rating: 4.8, lessons: 22,
      thumb: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
    },
    {
      id: "crs_python_analysis", slug: "python-for-data-analysis", title: "Python for Data Analysis",
      subtitle: "pandas, automation and reporting for analysts",
      level: "advanced", price: 599900, originalPrice: 899900, categoryId: "cat_py",
      tags: ["Python", "pandas", "Automation"], studentsCount: 1840, rating: 4.9, lessons: 26,
      thumb: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=1200&q=80",
    },
    {
      id: "crs_pbi_dashboards", slug: "business-dashboards-with-power-bi", title: "Business Dashboards with Power BI",
      subtitle: "From raw data to executive-ready dashboards",
      level: "beginner", price: 449900, originalPrice: 799900, categoryId: "cat_bi",
      tags: ["Power BI", "DAX", "Dashboards"], studentsCount: 1560, rating: 4.6, lessons: 16,
      thumb: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1200&q=80",
    },
    {
      id: "crs_excel_beginners", slug: "excel-for-beginners", title: "Excel for Beginners (Free)",
      subtitle: "Your first 90 minutes with spreadsheets",
      level: "beginner", price: 0, originalPrice: null, categoryId: "cat_excel",
      tags: ["Excel", "Basics"], studentsCount: 8420, rating: 4.5, lessons: 6,
      thumb: "https://images.unsplash.com/photo-1518186285589-2ee195e6f10b?w=1200&q=80",
    },
  ];

  for (const c of courseDefs) {
    add("courses", {
      id: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      description: `${c.subtitle}. A structured BICE program with hands-on projects, downloadable resources and a verified certificate on completion. Taught by CA Rohan Mehta using real business datasets.`,
      thumbnailUrl: c.thumb,
      promoVideoUrl: null,
      categoryId: c.categoryId,
      instructorId: "ins_rohan",
      level: c.level,
      status: "published",
      price: c.price,
      originalPrice: c.originalPrice,
      durationMinutes: c.lessons * 22,
      tags: JSON.stringify(c.tags),
      learningObjectives: JSON.stringify(["Work through realistic business scenarios", "Practice with downloadable datasets", "Build a portfolio-ready project"]),
      prerequisites: JSON.stringify(["Basic computer literacy"]),
      targetAudience: JSON.stringify(["Working professionals", "Students entering analytics roles"]),
      skills: JSON.stringify(c.tags),
      faqs: JSON.stringify([{ q: "How long do I have access?", a: "Lifetime access including updates." }]),
      seoTitle: null,
      seoDescription: null,
      certificateEnabled: true,
      ratingAvg: c.rating,
      ratingCount: Math.round(c.studentsCount / 8),
      studentsCount: c.studentsCount,
      createdAt: iso(daysAgo(90)),
      updatedAt: iso(now),
    });
    const secId = `sec_${c.id.replace("crs_", "")}_1`;
    add("sections", { id: secId, courseId: c.id, title: "Getting Started", position: 0, createdAt: iso(now), updatedAt: iso(now) });
    for (let i = 0; i < Math.min(c.lessons, 6); i++) {
      add("lessons", {
        id: `les_${c.id.replace("crs_", "")}_${String(i).padStart(2, "0")}`,
        sectionId: secId,
        courseId: c.id,
        title: `${c.title.split(" ")[0]} essentials — part ${i + 1}`,
        description: "Hands-on lesson with the course dataset.",
        videoStorageId: SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length],
        durationSeconds: 700 + i * 60,
        position: i,
        isFreePreview: i === 0,
        status: "published",
        completionRule: "watch_90",
        createdAt: iso(now),
        updatedAt: iso(now),
      });
    }
  }

  // --- Reviews (approved)
  add("reviews", {
    id: "rev_1", courseId: excelCourseId, userId: "usr_rahul", rating: 5,
    title: "Transformed my monthly reporting",
    comment: "The Power Query section alone saved me two days a month. Best money I have spent on my career.",
    status: "approved", createdAt: iso(daysAgo(12)), updatedAt: iso(daysAgo(12)),
  });
  add("reviews", {
    id: "rev_2", courseId: excelCourseId, userId: "usr_priya", rating: 5,
    title: null,
    comment: "Rohan explains complex formulas in the simplest way possible. The dashboard project is gold.",
    status: "approved", createdAt: iso(daysAgo(8)), updatedAt: iso(daysAgo(8)),
  });

  // --- Coupons
  add("coupons", {
    id: "cpn_welcome10", code: "WELCOME10", type: "percent", value: 10,
    maxUsesPerUser: 1, minOrderValue: 0, active: true, expiresAt: null,
    createdAt: iso(now), updatedAt: iso(now),
  });
  add("coupons", {
    id: "cpn_bice500", code: "BICE500", type: "fixed", value: 50000, minOrderValue: 299900,
    active: true, expiresAt: iso(new Date(now.getTime() + 90 * 86400e3)),
    createdAt: iso(now), updatedAt: iso(now),
  });

  // --- Enrollment + progress for the demo student
  const completed = excelLessonIds.slice(0, 4);
  add("enrollments", {
    id: "enr_demo_1",
    userId: "usr_rahul",
    courseId: excelCourseId,
    status: "active",
    source: "purchase",
    progressPercent: Math.round((completed.length / excelLessonIds.length) * 100),
    lastLessonId: completed[completed.length - 1] ?? null,
    lastAccessedAt: iso(daysAgo(2)),
    enrolledAt: iso(daysAgo(21)),
    createdAt: iso(daysAgo(21)),
    updatedAt: iso(daysAgo(2)),
  });
  for (const [i, lessonId] of completed.entries()) {
    add("lessonProgress", {
      id: `lp_demo_${i}`,
      userId: "usr_rahul",
      lessonId,
      courseId: excelCourseId,
      status: "completed",
      positionSeconds: 900,
      watchPercent: 100,
      completedAt: iso(daysAgo(5 - i)),
      createdAt: iso(daysAgo(6 - i)),
      updatedAt: iso(daysAgo(5 - i)),
    });
  }
  add("orders", {
    id: "ord_demo_1",
    orderNumber: "ORD-2026-0182",
    userId: "usr_rahul",
    courseId: excelCourseId,
    status: "paid",
    amount: 499900,
    discount: 0,
    finalAmount: 499900,
    razorpayOrderId: "order_demo_seed_1",
    razorpayPaymentId: "pay_demo_seed_1",
    createdAt: iso(daysAgo(21)),
    updatedAt: iso(daysAgo(21)),
  });
  add("notes", {
    id: "note_demo_1",
    userId: "usr_rahul",
    courseId: excelCourseId,
    lessonId: excelLessonIds[0],
    title: "Power Query steps to remember",
    content: "Home > Transform Data > Use Table.SelectColumns for slimming datasets. Remember: buffering large tables speeds up merges.",
    timestampSeconds: 312,
    createdAt: iso(daysAgo(4)),
    updatedAt: iso(daysAgo(4)),
  });

  // --- Resources for flagship course
  add("resources", {
    id: "res_1", courseId: excelCourseId, lessonId: excelLessonIds[2],
    title: "Excel shortcuts cheat sheet", type: "cheatsheet",
    externalUrl: "https://support.microsoft.com/excel/keyboard-shortcuts",
    downloadable: true, availableAfterLessonId: null,
    createdAt: iso(now), updatedAt: iso(now),
  });
  add("resources", {
    id: "res_2", courseId: excelCourseId, lessonId: null,
    title: "Advanced Excel practice workbook", type: "practice_file",
    externalUrl: "https://example.com/practice-workbook.xlsx",
    downloadable: true, availableAfterLessonId: null,
    createdAt: iso(now), updatedAt: iso(now),
  });
  add("resources", {
    id: "res_3", courseId: excelCourseId, lessonId: null,
    title: "Sales dashboard template", type: "template",
    externalUrl: "https://example.com/sales-dashboard.xlsx",
    downloadable: true, availableAfterLessonId: excelLessonIds[3],
    createdAt: iso(now), updatedAt: iso(now),
  });
  add("resources", {
    id: "res_4", courseId: excelCourseId, lessonId: null,
    title: "Monthly reporting reading list", type: "external",
    externalUrl: "https://example.com/reading-list",
    downloadable: false, availableAfterLessonId: null,
    createdAt: iso(now), updatedAt: iso(now),
  });

  // --- Announcements
  add("announcements", {
    id: "ann_1",
    title: "New cohort: Power Query Bootcamp starts Monday",
    body: "Live doubt sessions every Thursday at 7 PM IST for enrolled students.",
    audience: "all", pinned: true, publishedAt: iso(now),
    createdAt: iso(now), updatedAt: iso(now),
  });
  add("announcements", {
    id: "ann_2",
    title: "Scheduled maintenance",
    body: "The platform will be briefly unavailable on Sunday 02:00-02:30 IST.",
    audience: "all", pinned: false, publishedAt: iso(now),
    createdAt: iso(now), updatedAt: iso(now),
  });

  // --- Platform settings (singleton, mirrors prisma seed)
  add("platformSettings", {
    id: "singleton",
    contactEmail: "support@bice.example",
    contactPhone: "+91 22 4000 0000",
    updatedAt: iso(now),
  });

  return new Map(
    Object.entries(cats) as [Collection, Map<string, Record<string, unknown>>][]
  );
}
