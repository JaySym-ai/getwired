import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { DemoAuthProvider } from "@/lib/demo-auth";
import { WindowManagerProvider } from "@/components/desktop/WindowManager";
import { Desktop } from "@/components/desktop/Desktop";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-background text-foreground overflow-hidden`}
      >
        <DemoAuthProvider>
          <TooltipProvider>
            <WindowManagerProvider>
              <Desktop />
            </WindowManagerProvider>
            <Toaster />
          </TooltipProvider>
        </DemoAuthProvider>
      </body>
    </html>
  );
}
