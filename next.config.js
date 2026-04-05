/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Firecrawl SDK uses undici (Node.js HTTP client) which webpack cannot bundle.
    // Next.js 14 uses serverComponentsExternalPackages (renamed to serverExternalPackages in Next.js 15).
    // Firecrawl and its sub-dependency both use undici (a Node.js native HTTP client)
    // that webpack cannot bundle. Mark both as external so Node.js resolves them at runtime.
    serverComponentsExternalPackages: ["@mendable/firecrawl-js", "firecrawl"],
  },
  async redirects() {
    return [
      // S93: Route renames. 301 redirects for SEO preservation.
      { source: "/prompt-builder", destination: "/prompts", permanent: true },
      { source: "/workflow-builder", destination: "/workflow", permanent: true },
      { source: "/industry-intel", destination: "/industry", permanent: true },
      { source: "/budget-spreadsheets", destination: "/spreadsheets", permanent: true },
      { source: "/onboarding-kit-builder", destination: "/onboarding", permanent: true },
      { source: "/pip-builder", destination: "/pip", permanent: true },
      { source: "/competitive-dossier", destination: "/company", permanent: true },
    ];
  },
};

module.exports = nextConfig;
