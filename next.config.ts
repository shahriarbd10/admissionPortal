import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Allow production builds to succeed even with ESLint errors
    ignoreDuringBuilds: true,
  },
  // If TS type errors ever block builds, you can temporarily enable:
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
