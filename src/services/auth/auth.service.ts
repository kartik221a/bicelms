import { store } from "@/repositories";
import { errors } from "@/lib/api";
import { hashPassword, verifyPassword, randomId } from "@/lib/crypto";
import { flags } from "@/config/env";
import { setSessionCookie, clearSessionCookie } from "./session";
import { getFirebaseAuth, SESSION_MAX_AGE_SECONDS, SESSION_COOKIE } from "@/providers/auth/firebase-admin";
import { RegisterInput, LoginInput } from "@/validators";
import { sendTemplatedEmail, emailTemplates } from "@/services/email";
import { audit } from "@/services/audit.service";
import { signToken } from "@/lib/crypto";

/**
 * Authentication service. Two providers behind one interface:
 *  - firebase: client SDK signs in -> ID token exchanged for an Admin SDK
 *    session cookie (HTTP-only). Password resets / verification emails are
 *    handled by Firebase.
 *  - local (dev/preview, clearly marked): scrypt-hashed credentials in the
 *    local store + HMAC session cookie, with verification/reset tokens.
 * Roles/status always come from the data store, never the token claims alone.
 */

interface DbUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  passwordHash?: string | null;
  firebaseUid?: string | null;
  photoUrl?: string | null;
  createdAt?: string;
}

export async function registerUser(input: RegisterInput) {
  const existing = await store.getByField<DbUser>("users", "email", input.email);
  if (existing) throw errors.conflict("An account with this email already exists. Try logging in.");

  const user = await store.create<DbUser>("users", {
    email: input.email,
    name: input.name,
    phone: input.phone || null,
    role: "student",
    status: "active",
    emailVerified: false,
    passwordHash: flags.firebaseConfigured ? null : hashPassword(input.password),
  });

  if (flags.firebaseConfigured) {
    // Client completes email/password creation via the Firebase SDK; server
    // issues the session cookie from the returned ID token (handled by the
    // /api/v1/auth/session endpoint). For direct API use we cannot create the
    // Firebase account server-side without the client SDK flow.
  } else {
    const token = await createVerificationToken(user.id, "email_verification");
    await sendTemplatedEmail(user.email, emailTemplates.verifyEmail(user.name, token));
    await issueLocalSession(user);
  }
  await audit({ action: "auth.register", entity: "user", entityId: user.id });
  return { id: user.id, email: user.email, name: user.name };
}

export async function loginUser(input: LoginInput) {
  if (flags.firebaseConfigured) {
    throw errors.badRequest(
      "Use the client Firebase sign-in flow; POST /api/v1/auth/session with the Firebase ID token afterwards."
    );
  }
  const user = await store.getByField<DbUser>("users", "email", input.email);
  if (!user || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
    throw errors.unauthorized("Invalid email or password");
  }
  if (user.status !== "active") throw errors.forbidden("This account has been suspended. Contact support.");
  await issueLocalSession(user);
  await audit({ action: "auth.login", entity: "user", entityId: user.id });
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function issueLocalSession(user: DbUser) {
  const token = signToken({ uid: user.id, ver: 1 }, SESSION_MAX_AGE_SECONDS);
  await setSessionCookie(token);
}

/** Firebase flow: client sends ID token, server creates session cookie. */
export async function createFirebaseSession(idToken: string) {
  const auth = await getFirebaseAuth();
  const decoded = await auth.verifyIdToken(idToken, true);
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
  // Ensure a matching user record exists in the data store
  let user = await store.getByField<DbUser>("users", "firebaseUid", decoded.uid);
  if (!user) {
    user = await store.getByField<DbUser>("users", "email", (decoded.email ?? "").toLowerCase());
    if (user) {
      await store.update("users", user.id, { firebaseUid: decoded.uid });
    } else {
      user = await store.create<DbUser>("users", {
        email: decoded.email,
        name: decoded.name ?? decoded.email?.split("@")[0] ?? "Student",
        role: "student",
        status: "active",
        emailVerified: decoded.email_verified ?? false,
        firebaseUid: decoded.uid,
        photoUrl: decoded.picture ?? null,
      });
    }
  }
  const jar = await (await import("next/headers")).cookies();
  jar.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function logout() {
  await clearSessionCookie();
}

async function createVerificationToken(userId: string, type: "email_verification" | "password_reset") {
  const user = await store.get<DbUser>("users", userId);
  const token = randomId(32);
  await store.create("verificationTokens", {
    identifier: user?.email ?? userId,
    token,
    type,
    expires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
  });
  return token;
}

export async function forgotPassword(email: string) {
  const user = await store.getByField<DbUser>("users", "email", email);
  if (!user) return; // do not reveal account existence
  if (flags.firebaseConfigured) return; // handled by Firebase client SDK
  const token = await createVerificationToken(user.id, "password_reset");
  await sendTemplatedEmail(user.email, emailTemplates.passwordReset(user.name, token));
}

export async function resetPassword(token: string, newPassword: string) {
  const vt = await store.getByField<{ id: string; identifier: string; expires: string; type: string }>(
    "verificationTokens",
    "token",
    token
  );
  if (!vt || vt.type !== "password_reset" || new Date(vt.expires).getTime() < Date.now()) {
    throw errors.badRequest("This reset link is invalid or has expired. Request a new one.");
  }
  const user = await store.getByField<DbUser>("users", "email", vt.identifier);
  if (!user) throw errors.notFound("Account not found");
  await store.update("users", user.id, { passwordHash: hashPassword(newPassword) });
  await store.delete("verificationTokens", vt.id);
  await audit({ action: "auth.password_reset", entity: "user", entityId: user.id });
}

export async function verifyEmail(token: string) {
  const vt = await store.getByField<{ id: string; identifier: string; expires: string; type: string }>(
    "verificationTokens",
    "token",
    token
  );
  if (!vt || vt.type !== "email_verification" || new Date(vt.expires).getTime() < Date.now()) {
    throw errors.badRequest("This verification link is invalid or has expired.");
  }
  const user = await store.getByField<DbUser>("users", "email", vt.identifier);
  if (user) {
    await store.update("users", user.id, { emailVerified: true });
    await store.delete("verificationTokens", vt.id);
  }
}
