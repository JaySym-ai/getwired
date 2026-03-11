import type { Metadata } from "next";
import { NewsFeed } from "@/components/news/NewsFeed";
import { Newspaper } from "lucide-react";

export const metadata: Metadata = {
  title: "Tech News",
  description:
    "Stay up to date with the latest tech news from Hacker News, The Verge, TechCrunch, and more — curated for the GetWired.dev community.",
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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#3B82F6]/10">
            <Newspaper className="size-5 text-[#3B82F6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tech News</h1>
            <p className="text-sm text-muted-foreground">
              Curated tech news with AI summaries — discuss articles with the community
            </p>
          </div>
        </div>
      </div>

      <NewsFeed />
    </main>
  );
}

