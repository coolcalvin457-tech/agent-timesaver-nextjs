import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt AI Agents — AI Tools for Non-Technical Professionals",
  description:
    "Enter your job title. Answer a few questions. Walk away with 5 AI workflows built for your specific role and a real estimate of the time you could get back. Free.",
  openGraph: {
    title: "Prompt AI Agents — AI agents built for your exact job",
    description:
      "Free and paid AI agents for professionals. Answer a few questions, get personalized workflows, workflows, and more.",
    url: "https://promptaiagents.com",
    siteName: "Prompt AI Agents",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
