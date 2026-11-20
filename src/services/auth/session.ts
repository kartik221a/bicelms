import { cookies } from "next/headers";
import { store } from "@/repositories";
import { SessionUser, Role } from "@/types";
import { errors } from "@/lib/api";
import { verifyToken } from "@/lib/crypto";
import { flags } from "@/config/env";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, getFirebaseAuth } from "@/providers/auth/firebase-admin";

/**
 * Server-side session management. The cookie is HTTP-only, signed and short-
 * lived; the user is ALWAYS re-loaded from the data store — roles, status and
 * enrollment are never trusted from the client (master prompt §5/§14).
 */

const ROLE_HIERARCHY: Record<Role, number> = {
  student: 1,
  instructor: 2,
  admin: 3,
  super_admin: 4,
};

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  if (flags.firebaseConfigured) {
    try {
      const decoded = await (await getFirebaseAuth()).verifySessionCookie(token, true);
      return await loadUserByFirebaseUid(decoded.uid, decoded.email);
    } catch {
      return null;
    }
  }

  const payload = verifyToken<{ uid: string; ver: number }>(token);
  if (!payload) return null;
  return await loadUserById(payload.uid);
}

async function loadUserById(uid: string): Promise<SessionUser | null> {
  const user = await store.get<{
    id: string;
    email: string;
    name: string;
    role: Role;
    photoUrl?: string;
    status: string;
    emailVerified: boolean;
  }>("users", uid);
  if (!user || user.status !== "active") return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    photoUrl: user.photoUrl,
    status: "active",
    emailVerified: user.emailVerified,
  };
}

interface LookupUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  photoUrl?: string;
  status: string;
  emailVerified: boolean;
  firebaseUid?: string;
}

async function loadUserByFirebaseUid(firebaseUid: string, email?: string): Promise<SessionUser | null> {
  let user = await store.getByField<LookupUser>("users", "firebaseUid", firebaseUid);
  if (!user && email) {
    user = await store.getByField<LookupUser>("users", "email", email.toLowerCase());
    if (user && !user.firebaseUid) {
      await store.update("users", user.id, { firebaseUid });
    }
  }
  if (!user || user.status !== "active") return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    photoUrl: user.photoUrl,
    status: "active",
    emailVerified: user.emailVerified,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw errors.unauthorized();
  return session;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  const level = ROLE_HIERARCHY[user.role] ?? 0;
  const allowed = Math.max(...roles.map((r) => ROLE_HIERARCHY[r]));
  if (level < allowed) throw errors.forbidden();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole("admin", "super_admin");
}

export function hasRole(user: SessionUser | null, ...roles: Role[]): boolean {
  if (!user) return false;
  const level = ROLE_HIERARCHY[user.role] ?? 0;
  return level >= Math.max(...roles.map((r) => ROLE_HIERARCHY[r]));
}
