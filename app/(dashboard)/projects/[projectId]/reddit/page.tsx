"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { RedditPostCard } from "@/components/reddit-post-card";
import { RedditFilters } from "@/components/reddit-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, MessageSquare } from "lucide-react";

export default function RedditPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const posts = useQuery(api.reddit.listByProject, { projectId });
  const keywords = useQuery(api.keywords.listByProject, { projectId });
  const searchReddit = useAction(api.reddit.searchReddit);
  const [isSearching, setIsSearching] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [minRelevance, setMinRelevance] = useState(0);

  const handleSearch = async () => {
    if (!keywords) return;
    setIsSearching(true);
    try {
      const trackedKeywords = keywords
        .filter((k) => k.tracked)
        .map((k) => k.keyword)
        .slice(0, 10);
      await searchReddit({ projectId, keywords: trackedKeywords });
    } catch (e) {
      console.error("Reddit search failed:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredPosts = (posts ?? [])
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .filter((p) => p.relevanceScore >= minRelevance)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Reddit Intelligence
          </h1>
          <p className="text-muted-foreground">
            Discover and respond to relevant Reddit discussions
          </p>
        </div>
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Search Reddit
            </>
          )}
        </Button>
      </div>

      <RedditFilters
        statusFilter={statusFilter}
        onStatusChange={(v) => setStatusFilter(v ?? "all")}
        minRelevance={minRelevance}
        onRelevanceChange={setMinRelevance}
      />

      {posts === undefined ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reddit posts found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Click &quot;Search Reddit&quot; to find relevant discussions for your keywords.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <RedditPostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

