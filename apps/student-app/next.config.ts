import path from "path"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@xpertia/types"],
  outputFileTracingRoot: path.join(__dirname, "..", ".."),
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
