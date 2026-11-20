import { NextResponse } from "next/server";
import { handler, errors } from "@/lib/api";
import { verifyToken } from "@/lib/crypto";
import { store } from "@/repositories";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Authenticated local video streaming (dev provider). Validates the short-
 * lived playback token on EVERY request and streams the file with Range
 * support. Private storage IDs never appear in client payloads.
 */
export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("token") ?? "";
  if (!id.startsWith("local:")) throw errors.notFound();

  // Token gates the stream: issued only by /api/v1/playback/authorize.
  const streamToken = url.searchParams.get("streamToken") ?? "";
  if (!streamToken || !verifyToken(streamToken)) throw errors.forbidden("Invalid or expired playback token");
  const limited = rateLimit(`stream:${id}`, 120, 60_000);
  if (!limited.ok) throw errors.rateLimited(limited.retryAfter);

  void token;
  const { readFile, stat } = await import("node:fs/promises");
  const path = await import("node:path");
  const rel = id.replace("local:", "");
  const filePath = path.join(process.cwd(), "public", rel);
  if (!filePath.startsWith(path.join(process.cwd(), "public"))) throw errors.forbidden();
  let size: number;
  try {
    size = (await stat(filePath)).size;
  } catch {
    throw errors.notFound("Video file not found");
  }
  const range = req.headers.get("range");
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? parseInt(match[1]) : 0;
    const end = match?.[2] ? Math.min(parseInt(match[2]), size - 1) : size - 1;
    const buf = await readFile(filePath);
    const chunk = buf.subarray(start, end + 1);
    return new NextResponse(new Uint8Array(chunk), {
      status: 206,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store",
      },
    });
  }
  const buf = await readFile(filePath);
  return new NextResponse(new Uint8Array(buf), {
    headers: { "Content-Type": "video/mp4", "Accept-Ranges": "bytes", "Cache-Control": "private, no-store" },
  });
});
