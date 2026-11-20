"use client";

import type { Auth } from "firebase/auth";

/**
 * Firebase web client (lazy, env-guarded).
 *
 * The app runs in two auth modes:
 *  - setup / local mode (no NEXT_PUBLIC_FIREBASE_API_KEY): email+password and
 *    Google sign-in are handled by the local /api/v1/auth/* endpoints.
 *  - firebase mode (key present): the client SDK signs the user in, then the
 *    returned ID token is exchanged for an HTTP-only session cookie via
 *    POST /api/v1/auth/session.
 *
 * The SDK is dynamically imported so setup-mode bundles stay light, and the
 * app is only initialized when a real API key exists.
 */

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export function isFirebaseClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

let authPromise: Promise<Auth> | null = null;

function loadAuth(): Promise<Auth> {
  if (!authPromise) {
    authPromise = (async () => {
      const { initializeApp, getApps, getApp } = await import("firebase/app");
      const { getAuth } = await import("firebase/auth");
      const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
      return getAuth(app);
    })();
  }
  return authPromise;
}

/** Friendly copy for the most common Firebase auth error codes. */
function firebaseErrorMessage(code: string): string | null {
  const map: Record<string, string> = {
    "auth/invalid-credential": "Invalid email or password",
    "auth/invalid-email": "Enter a valid email address",
    "auth/user-disabled": "This account has been suspended. Contact support.",
    "auth/user-not-found": "Invalid email or password",
    "auth/wrong-password": "Invalid email or password",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
    "auth/weak-password": "Password must be at least 8 characters",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled",
    "auth/cancelled-popup-request": "Google sign-in was cancelled",
    "auth/popup-blocked": "Popup blocked by the browser. Allow popups and try again.",
    "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase.",
  };
  return map[code] ?? null;
}

export async function firebaseErrorMessageFor(err: unknown): Promise<string> {
  const code = (err as { code?: string } | null)?.code;
  if (code) {
    const msg = firebaseErrorMessage(code);
    if (msg) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Authentication failed. Please try again.";
}

/** Email + password sign-in. Returns a fresh ID token. */
export async function firebaseSignInWithEmail(
  email: string,
  password: string
): Promise<string> {
  const auth = await loadAuth();
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user.getIdToken();
}

/** Email + password account creation (firebase mode). Returns an ID token. */
export async function firebaseCreateUserWithEmail(
  email: string,
  password: string
): Promise<string> {
  const auth = await loadAuth();
  const { createUserWithEmailAndPassword, sendEmailVerification } = await import("firebase/auth");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await sendEmailVerification(cred.user);
  } catch {
    // verification email is best-effort; account creation still succeeded
  }
  return cred.user.getIdToken();
}

/** Google popup sign-in. Returns a fresh ID token. */
export async function firebaseSignInWithGoogle(): Promise<string> {
  const auth = await loadAuth();
  const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  return cred.user.getIdToken();
}

/** Exchange a Firebase ID token for an HTTP-only session cookie. */
export async function exchangeIdTokenForSession(idToken: string): Promise<void> {
  const res = await fetch("/api/v1/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const payload = (await res.json().catch(() => null)) as
    | { ok: true; data: unknown }
    | { ok: false; error: { code: string; message: string } }
    | null;
  if (!res.ok || !payload?.ok) {
    const message =
      payload && !payload.ok ? payload.error.message : "Could not establish your session";
    throw new Error(message);
  }
}
