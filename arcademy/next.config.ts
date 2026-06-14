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
  // Solana wallet adapter pulls in optional deps that aren't needed at build.
  serverExternalPackages: ["@solana/web3.js"],
};

export default nextConfig;
