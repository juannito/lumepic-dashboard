import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.158"],
  outputFileTracingRoot: path.join(__dirname)
};

export default nextConfig;
