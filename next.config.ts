import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
    ],
    unoptimized: process.env.PLAYWRIGHT_VISUAL === "1",
  },
};

export default nextConfig;
