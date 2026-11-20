import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: emailSchema,
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({ token: z.string().min(10) });

export const courseQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxPrice: z.coerce.number().min(0).optional(), // rupees
  maxDurationHours: z.coerce.number().min(0).optional(),
  sort: z
    .enum(["popularity", "newest", "price_asc", "price_desc", "rating"])
    .default("popularity"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(48).default(12),
});
export type CourseQuery = z.infer<typeof courseQuerySchema>;

export const createOrderSchema = z.object({ courseId: z.string().min(1) });

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const progressSchema = z.object({
  lessonId: z.string().min(1),
  positionSeconds: z.coerce.number().min(0).default(0),
  watchPercent: z.coerce.number().min(0).max(100).default(0),
  completed: z.boolean().optional(),
});

export const noteSchema = z.object({
  title: z.string().trim().min(1).max(160),
  content: z.string().max(20000).default(""),
  courseId: z.string().optional().nullable(),
  lessonId: z.string().optional().nullable(),
  timestampSeconds: z.coerce.number().int().min(0).optional().nullable(),
});
export type NoteInput = z.infer<typeof noteSchema>;

export const reviewSchema = z.object({
  courseId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  comment: z.string().trim().min(4).max(2000),
});

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,24}$/, "Invalid code"),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().int().min(1),
  startsAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  maxUses: z.coerce.number().int().min(1).optional().nullable(),
  maxUsesPerUser: z.coerce.number().int().min(1).optional().nullable(),
  minOrderValue: z.coerce.number().int().min(0).default(0),
  applicableCourseIds: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});
export type CouponInput = z.infer<typeof couponSchema>;

export const courseInputSchema = z.object({
  title: z.string().trim().min(4).max(140),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only")
    .optional(),
  subtitle: z.string().trim().max(200).optional(),
  description: z.string().max(20000).default(""),
  categoryId: z.string().optional().nullable(),
  instructorId: z.string().optional().nullable(),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  status: z.enum(["draft", "published", "scheduled"]).default("draft"),
  price: z.coerce.number().int().min(0), // paise
  originalPrice: z.coerce.number().int().min(0).optional().nullable(),
  thumbnailUrl: z.string().max(500).optional().nullable(),
  promoVideoUrl: z.string().max(500).optional().nullable(),
  tags: z.array(z.string()).default([]),
  learningObjectives: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  targetAudience: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  seoTitle: z.string().max(160).optional().nullable(),
  seoDescription: z.string().max(320).optional().nullable(),
  certificateEnabled: z.boolean().default(true),
});
export type CourseInput = z.infer<typeof courseInputSchema>;

export const lessonInputSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().max(5000).optional().nullable(),
  videoStorageId: z.string().max(500).optional().nullable(),
  durationSeconds: z.coerce.number().int().min(0).default(0),
  isFreePreview: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("published"),
  completionRule: z.enum(["auto_90", "manual"]).default("auto_90"),
});
export type LessonInput = z.infer<typeof lessonInputSchema>;
