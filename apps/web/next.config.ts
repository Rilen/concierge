import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@concierge/core", "@concierge/ai", "@concierge/database", "@concierge/ui"],
};

export default nextConfig;
