/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
];

async function main() {
  console.log("Seeding BICE LMS dev data...");
  await db.$transaction([
    db.lessonProgress.deleteMany(),
    db.certificate.deleteMany(),
    db.couponRedemption.deleteMany(),
    db.review.deleteMany(),
    db.note.deleteMany(),
    db.enrollment.deleteMany(),
    db.refund.deleteMany(),
    db.payment.deleteMany(),
    db.order.deleteMany(),
    db.resource.deleteMany(),
    db.lesson.deleteMany(),
    db.section.deleteMany(),
    db.announcement.deleteMany(),
    db.coupon.deleteMany(),
    db.course.deleteMany(),
    db.instructor.deleteMany(),
    db.category.deleteMany(),
    db.verificationToken.deleteMany(),
    db.notification.deleteMany(),
    db.videoSession.deleteMany(),
    db.auditLog.deleteMany(),
    db.user.deleteMany(),
  ]);

  // --- Categories
  const [excel, powerQuery, sql, python, dashboards] = await Promise.all(
    [
      { name: "Microsoft Excel", slug: "excel", icon: "Grid3X3", description: "From spreadsheet fundamentals to automation-grade Excel." },
      { name: "Power Query", slug: "power-query", icon: "DatabaseZap", description: "ETL and data cleaning with Power Query and M." },
      { name: "SQL", slug: "sql", icon: "TerminalSquare", description: "Query, model and analyze relational data." },
      { name: "Python", slug: "python", icon: "Code2", description: "Python for analysts — pandas, automation, APIs." },
      { name: "Dashboards & BI", slug: "dashboards", icon: "BarChart3", description: "Executive dashboards and business intelligence." },
    ].map((c, i) => db.category.create({ data: { ...c, position: i } }))
  );

  // --- Instructor
  const instructor = await db.instructor.create({
    data: {
      name: "CA Rohan Mehta",
      title: "Lead Data Faculty, BICE Academy",
      bio: "Chartered Accountant turned data educator. 14 years in FP&A and analytics teams at Big-4 and Fortune-500 finance departments. Rohan has trained 12,000+ professionals on Excel, Power Query, SQL and Python — with a focus on real finance and operations datasets, not toy examples.",
      credentials: "CA, M.Com | Microsoft Certified: Power BI Data Analyst (PL-300)",
    },
  });

  // --- Users
  const admin = await db.user.create({
    data: {
      email: "admin@bice.local",
      name: "BICE Admin",
      role: "super_admin",
      emailVerified: true,
      passwordHash: hashPassword("Admin@12345"),
    },
  });
  const student = await db.user.create({
    data: {
      email: "rahul@example.com",
      name: "Rahul Sharma",
      phone: "+91 98200 00000",
      role: "student",
      emailVerified: true,
      passwordHash: hashPassword("Student@12345"),
    },
  });
  await db.user.create({
    data: {
      email: "priya@example.com",
      name: "Priya Nair",
      role: "student",
      emailVerified: true,
      passwordHash: hashPassword("Student@12345"),
    },
  });

  // --- Courses
  const excelCourse = await db.course.create({
    data: {
      slug: "advanced-excel-masterclass",
      title: "Advanced Excel Masterclass",
      subtitle: "From spreadsheet basics to automation-grade Excel for analysts",
      description:
        "This is the flagship BICE program for professionals who live in spreadsheets. You will start with rock-solid fundamentals, master the modern formula stack (XLOOKUP, dynamic arrays, LET & LAMBDA), automate messy data with Power Query, and finish by building a full sales dashboard used in monthly business reviews.\n\nEvery module is taught on real datasets — sales extracts, GL dumps, and marketing reports — so what you practice here is what you will do at work on Monday.",
      categoryId: excel.id,
      instructorId: instructor.id,
      level: "intermediate",
      status: "published",
      price: 499900,
      originalPrice: 999900,
      thumbnailUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
      promoVideoUrl: SAMPLE_VIDEOS[0],
      tags: JSON.stringify(["Excel", "XLOOKUP", "Pivot Tables", "Power Query", "Dashboards"]),
      learningObjectives: JSON.stringify([
        "Master XLOOKUP, INDEX/MATCH, SUMIFS and nested IF logic",
        "Clean and transform messy data with Power Query",
        "Build interactive sales dashboards with PivotTables and slicers",
        "Use dynamic arrays, LET and LAMBDA to write maintainable formulas",
        "Automate monthly reporting workflows end-to-end",
      ]),
      prerequisites: JSON.stringify(["Basic familiarity with Excel (entering data, simple formulas)", "A Windows or Mac computer with Excel 2016+ or Microsoft 365"]),
      targetAudience: JSON.stringify(["Analysts and accountants", "Finance and operations professionals", "Anyone who wants to automate Excel reporting"]),
      skills: JSON.stringify(["XLOOKUP", "SUMIFS", "Power Query", "Pivot Tables", "Dashboard Design", "LET & LAMBDA"]),
      faqs: JSON.stringify([
        { q: "Do I need the paid Microsoft 365 version?", a: "No. Everything works in Excel 2016 or newer; dynamic array features are shown with alternatives for older versions." },
        { q: "How long do I have access?", a: "Lifetime access to all videos and resources, including future updates." },
        { q: "Will I get a certificate?", a: "Yes — a verified certificate is issued automatically when you complete all lessons." },
        { q: "Can I download the practice files?", a: "Yes, all practice datasets and cheat sheets are downloadable from your dashboard." },
      ]),
      seoTitle: "Advanced Excel Masterclass — BICE Academy",
      seoDescription: "Master XLOOKUP, Power Query and dashboard design in 32 hours of hands-on Excel training.",
    },
  });

  // Sections + lessons for the flagship course (curriculum from the master prompt)
  const sectionDefs: { title: string; lessons: { title: string; seconds: number; free?: boolean; desc?: string }[] }[] = [
    {
      title: "Excel Fundamentals",
      lessons: [
        { title: "Introduction to Excel", seconds: 750, free: true, desc: "How Excel thinks: workbooks, sheets, references and the ribbon." },
        { title: "Understanding the Excel interface", seconds: 690 },
        { title: "Essential keyboard shortcuts", seconds: 840, free: true },
        { title: "Working with tables", seconds: 900 },
      ],
    },
    {
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
      title: "Practical Projects",
      lessons: [
        { title: "Sales dashboard project", seconds: 2820 },
        { title: "Business reporting project", seconds: 2400 },
        { title: "Automated data cleaning project", seconds: 1980 },
      ],
    },
  ];

  let pos = 0;
  for (const [si, s] of sectionDefs.entries()) {
    const section = await db.section.create({
      data: { courseId: excelCourse.id, title: s.title, position: si },
    });
    for (const l of s.lessons) {
      await db.lesson.create({
        data: {
          sectionId: section.id,
          courseId: excelCourse.id,
          title: l.title,
          description: l.desc ?? `In this lesson you will work through ${l.title.toLowerCase()} with a hands-on dataset from the course resources.`,
          videoStorageId: SAMPLE_VIDEOS[pos % SAMPLE_VIDEOS.length],
          durationSeconds: l.seconds,
          position: pos++,
          isFreePreview: Boolean(l.free),
        },
      });
    }
  }

  const courseDefs = [
    {
      slug: "power-query-bootcamp",
      title: "Power Query Bootcamp",
      subtitle: "Automate data cleaning and ETL without formulas",
      level: "intermediate",
      price: 399900,
      originalPrice: 699900,
      categoryId: powerQuery.id,
      tags: ["Power Query", "M Language", "ETL"],
      studentsCount: 2140,
      rating: 4.7,
      lessons: 18,
    },
    {
      slug: "sql-for-data-analysis",
      title: "SQL for Data Analysis",
      subtitle: "Query, join and analyze business data with confidence",
      level: "beginner",
      price: 349900,
      originalPrice: 599900,
      categoryId: sql.id,
      tags: ["SQL", "PostgreSQL", "Analytics"],
      studentsCount: 3120,
      rating: 4.8,
      lessons: 22,
    },
    {
      slug: "python-for-data-analysis",
      title: "Python for Data Analysis",
      subtitle: "pandas, automation and reporting for analysts",
      level: "advanced",
      price: 599900,
      originalPrice: 899900,
      categoryId: python.id,
      tags: ["Python", "pandas", "Automation"],
      studentsCount: 1840,
      rating: 4.9,
      lessons: 26,
    },
    {
      slug: "business-dashboards-with-power-bi",
      title: "Business Dashboards with Power BI",
      subtitle: "From raw data to executive-ready dashboards",
      level: "beginner",
      price: 449900,
      originalPrice: 799900,
      categoryId: dashboards.id,
      tags: ["Power BI", "DAX", "Dashboards"],
      studentsCount: 1560,
      rating: 4.6,
      lessons: 16,
    },
    {
      slug: "excel-for-beginners",
      title: "Excel for Beginners (Free)",
      subtitle: "Your first 90 minutes with spreadsheets",
      level: "beginner",
      price: 0,
      originalPrice: null,
      categoryId: excel.id,
      tags: ["Excel", "Basics"],
      studentsCount: 8420,
      rating: 4.5,
      lessons: 6,
    },
  ];

  for (const [ci, c] of courseDefs.entries()) {
    const course = await db.course.create({
      data: {
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        description: `${c.subtitle}. A structured BICE program with hands-on projects, downloadable resources and a verified certificate on completion. Taught by ${instructor.name} using real business datasets.`,
        categoryId: c.categoryId,
        instructorId: instructor.id,
        level: c.level,
        status: "published",
        price: c.price,
        originalPrice: c.originalPrice,
        durationMinutes: c.lessons * 22,
        thumbnailUrl: `https://images.unsplash.com/photo-${["1551288049-bebda4e38f62", "1460925895917-afdab827c52f", "1543286386-713bdd548da4", "1504868584819-f8e8b4b6d7e3", "1518186285589-2ee195e6lb0"][ci]}?w=1200&q=80`,
        tags: JSON.stringify(c.tags),
        learningObjectives: JSON.stringify(["Work through realistic business scenarios", "Practice with downloadable datasets", "Build a portfolio-ready project"]),
        prerequisites: JSON.stringify(["Basic computer literacy"]),
        targetAudience: JSON.stringify(["Working professionals", "Students entering analytics roles"]),
        skills: JSON.stringify(c.tags),
        faqs: JSON.stringify([{ q: "How long do I have access?", a: "Lifetime access including updates." }]),
        ratingAvg: c.rating,
        ratingCount: Math.round(c.studentsCount / 8),
        studentsCount: c.studentsCount,
      },
    });
    const section = await db.section.create({ data: { courseId: course.id, title: "Getting Started", position: 0 } });
    for (let i = 0; i < Math.min(c.lessons, 6); i++) {
      await db.lesson.create({
        data: {
          sectionId: section.id,
          courseId: course.id,
          title: `${c.title.split(" ")[0]} essentials — part ${i + 1}`,
          description: "Hands-on lesson with the course dataset.",
          videoStorageId: SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length],
          durationSeconds: 700 + i * 60,
          position: i,
          isFreePreview: i === 0,
        },
      });
    }
  }

  // --- Reviews (approved)
  await db.review.createMany({
    data: [
      { courseId: excelCourse.id, userId: student.id, rating: 5, title: "Transformed my monthly reporting", comment: "The Power Query section alone saved me two days a month. Best money I have spent on my career.", status: "approved" },
      { courseId: excelCourse.id, userId: (await db.user.findFirst({ where: { email: "priya@example.com" } }))!.id, rating: 5, comment: "Rohan explains complex formulas in the simplest way possible. The dashboard project is gold.", status: "approved" },
    ],
  });

  // --- Coupons
  await db.coupon.create({
    data: { code: "WELCOME10", type: "percent", value: 10, maxUsesPerUser: 1, minOrderValue: 0, active: true },
  });
  await db.coupon.create({
    data: { code: "BICE500", type: "fixed", value: 50000, minOrderValue: 299900, active: true, expiresAt: new Date(Date.now() + 90 * 86400e3) },
  });

  // --- Enrollment + progress for the demo student
  const firstLessons = await db.lesson.findMany({ where: { courseId: excelCourse.id }, orderBy: { position: "asc" } });
  const completedLessons = firstLessons.slice(0, 4);
  const enrollment = await db.enrollment.create({
    data: {
      userId: student.id,
      courseId: excelCourse.id,
      status: "active",
      source: "purchase",
      progressPercent: Math.round((completedLessons.length / firstLessons.length) * 100),
      lastLessonId: completedLessons[completedLessons.length - 1]?.id,
      lastAccessedAt: new Date(Date.now() - 2 * 86400e3),
    },
  });
  for (const l of completedLessons) {
    await db.lessonProgress.create({
      data: {
        userId: student.id,
        lessonId: l.id,
        courseId: excelCourse.id,
        status: "completed",
        positionSeconds: l.durationSeconds,
        watchPercent: 100,
        completedAt: new Date(),
      },
    });
  }
  await db.order.create({
    data: {
      orderNumber: "ORD-2026-0182",
      userId: student.id,
      courseId: excelCourse.id,
      status: "paid",
      amount: 499900,
      discount: 0,
      finalAmount: 499900,
      razorpayOrderId: "order_demo_seed_1",
      razorpayPaymentId: "pay_demo_seed_1",
    },
  });

  await db.note.create({
    data: {
      userId: student.id,
      courseId: excelCourse.id,
      lessonId: firstLessons[0]?.id,
      title: "Power Query steps to remember",
      content: "Home > Transform Data > Use Table.SelectColumns for slimming datasets. Remember: buffering large tables speeds up merges.",
      timestampSeconds: 312,
    },
  });

  // --- Resources for flagship course
  await db.resource.createMany({
    data: [
      { courseId: excelCourse.id, lessonId: firstLessons[2]?.id, title: "Excel shortcuts cheat sheet", type: "cheatsheet", externalUrl: "https://support.microsoft.com/excel/keyboard-shortcuts", downloadable: true },
      { courseId: excelCourse.id, title: "Advanced Excel practice workbook", type: "practice_file", externalUrl: "https://example.com/practice-workbook.xlsx", downloadable: true },
      { courseId: excelCourse.id, title: "Sales dashboard template", type: "template", externalUrl: "https://example.com/sales-dashboard.xlsx", downloadable: true, availableAfterLessonId: firstLessons[3]?.id },
      { courseId: excelCourse.id, title: "Monthly reporting reading list", type: "external", externalUrl: "https://example.com/reading-list", downloadable: false },
    ],
  });

  // --- Announcements
  await db.announcement.createMany({
    data: [
      { title: "New cohort: Power Query Bootcamp starts Monday", body: "Live doubt sessions every Thursday at 7 PM IST for enrolled students.", audience: "all", pinned: true, publishedAt: new Date() },
      { title: "Scheduled maintenance", body: "The platform will be briefly unavailable on Sunday 02:00-02:30 IST.", audience: "all", publishedAt: new Date() },
    ],
  });

  // --- Platform settings
  await db.platformSettings.create({
    data: { id: "singleton", contactEmail: "support@bice.example", contactPhone: "+91 22 4000 0000" },
  });

  console.log("Seed complete.");
  console.log("  Admin:  admin@bice.local / Admin@12345");
  console.log("  Student: rahul@example.com / Student@12345");
  console.log("  Enrollment:", enrollment.id, "| lessons:", firstLessons.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
