/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Firecrawl SDK uses undici (Node.js HTTP client) which webpack cannot bundle.
    // In Next.js 14, this key lives inside experimental (moved to top-level in Next.js 15).
    serverExternalPackages: ["@mendable/firecrawl-js"],
  },
};

module.exports = nextConfig;
