import type { NextConfig } from "next";
import path from "path";

// Get basePath from environment variable, default to empty string
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Set basePath for GitHub Pages deployment
  basePath: basePath,
  
  // Enable static export for GitHub Pages
  output: process.env.NEXT_EXPORT === "true" ? "export" : undefined,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },

  // Ensure path aliases resolve in Webpack/Turbopack
  webpack: (config) => {
    // Preserve existing aliases
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
      "@hooks": path.resolve(__dirname, "hooks"),
      "@fhevm": path.resolve(__dirname, "fhevm"),
      "@abi": path.resolve(__dirname, "abi"),
    };
    return config;
  },
  
  // Headers configuration (only works in server mode, not in static export)
  // For static export, these headers need to be set via GitHub Pages configuration
  headers() {
    // Required by FHEVM 
    return Promise.resolve([
      {
        source: '/',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]);
  }
};

export default nextConfig;

