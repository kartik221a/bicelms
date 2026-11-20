import { flags } from "@/config/env";

/**
 * VideoProvider abstraction (master prompt §7). Deliberately honest about
 * security: signed, short-lived playback authorization + private delivery
 * where the provider supports it. We never claim browser playback makes
 * downloading or screen recording impossible; the watermark + auth layers are
 * deterrents and access control, not DRM.
 */

export interface PlaybackTarget {
  src: string;
  kind: "hls" | "mp4";
  ttlSeconds: number;
}

export interface VideoProvider {
  readonly name: string;
  /** Whether this provider delivers truly private/signed media. */
  readonly privateDelivery: boolean;
  resolve(storageId: string, ttlSeconds: number): Promise<PlaybackTarget | null>;
}

const cloudinaryVideoProvider: VideoProvider = {
  name: "cloudinary",
  privateDelivery: true,
  async resolve(storageId, ttlSeconds) {
    if (!flags.cloudinaryConfigured) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cloudinary = require("cloudinary").v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const signature = cloudinary.utils.api_sign_request(
      { public_id: storageId, expires_at: expiresAt },
      process.env.CLOUDINARY_API_SECRET!
    );
    // Authenticated asset type: URL is signed and expires. For HLS, configure
    // the media as type=authenticated with HLS manifests (supported by Cloudinary
    // advanced video) and return the .m3u8 path here.
    return {
      src: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/authenticated/${storageId}?expires_at=${expiresAt}&signature=${signature}`,
      kind: "mp4",
      ttlSeconds,
    };
  },
};

const localVideoProvider: VideoProvider = {
  name: "local",
  privateDelivery: false,
  async resolve(storageId, ttlSeconds) {
    if (!storageId) return null;
    if (storageId.startsWith("http")) {
      return { src: storageId, kind: storageId.includes(".m3u8") ? "hls" : "mp4", ttlSeconds };
    }
    // local:<path> assets stream through the authorized route with the token.
    return { src: `/api/v1/playback/stream?id=${encodeURIComponent(storageId)}`, kind: "mp4", ttlSeconds };
  },
};

export function getVideoProvider(): VideoProvider {
  return flags.cloudinaryConfigured ? cloudinaryVideoProvider : localVideoProvider;
}
