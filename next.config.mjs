import { createMDX } from "fumadocs-mdx/next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const prismaClient = path.join(rootDir, "generated/client.ts");

/** @type {import('next').NextConfig} */
const config = {
  // Custom Prisma output (`generated/`) — map for bundlers (webpack dev + turbopack).
  turbopack: {
    resolveAlias: {
      "@prisma/client": prismaClient,
    },
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve ??= {};
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      "@prisma/client": prismaClient,
    };
    return webpackConfig;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "mintcdn.com",
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

const withMDX = createMDX();

export default withMDX(config);
