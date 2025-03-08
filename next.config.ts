import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  },
  // Expose a public environment variable for the API key status
  publicRuntimeConfig: {
    hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
  },
  // Add a public environment variable for the API key status
  // This is accessible in the browser
  // We don't expose the actual API key, just whether it's configured
  serverRuntimeConfig: {
    hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
  },
  // Enable experimental Edge runtime
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  // Configure headers for better security
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

// Set a public environment variable for the API key status
process.env.NEXT_PUBLIC_HAS_API_KEY = !!process.env.GOOGLE_AI_API_KEY ? 'true' : 'false';

export default nextConfig;
