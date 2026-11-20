import { getApp, getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { env, flags } from "@/config/env";

/**
 * Firebase Admin SDK — used for Authentication (session cookies, token
 * verification) in production. Guarded so the sandbox can boot without
 * credentials (setup mode).
 */

let _auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  if (getApps().length) {
    _auth = getAuth(getApps()[0]);
  } else if (flags.firebaseConfigured && env.FIREBASE_PRIVATE_KEY) {
    const app = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID!,
        clientEmail: env.FIREBASE_CLIENT_EMAIL!,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
    });
    _auth = getAuth(app);
  } else {
    const app = getApp();
    _auth = getAuth(app);
  }
  return _auth;
}

export const SESSION_COOKIE = "bice_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days
