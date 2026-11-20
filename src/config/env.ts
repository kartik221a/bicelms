import { z } from "zod";

/**
 * Central environment configuration.
 * Every external integration is env-guarded so the app boots into a clearly
 * marked setup state instead of pretending integrations work (master prompt §17).
 */

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),

  // Auth / DB (Firebase)
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  SESSION_SECRET: process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me",

  // Storage (Cloudinary)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Payments (Razorpay)
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,

  // Email (optional SMTP)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM ?? "BICE Academy <no-reply@bice.example>",
};

export const flags = {
  get firebaseConfigured() {
    return Boolean(
      env.FIREBASE_PROJECT_ID &&
        env.FIREBASE_CLIENT_EMAIL &&
        env.FIREBASE_PRIVATE_KEY &&
        env.NEXT_PUBLIC_FIREBASE_API_KEY
    );
  },
  get cloudinaryConfigured() {
    return Boolean(
      env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
    );
  },
  get razorpayConfigured() {
    return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
  },
  get emailConfigured() {
    return Boolean(env.SMTP_HOST && env.SMTP_USER);
  },
  /** Publicly surfable setup mode (no Firebase creds) */
  get setupMode() {
    return !this.firebaseConfigured;
  },
};

export const dataProviderName = flags.firebaseConfigured ? "firestore" : "local-sqlite";
