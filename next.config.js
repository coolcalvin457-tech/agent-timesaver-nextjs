/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Firecrawl SDK uses undici (Node.js HTTP client) which webpack cannot bundle.
    // Next.js 14 uses serverComponentsExternalPackages (renamed to serverExternalPackages in Next.js 15).
    serverComponentsExternalPackages: ["@mendable/firecrawl-js"],
  },
};

module.exports = nextConfig;
