import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@xpertia/types"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
