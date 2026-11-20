import { NextResponse } from "next/server";
import { handler, errors } from "@/lib/api";
import { requireUser } from "@/services/auth/session";
import { assertResourceAccess } from "@/services/resource.service";

/**
 * Download route for permitted resources. Access control (enrollment +
 * lesson-gating) is re-verified server-side on every request. View-only
 * resources are rejected here as well.
 */
export const GET = handler(async (_req: Request, ctx: { params: Promise<{ resourceId: string }> }) => {
  const user = await requireUser();
  const { resourceId } = await ctx.params;
  const resource = await assertResourceAccess(user.id, resourceId);
  if (!resource.downloadable) throw errors.forbidden("This resource is view-only.");

  if (resource.type === "external" && resource.externalUrl) {
    return NextResponse.redirect(resource.externalUrl);
  }
  if (resource.storageId?.startsWith("local:")) {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const filePath = path.join(process.cwd(), "public", resource.storageId.replace("local:", ""));
    if (!filePath.startsWith(path.join(process.cwd(), "public"))) throw errors.forbidden();
    try {
      const buf = await readFile(filePath);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": resource.mime ?? "application/octet-stream",
          "Content-Disposition": `attachment; filename="${resource.title.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
        },
      });
    } catch {
      throw errors.notFound("File not found");
    }
  }
  if (resource.storageId) {
    const { getStorageProvider } = await import("@/providers/storage");
    const url = await getStorageProvider().signedUrl(resource.storageId, 300);
    if (url) return NextResponse.redirect(url);
  }
  if (resource.externalUrl) return NextResponse.redirect(resource.externalUrl);
  throw errors.notFound("This resource has no downloadable file yet.");
});
