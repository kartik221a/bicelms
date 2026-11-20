"use client";

/**
 * Typed fetch helpers for the /api/v1 auth endpoints.
 * Envelope contract: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
 */

export class AuthApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

async function parseEnvelope<T>(res: Response): Promise<T> {
  const payload = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!payload) {
    throw new AuthApiError("network_error", "Something went wrong. Please try again.", res.status);
  }
  if (!payload.ok) {
    throw new AuthApiError(payload.error.code, payload.error.message, res.status);
  }
  return payload.data;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseEnvelope<T>(res);
}

export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: "GET" });
  return parseEnvelope<T>(res);
}

export interface SessionInfo {
  user: unknown;
  setupMode: boolean;
  dataProvider: string;
  integrations: {
    firebase: boolean;
    razorpay: boolean;
    cloudinary: boolean;
    email: boolean;
  };
}

export async function fetchSessionInfo(): Promise<SessionInfo> {
  return getJson<SessionInfo>("/api/v1/auth/session");
}
