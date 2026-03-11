"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/shared/SearchBar";
import { SearchResults, useSearchResults, type SearchTab } from "@/components/shared/SearchResults";
import { cn } from "@/lib/utils";

const TABS: { value: SearchTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "posts", label: "Posts" },
  { value: "users", label: "Users" },
  { value: "news", label: "News" },
  { value: "forums", label: "Forums" },
];

export function SearchApp() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("all");

  const { posts, users, news, forums } = useSearchResults(query);

  const counts: Record<SearchTab, number> = {
    all: posts.length + users.length + news.length + forums.length,
    posts: posts.length,
    users: users.length,
    news: news.length,
    forums: forums.length,
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#3B82F6]/10">
            <Search className="size-5 text-[#3B82F6]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Search</h1>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          autoFocus
          size="lg"
          placeholder="Search posts, users, news, forums..."
        />
      </div>

      {/* Tabs */}
      {query.trim() && (
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.value
                  ? "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white border border-transparent"
              )}
            >
              {t.label}
              {counts[t.value] > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0 ml-0.5",
                    tab === t.value && "bg-[#3B82F6]/20 text-[#3B82F6]"
                  )}
                >
                  {counts[t.value]}
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <SearchResults query={query} tab={tab} />
    </div>
  );
}

