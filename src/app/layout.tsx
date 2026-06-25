import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import CookieConsent from "@/components/CookieConsent";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://stem-aistudy.com";

export const metadata: Metadata = {
  title: "AI Study - STEM Learning Engine",
  description: "AI-powered STEM learning platform. Solve problems, visualize concepts, and master math, physics, chemistry with intelligent AI assistance.",
  keywords: ["STEM", "AI learning", "math solver", "physics", "chemistry", "education", "study tool"],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "AI Study - STEM Learning Engine",
    description: "AI-powered STEM learning platform. Solve problems, visualize concepts, and master math, physics, chemistry with intelligent AI assistance.",
    url: siteUrl,
    siteName: "AI Study",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Study - STEM Learning Engine",
    description: "AI-powered STEM learning platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full">
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}