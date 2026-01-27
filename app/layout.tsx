import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppNav } from "@/components/layout/AppNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AccessibilityProvider } from "@/components/accessibility";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PreCalc Tutor - Master AP Precalculus",
  description: "AI-powered AP Precalculus tutoring platform designed for students with dyslexia and ADHD",
  keywords: ["precalculus", "AP", "tutoring", "math", "accessibility", "dyslexia", "ADHD"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <ErrorBoundary>
          {/* Accessibility Provider - manages global accessibility features */}
          <AccessibilityProvider />

          <AppNav />

          <main id="main-content" className="container mx-auto px-4 py-8" tabIndex={-1}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>

          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
