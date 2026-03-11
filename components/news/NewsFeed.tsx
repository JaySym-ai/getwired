"use client";

import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScroll } from "@/components/shared/InfiniteScroll";
import { NewsCard, type DemoNewsArticle } from "@/components/news/NewsCard";
import { DEMO_NEWS_ARTICLES } from "@/lib/demo-data";
import { Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const SOURCES = [
  "All",
  "Hacker News",
  "The Verge",
  "TechCrunch",
  "Ars Technica",
  "Wired",
  "Dev.to",
  "Product Hunt",
] as const;

type SortMode = "latest" | "popular";

const ITEMS_PER_PAGE = 6;

function NewsCardSkeleton() {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-1.5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-10" />
      </div>
    </div>
  );
}

export function NewsFeed() {
  const [source, setSource] = useState<string>("All");
  const [sort, setSort] = useState<SortMode>("latest");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(false);

  const articles = useMemo(() => {
    const filtered = source === "All"
      ? [...DEMO_NEWS_ARTICLES]
      : DEMO_NEWS_ARTICLES.filter((a) => a.source === source);

    if (sort === "latest") {
      filtered.sort((a, b) => b.publishedAt - a.publishedAt);
    }
    // "popular" — just reverse the default order for demo variety
    if (sort === "popular") {
      filtered.sort((a, b) => a.publishedAt - b.publishedAt);
    }

    return filtered as DemoNewsArticle[];
  }, [source, sort]);

  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;

  const loadMore = useCallback(() => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
      setIsLoading(false);
    }, 400);
  }, []);

  const handleSourceChange = (s: string) => {
    setSource(s);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  return (
    <div className="space-y-6">
      {/* Source filter bar */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <Badge
            key={s}
            variant={source === s ? "default" : "secondary"}
            className={cn(
              "cursor-pointer transition-colors text-xs px-3 py-1",
              source === s
                ? "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/80"
                : "hover:bg-white/10"
            )}
            onClick={() => handleSourceChange(s)}
          >
            {s}
          </Badge>
        ))}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={sort === "latest" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setSort("latest")}
          className={cn("gap-1.5", sort === "latest" && "text-[#3B82F6]")}
        >
          <Clock className="size-3.5" />
          Latest
        </Button>
        <Button
          variant={sort === "popular" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => setSort("popular")}
          className={cn("gap-1.5", sort === "popular" && "text-[#3B82F6]")}
        >
          <Flame className="size-3.5" />
          Popular
        </Button>
      </div>

      {/* Articles grid */}
      <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} isLoading={isLoading}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleArticles.map((article, idx) => (
            <NewsCard
              key={`${article.source}-${article.title}`}
              article={article}
              articleIndex={idx}
            />
          ))}
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <NewsCardSkeleton key={`skeleton-${i}`} />
            ))}
        </div>
      </InfiniteScroll>

      {articles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No articles found</p>
          <p className="text-sm mt-1">Try selecting a different source</p>
        </div>
      )}
    </div>
  );
}

