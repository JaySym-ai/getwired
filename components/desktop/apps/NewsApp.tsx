"use client";

import { NewsFeed } from "@/components/news/NewsFeed";
import { Newspaper } from "lucide-react";

export function NewsApp() {
  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
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
    </div>
  );
}

