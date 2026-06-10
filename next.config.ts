import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@paddleocr/paddleocr-js"],
  turbopack: {
    resolveAlias: {
      fs: { browser: "" },
      path: { browser: "" },
      os: { browser: "" },
      crypto: { browser: "" },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
