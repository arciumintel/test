import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/project-console",
        destination: "/partner-console",
        permanent: true,
      },
      {
        source: "/project-console/:path*",
        destination: "/partner-console/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
