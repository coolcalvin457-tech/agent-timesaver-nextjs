/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Firecrawl SDK uses undici (Node.js HTTP client) which webpack cannot bundle.
    // Next.js 14 uses serverComponentsExternalPackages (renamed to serverExternalPackages in Next.js 15).
    // Firecrawl and its sub-dependency both use undici (a Node.js native HTTP client)
    // that webpack cannot bundle. Mark both as external so Node.js resolves them at runtime.
    serverComponentsExternalPackages: ["@mendable/firecrawl-js", "firecrawl"],
  },
};

module.exports = nextConfig;
