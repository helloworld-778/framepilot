import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { MotionProvider } from "@/components/shared/motion-provider";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME } from "@/lib/constants";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_DESCRIPTION =
  "Turn a rough video idea into a structured cinematic storyboard, shot plan, and generator-ready prompt.";

export const metadata: Metadata = {
  title: {
    default: "FramePilot — AI Creative Direction for Video",
    template: "%s · FramePilot",
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "storyboard",
    "shot list",
    "pre-production",
    "creative direction",
    "video prompt",
  ],
  openGraph: {
    // No remote preview image: the app ships zero external asset dependencies.
    title: "FramePilot — AI Creative Direction for Video",
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "FramePilot — AI Creative Direction for Video",
    description: APP_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
        >
          Skip to content
        </a>
        <MotionProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </MotionProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
