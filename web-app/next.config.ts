import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/detail", destination: "/dashboard", permanent: true },
    ];
  },
};

export default nextConfig;
