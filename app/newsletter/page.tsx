import type { Metadata } from "next";
import { NewsletterClient } from "./NewsletterClient";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Stay Wired — weekly digest of the best posts, trending news, and community highlights from GetWired.dev.",
  openGraph: {
    title: "Newsletter | GetWired.dev",
    description:
      "Stay Wired — weekly digest of the best posts, trending news, and community highlights.",
  },
};

export default function NewsletterPage() {
  return <NewsletterClient />;
}

