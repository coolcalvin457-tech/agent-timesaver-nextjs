import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "promptaiagents.com — AI Tools for Non-Technical Professionals",
  description:
    "Enter your job title. Answer a few questions. Walk away with 5 AI workflows built for your specific role and a real estimate of the time you could get back. Free.",
  openGraph: {
    title: "AGENT: Timesaver — AI workflows built for your exact job",
    description:
      "Find out how many hours you could save every week with AI. Free personalized workflows for any role.",
    url: "https://promptaiagents.com",
    siteName: "promptaiagents.com",
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
