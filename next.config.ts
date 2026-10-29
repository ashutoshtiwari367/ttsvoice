import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: [
    "@google-cloud/text-to-speech",
    "@aws-sdk/client-s3",
    "razorpay",
  ],
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Use memory cache in development to eliminate Windows EPERM file locking errors on .pack.gz
      config.cache = {
        type: "memory",
      };
    }
    return config;
  },
};

export default nextConfig;
