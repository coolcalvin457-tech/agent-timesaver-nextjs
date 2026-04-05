/** @type {import('next').NextConfig} */
const nextConfig = {
  // Firecrawl SDK uses undici (Node.js HTTP client) which webpack cannot bundle.
  // Marking it as external tells Next.js to load it from node_modules at runtime.
  serverExternalPackages: ["@mendable/firecrawl-js"],
};

module.exports = nextConfig;
