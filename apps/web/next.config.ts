import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@concierge/core",
    "@concierge/ai",
    "@concierge/database",
    "@concierge/ui",
  ],
  serverExternalPackages: ["@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
