"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { FeedList } from "@/components/feed/FeedList";
import { PostComposer } from "@/components/feed/PostComposer";
import { UserAvatar } from "@/components/shared/Avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Clock, Users, TrendingUp, Calendar, UserPlus } from "lucide-react";
import { api } from "../convex/_generated/api";

type FeedTab = "hot" | "new" | "following" | "trending";

function formatEventDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GetWired.dev",
  url: "https://getwired.dev",
  description: "The all-in-one tech community platform for developers.",
  sameAs: [],
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<FeedTab>("hot");
  const posts = useQuery(api.posts.listDetailed, { limit: 50 }) ?? [];
  const tagStats = useQuery(api.posts.listTagStats, {}) ?? [];
  const upcomingEvents = useQuery(api.events.getUpcoming, { limit: 3 }) ?? [];
  const suggestedUsers = useQuery(api.users.listSuggestions, { limit: 3 }) ?? [];

  const filteredPosts = useMemo(() => {
    const next = [...posts];

    switch (activeTab) {
      case "hot":
        return next.sort((left, right) => {
          const leftScore = left.likes + left.commentCount * 2 + left.views * 0.1;
          const rightScore = right.likes + right.commentCount * 2 + right.views * 0.1;
          return rightScore - leftScore;
        });
      case "new":
        return next.sort((left, right) => right.createdAt - left.createdAt);
      case "trending":
        return next.sort((left, right) => right.views - left.views);
      case "following":
        return next.sort((left, right) => right.createdAt - left.createdAt);
      default:
        return next;
    }
  }, [activeTab, posts]);

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
      />
      <Sidebar />

      <main className="min-w-0 flex-1">
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
      </main>

      <aside className="hidden w-72 shrink-0 xl:block">
        <div className="sticky top-20 flex flex-col gap-4">
          <div className="glass rounded-xl p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              🔥 Trending Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tagStats.slice(0, 10).map(({ tag }) => (
                <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer text-[11px] transition-colors hover:bg-[#3B82F6]/10 hover:text-[#3B82F6]"
                  >
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              📅 Upcoming Events
            </h3>
            <div className="space-y-3">
              {upcomingEvents.length === 0 && (
                <p className="text-xs text-muted-foreground">No upcoming events yet.</p>
              )}
              {upcomingEvents.map((event) => (
                <div key={event._id} className="group">
                  <div className="flex items-start gap-2">
                    <div className="flex shrink-0 flex-col items-center justify-center rounded-md bg-[#3B82F6]/10 px-2 py-1 text-center">
                      <Calendar className="mb-0.5 size-3 text-[#3B82F6]" />
                      <span className="text-[10px] font-medium text-[#3B82F6]">
                        {formatEventDate(event.startTime)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium leading-tight transition-colors group-hover:text-[#3B82F6]">
                        {event.title}
                      </p>
                      <p className="text-[10px] capitalize text-muted-foreground">{event.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              👥 Who to Follow
            </h3>
            <div className="space-y-3">
              {suggestedUsers.length === 0 && (
                <p className="text-xs text-muted-foreground">More members will appear here as they join.</p>
              )}
              {suggestedUsers.map((user) => (
                <div key={user._id} className="flex items-center gap-2.5">
                  <UserAvatar src={user.avatar} name={user.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{user.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">@{user.username}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    className="h-6 shrink-0 gap-1 border-border text-[10px] hover:bg-[#3B82F6]/10 hover:text-[#3B82F6]"
                  >
                    <UserPlus className="size-3" />
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
