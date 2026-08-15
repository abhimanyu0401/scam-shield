import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["192.168.1.4", "localhost:3000", "192.168.1.4:3000"],
};

export default nextConfig;
