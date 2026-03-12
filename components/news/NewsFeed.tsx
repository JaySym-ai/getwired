"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InfiniteScroll } from "@/components/shared/InfiniteScroll";
import { NewsCard } from "@/components/news/NewsCard";
import { Clock, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "../../convex/_generated/api";

type SortMode = "latest" | "oldest";

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

  const sources = useQuery(api.news.listSources, {}) ?? [];
  const articles = useQuery(api.news.list, {
    limit: 100,
    source: source === "All" ? undefined : source,
  });
  const sourceOptions = ["All", ...sources];

  const sortedArticles = useMemo(() => {
    if (!articles) {
      return [];
    }

    const next = [...articles];
    next.sort((left, right) =>
      sort === "latest"
        ? right.publishedAt - left.publishedAt
        : left.publishedAt - right.publishedAt,
    );
    return next;
  }, [articles, sort]);

  const visibleArticles = sortedArticles.slice(0, visibleCount);
  const hasMore = visibleCount < sortedArticles.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {sourceOptions.map((option) => (
          <Badge
            key={option}
            variant={source === option ? "default" : "secondary"}
            className={cn(
              "cursor-pointer px-3 py-1 text-xs transition-colors",
              source === option
                ? "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/80"
                : "hover:bg-accent",
            )}
            onClick={() => {
              setSource(option);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
          >
            {option}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={sort === "latest" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => {
            setSort("latest");
            setVisibleCount(ITEMS_PER_PAGE);
          }}
          className={cn("gap-1.5", sort === "latest" && "text-[#3B82F6]")}
        >
          <Clock className="size-3.5" />
          Latest
        </Button>
        <Button
          variant={sort === "oldest" ? "secondary" : "ghost"}
          size="xs"
          onClick={() => {
            setSort("oldest");
            setVisibleCount(ITEMS_PER_PAGE);
          }}
          className={cn("gap-1.5", sort === "oldest" && "text-[#3B82F6]")}
        >
          <History className="size-3.5" />
          Oldest
        </Button>
      </div>

      {articles === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <NewsCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <InfiniteScroll
          onLoadMore={() => setVisibleCount((current) => current + ITEMS_PER_PAGE)}
          hasMore={hasMore}
          isLoading={false}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleArticles.map((article) => (
              <NewsCard key={article._id} article={article} />
            ))}
          </div>
        </InfiniteScroll>
      )}

      {articles && articles.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">News sync is starting</p>
          <p className="mt-1 text-sm">
            RSS feeds are configured. Articles will appear here after the first fetch completes.
          </p>
        </div>
      )}

      {articles && articles.length > 0 && sortedArticles.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No articles found</p>
          <p className="mt-1 text-sm">Try selecting a different source.</p>
        </div>
      )}
    </div>
  );
}
