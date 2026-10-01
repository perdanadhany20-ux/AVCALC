import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  poweredByHeader: false,
  // Font PDF dibaca dari disk saat runtime; pastikan ikut ter-deploy.
  outputFileTracingIncludes: { "/api/projects/[id]/pdf": ["./assets/fonts/**"] },
};

export default nextConfig;
