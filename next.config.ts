import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: [],
  },
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
