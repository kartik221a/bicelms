import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Standard JSON API responses + error handling for /api/v1 routes. */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export const errors = {
  badRequest: (msg = "Invalid request", details?: unknown) => new ApiError(400, "bad_request", msg, details),
  unauthorized: (msg = "Authentication required") => new ApiError(401, "unauthorized", msg),
  forbidden: (msg = "You do not have permission to perform this action") => new ApiError(403, "forbidden", msg),
  notFound: (msg = "Not found") => new ApiError(404, "not_found", msg),
  conflict: (msg = "Conflict") => new ApiError(409, "conflict", msg),
  setupRequired: (integration: string, envVars: string[]) =>
    new ApiError(503, "setup_required", `${integration} is not configured. Add the required environment variables to activate it.`, { integration, envVars }),
  rateLimited: (retryAfter: number) => new ApiError(429, "rate_limited", `Too many requests. Retry in ${retryAfter}s.`, { retryAfter }),
};

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { ok: false, error: { code: err.code, message: err.message, details: err.details } },
      { status: err.status }
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "validation_error",
          message: err.issues[0]?.message ?? "Validation failed",
          details: err.issues,
        },
      },
      { status: 400 }
    );
  }
  console.error("[api] unexpected error:", err);
  return NextResponse.json(
    { ok: false, error: { code: "internal_error", message: "Something went wrong. Please try again." } },
    { status: 500 }
  );
}

/** Wrap a route handler with consistent error handling. */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (err) {
      return jsonError(err);
    }
  };
}

export async function parseJson<T>(req: Request, schema: { parse: (v: unknown) => T }): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw errors.badRequest("Request body must be valid JSON");
  }
  return schema.parse(body);
}
