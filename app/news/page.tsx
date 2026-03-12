import type { Metadata } from "next";
import { NewsFeed } from "@/components/news/NewsFeed";
import { Newspaper } from "lucide-react";

export const metadata: Metadata = {
  title: "Tech News",
  description:
    "Stay up to date with live tech news from subscribed RSS feeds, with direct links back to each source.",
  openGraph: {
    title: "Tech News | GetWired.dev",
    description: "Stay up to date with the latest tech news — curated for the GetWired.dev community.",
  },
  twitter: {
    card: "summary",
    title: "Tech News | GetWired.dev",
    description: "Stay up to date with the latest tech news — curated for the GetWired.dev community.",
  },
};

export default function NewsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#3B82F6]/10">
            <Newspaper className="size-5 text-[#3B82F6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tech News</h1>
            <p className="text-sm text-muted-foreground">
              Live RSS headlines and excerpts with direct links to the original source
            </p>
          </div>
        </div>
      </div>

      <NewsFeed />
    </main>
  );
}
