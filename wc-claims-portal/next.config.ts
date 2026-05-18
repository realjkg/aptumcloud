import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["@azure/openai"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.microsoftonline.com",
      },
    ],
  },
};

export default nextConfig;
