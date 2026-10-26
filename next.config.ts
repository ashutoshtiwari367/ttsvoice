import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
