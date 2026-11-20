import { flags, env } from "@/config/env";

/**
 * Storage abstraction (master prompt §1/§2): Cloudinary first, replaceable
 * (e.g. Hostinger) later without touching application logic.
 * Uploads always flow through server-generated signatures; the browser never
 * holds API secrets.
 */

export interface UploadSignature {
  folder: string;
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  uploadUrl: string;
  publicId: string;
}

export interface UploadResult {
  storageId: string;
  url?: string;
  sizeBytes?: number;
  mime?: string;
}

export interface StorageProvider {
  readonly name: string;
  /** Direct-upload signature (client uploads straight to the provider). */
  signUpload(folder: string, resourceType: "image" | "video" | "raw"): UploadSignature | null;
  /** Server-side upload path (used for small files like PDFs/images). */
  upload(file: { buffer: Buffer; mime: string; name: string }, folder: string): Promise<UploadResult>;
  /** Signed, expiring read URL for private assets (null = no secure URL available). */
  signedUrl(storageId: string, ttlSeconds: number): Promise<string | null>;
}

const cloudinaryProvider: StorageProvider = {
  name: "cloudinary",
  signUpload(folder, resourceType) {
    if (!flags.cloudinaryConfigured) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cloudinary = require("cloudinary").v2;
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const signature = cloudinary.utils.api_sign_request(
      { folder, public_id: publicId, timestamp },
      env.CLOUDINARY_API_SECRET!
    );
    return {
      folder,
      timestamp,
      signature,
      apiKey: env.CLOUDINARY_API_KEY!,
      cloudName: env.CLOUDINARY_CLOUD_NAME!,
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME!}/${resourceType}/upload`,
      publicId,
    };
  },
  async upload(file, folder) {
    if (!flags.cloudinaryConfigured) throw new Error("Cloudinary not configured");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cloudinary = require("cloudinary").v2;
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: file.mime.startsWith("video") ? "video" : "auto" }, (err: Error | null, res: Record<string, unknown>) =>
          err ? reject(err) : resolve(res)
        )
        .end(file.buffer);
    });
    return {
      storageId: String(result.public_id),
      url: String(result.secure_url ?? ""),
      sizeBytes: Number(result.bytes ?? 0),
      mime: file.mime,
    };
  },
  async signedUrl(storageId, ttlSeconds) {
    if (!flags.cloudinaryConfigured) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cloudinary = require("cloudinary").v2;
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    // Authenticated delivery with a signed, expiring URL. NOTE (master prompt §7):
    // ensure the Cloudinary account restricts unauthenticated access to these
    // assets; the signed URL alone is the access control here.
    return cloudinary.utils.private_download_url(storageId, "auto", { expires_at: new Date(Date.now() + ttlSeconds * 1000) });
  },
};

const localStorageProvider: StorageProvider = {
  name: "local",
  signUpload() {
    return null; // local provider uploads through the server route
  },
  async upload(file, folder) {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(dir, { recursive: true });
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const ext = path.extname(file.name) || "";
    const filename = `${id}${ext}`;
    await writeFile(path.join(dir, filename), file.buffer);
    return {
      storageId: `local:uploads/${folder}/${filename}`,
      url: `/uploads/${folder}/${filename}`,
      sizeBytes: file.buffer.length,
      mime: file.mime,
    };
  },
  async signedUrl(storageId) {
    // Local dev assets are served through the authenticated stream route.
    return null;
  },
};

export function getStorageProvider(): StorageProvider {
  return flags.cloudinaryConfigured ? cloudinaryProvider : localStorageProvider;
}
