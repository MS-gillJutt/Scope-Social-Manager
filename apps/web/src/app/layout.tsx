import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Postlane — One Lane. Every Platform. Social Media Management",
  description:
    "Postlane is the unified social media command center for creators, brands, and agencies. Create once, tailor per network with native specs, and schedule across Facebook, Instagram, TikTok, LinkedIn, YouTube, Threads, and Reddit.",
  keywords: [
    "social media management",
    "social scheduler",
    "multi-platform publishing",
    "instagram scheduler",
    "tiktok scheduler",
    "threads api",
    "linkedin scheduler",
    "youtube shorts scheduling",
    "social media agency tool",
  ],
  authors: [{ name: "Postlane Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0f172a",
  openGraph: {
    title: "Postlane — One lane. Every platform.",
    description:
      "Schedule smarter, publish everywhere. Unified Composer, Visual Calendar, Multi-tenant Workspaces, and Official API integrations.",
    type: "website",
    url: "https://postlane.io",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-brand-500 selection:text-white flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
