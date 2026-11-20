import crypto from "node:crypto";
import { env } from "@/config/env";

/** HMAC-signed, short-lived tokens (playback authorization, streaming URLs). */

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function hmac(payload: string): string {
  return crypto.createHmac("sha256", env.SESSION_SECRET).update(payload).digest("base64url");
}

export interface TokenPayload {
  [k: string]: string | number | boolean;
}

export function signToken(payload: TokenPayload, ttlSeconds: number): string {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds, jti: crypto.randomUUID() };
  const data = b64url(JSON.stringify(body));
  return `${data}.${hmac(data)}`;
}

export function verifyToken<T extends TokenPayload>(token: string): (T & { exp: number }) | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = hmac(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Password hashing for the local dev auth provider (scrypt). Firebase handles production auth. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored?: string | null): boolean {
  if (!stored || !stored.startsWith("scrypt:")) return false;
  const [, salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

export function randomId(len = 12): string {
  return crypto.randomBytes(len).toString("base64url").slice(0, len).replace(/[-_]/g, "x");
}
