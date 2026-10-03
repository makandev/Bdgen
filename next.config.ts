import type { NextConfig } from "next";

const server = process.env.NEXT_PUBLIC_MODE === "server";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Server-only files (API routes, proxy) end in .server.ts and are only picked up by the server build.
const nextConfig: NextConfig = {
  ...(server ? {} : { output: "export" as const, images: { unoptimized: true } }),
  pageExtensions: server ? ["tsx", "ts", "server.ts"] : ["tsx", "ts"],
  basePath,
  trailingSlash: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_MODE: server ? "server" : "static" },
};

export default nextConfig;
