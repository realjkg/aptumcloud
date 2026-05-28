import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@azure/openai"],
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
