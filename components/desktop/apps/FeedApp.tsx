"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { FeedList } from "@/components/feed/FeedList";
import { PostComposer } from "@/components/feed/PostComposer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Flame, Clock, Users, TrendingUp } from "lucide-react";
import { api } from "../../../convex/_generated/api";

type FeedTab = "hot" | "new" | "following" | "trending";

export function FeedApp() {
  const [activeTab, setActiveTab] = useState<FeedTab>("hot");
  const posts = useQuery(api.posts.listDetailed, { limit: 50 }) ?? [];

  const filteredPosts = useMemo(() => {
    const next = [...posts];
    switch (activeTab) {
      case "hot":
        return next.sort((left, right) => right.likes - left.likes);
      case "new":
        return next.sort((left, right) => right.createdAt - left.createdAt);
      case "following":
        return next.sort((left, right) => right.createdAt - left.createdAt);
      case "trending":
        return next.sort((left, right) => right.views - left.views);
      default:
        return next;
    }
  }, [activeTab, posts]);

  return (
    <div className="flex gap-4 p-4">
      <div className="min-w-0 flex-1">
        <PostComposer />

        <div className="mt-4">
          <Tabs defaultValue="hot" onValueChange={(value) => setActiveTab(value as FeedTab)}>
            <TabsList className="mb-4 border border-border bg-muted/50">
              <TabsTrigger value="hot" className="gap-1.5 data-active:text-[#3B82F6]">
                <Flame className="size-3.5" /> Hot
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-1.5 data-active:text-[#3B82F6]">
                <Clock className="size-3.5" /> New
              </TabsTrigger>
              <TabsTrigger value="following" className="gap-1.5 data-active:text-[#3B82F6]">
                <Users className="size-3.5" /> Following
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-1.5 data-active:text-[#3B82F6]">
                <TrendingUp className="size-3.5" /> Trending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hot">
              <FeedList posts={filteredPosts} isLoading={posts.length === 0} />
            </TabsContent>
            <TabsContent value="new">
              <FeedList posts={filteredPosts} isLoading={posts.length === 0} />
            </TabsContent>
            <TabsContent value="following">
              <FeedList posts={filteredPosts} isLoading={posts.length === 0} />
            </TabsContent>
            <TabsContent value="trending">
              <FeedList posts={filteredPosts} isLoading={posts.length === 0} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
