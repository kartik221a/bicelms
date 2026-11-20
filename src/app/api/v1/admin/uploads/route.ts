import { handler, jsonOk, errors } from "@/lib/api";
import { z } from "zod";
import { requireRole } from "@/services/auth/session";
import { getStorageProvider } from "@/providers/storage";
import { rateLimit } from "@/lib/rate-limit";

const signSchema = z.object({
  folder: z.enum(["videos", "thumbnails", "resources"]),
  resourceType: z.enum(["image", "video", "raw"]).default("raw"),
});

/**
 * Secure direct uploads (master prompt §10): large files (videos) never pass
 * through Next.js API routes. The client uploads straight to the storage
 * provider using a server-generated signature. The local dev provider returns
 * a server-upload flow instead.
 */
export const POST = handler(async (req: Request) => {
  await requireRole("admin", "super_admin", "instructor");
  const limited = rateLimit("uploads-sign", 60, 60_000);
  if (!limited.ok) throw errors.rateLimited(limited.retryAfter);
  const body = signSchema.parse(await req.json());

  const provider = getStorageProvider();
  const signature = provider.signUpload(body.folder, body.resourceType);
  if (signature) return jsonOk({ mode: "direct", provider: provider.name, signature });

  if (body.folder === "videos" && body.resourceType === "video") {
    // Local provider: small demo uploads through the server route only.
    return jsonOk({ mode: "server", provider: provider.name, endpoint: "/api/v1/admin/uploads", folder: body.folder });
  }
  return jsonOk({ mode: "server", provider: provider.name, endpoint: "/api/v1/admin/uploads", folder: body.folder });
});
