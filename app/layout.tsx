import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoAuthProvider } from "@/lib/demo-auth";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
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
    default: "Made with Opus 4.6",
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
  themeColor: "#00FF41",
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
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <DemoAuthProvider>
          <TooltipProvider>
            <Navbar />
            <div className="pt-14 pb-14 md:pb-0">
              {children}
            </div>
            <MobileNav />
            <Footer />
          </TooltipProvider>
        </DemoAuthProvider>
      </body>
    </html>
  );
}
