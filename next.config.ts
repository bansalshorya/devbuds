import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return ["/mentor/:path*", "/student/:path*", "/department/:path*", "/api/:path*"].map((source) => ({ source, headers: [{ key: "Cache-Control", value: "private, no-store" }, { key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "same-origin" }] }));
  },
};

export default nextConfig;
