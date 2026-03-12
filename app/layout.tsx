import type { Metadata, Viewport } from "next";

import { RootShell } from "@/components/layout/RootShell";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";



export const metadata: Metadata = {
  title: {
    default: "GetWired.dev | Made with Opus 4.6 — Tech Community Platform",
    template: "%s | GetWired.dev",
  },
  description:
    "GetWired.dev — The all-in-one tech community platform. Forums, chat, news, profiles, and more.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "GetWired.dev",
    title: "GetWired.dev — Tech Community",
    description:
      "The all-in-one tech community platform for developers. Forums, real-time chat, tech news, and professional profiles.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GetWired.dev — Tech Community",
    description:
      "The all-in-one tech community platform for developers.",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="antialiased min-h-screen bg-background text-foreground overflow-hidden"
      >
        <AppProviders>
          <RootShell>{children}</RootShell>
        </AppProviders>
      </body>
    </html>
  );
}
