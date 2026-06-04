import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "192.168.1.158",
    "192.168.1.231",
    "macbook-pro-x.local",
    "MacBook-Pro-X.local"
  ],
  outputFileTracingRoot: path.join(__dirname)
};

export default nextConfig;
