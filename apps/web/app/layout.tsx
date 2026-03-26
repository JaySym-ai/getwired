import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GetWired - AI-Powered Testing CLI",
  description:
    "GetWired is a CLI tool that mimics a human tester. Test websites and apps with AI-powered regression testing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
