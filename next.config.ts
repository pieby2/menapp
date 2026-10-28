import type { NextConfig } from "next";

const IS_APP = process.env.NEXT_PUBLIC_BUILD_TARGET === "app";

const turbopack: NextConfig["turbopack"] = {
  rules: {
    "*.css": {
      loaders: ["@tailwindcss/turbopack"],
      as: "*.css",
    },
  },
};

function webConfig(): NextConfig {
  const backendUrl = (process.env.BACKEND_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
  if (process.env.VERCEL && !process.env.BACKEND_URL) {
    throw new Error(
      "BACKEND_URL is not set. Add it in Vercel → Project → Settings → Environment Variables " +
        "(e.g. https://<your-app>.fastapicloud.dev).",
    );
  }
  return {
    cacheComponents: true,
    partialPrefetching: true,
    experimental: {
      instantInsights: { validationLevel: "manual-warning" },
    },
    turbopack,
    async rewrites() {
      return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
    },
  };
}

function appConfig(): NextConfig {
  return {
    output: "export",
    images: { unoptimized: true },
    turbopack,
  };
}

const nextConfig: NextConfig = IS_APP ? appConfig() : webConfig();

export default nextConfig;
