import type { NextConfig } from "next";
import { appCSP } from "./src/lib/csp";

const server = process.env.NEXT_PUBLIC_MODE === "server";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Server-only files (API routes, proxy) end in .server.ts and are only picked up by the server build.
const nextConfig: NextConfig = {
  ...(server ? {} : { output: "export" as const, images: { unoptimized: true } }),
  pageExtensions: server ? ["tsx", "ts", "server.ts"] : ["tsx", "ts"],
  basePath,
  trailingSlash: true,
  poweredByHeader: false,
  // Static hosting (GitHub Pages) cannot send headers – there the policy comes as <meta> (layout.tsx).
  ...(server
    ? {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                // The server talks to the AI itself, so the browser only needs its own origin.
                { key: "Content-Security-Policy", value: `${appCSP([])}; frame-ancestors 'none'` },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Referrer-Policy", value: "no-referrer" },
                { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
              ],
            },
          ];
        },
      }
    : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath, NEXT_PUBLIC_MODE: server ? "server" : "static" },
};

export default nextConfig;
