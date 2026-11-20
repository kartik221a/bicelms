import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // firebase-admin (and friends) are CommonJS with dynamic requires that
  // break under Turbopack server bundling on Vercel — keep them external so
  // they are loaded via node require at runtime (our provider code only
  // dynamic-imports them when actually configured).
  serverExternalPackages: ["firebase-admin", "firebase", "prisma", "@prisma/client"],
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
