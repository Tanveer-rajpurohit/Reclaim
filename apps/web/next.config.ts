import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ["@repo/domain"],
  async rewrites() {
    const backend = process.env.BACKEND_URL || "http://127.0.0.1:3002";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
