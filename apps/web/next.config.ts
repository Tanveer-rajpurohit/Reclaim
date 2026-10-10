import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/domain"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
