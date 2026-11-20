import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import { env, flags } from "@/config/env";

/**
 * Firebase Admin SDK — used for Authentication (session cookies, token
 * verification) in production. Guarded so the sandbox can boot without
 * credentials (setup mode).
 *
 * IMPORTANT: firebase-admin itself is imported lazily (dynamic import). The
 * SDK is CommonJS with dynamic requires that break under Turbopack server
 * bundling, and loading it unconditionally 500-crashes every serverless
 * request. When Firebase is not configured (setup mode) ZERO firebase-admin
 * code is ever loaded.
 */

const APP_NAME = "bice-admin";

let _auth: Auth | null = null;
let _app: App | null = null;

export async function getFirebaseAuth(): Promise<Auth> {
  if (_auth) return _auth;
  _app = _app ?? (await getInitializedApp());
  const { getAuth } = await import("firebase-admin/auth");
  _auth = getAuth(_app);
  return _auth;
}

async function getInitializedApp(): Promise<App> {
  const { initializeApp, cert, applicationDefault, getApp } = await import("firebase-admin/app");
  try {
    return getApp(APP_NAME);
  } catch {
    // not initialized yet — fall through
  }
  const options =
    flags.firebaseConfigured && env.FIREBASE_PRIVATE_KEY
      ? {
          credential: cert({
            projectId: env.FIREBASE_PROJECT_ID!,
            clientEmail: env.FIREBASE_CLIENT_EMAIL!,
            privateKey: env.FIREBASE_PRIVATE_KEY,
          }),
        }
      : { credential: applicationDefault() };
  return initializeApp(options, APP_NAME);
}

export const SESSION_COOKIE = "bice_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days
