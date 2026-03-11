"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { FeedList } from "@/components/feed/FeedList";
import { PostComposer } from "@/components/feed/PostComposer";
import { UserAvatar } from "@/components/shared/Avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Clock, Users, TrendingUp, Calendar, UserPlus } from "lucide-react";
import { DEMO_POSTS, DEMO_USERS, DEMO_EVENTS } from "@/lib/demo-data";

type FeedTab = "hot" | "new" | "following" | "trending";

// Build enriched posts from demo data
function getFilteredPosts(tab: FeedTab) {
  const posts = [...DEMO_POSTS];
  switch (tab) {
    case "hot":
      return posts.sort((a, b) => {
        const scoreA = a.likes + a.commentCount * 2 + a.views * 0.1;
        const scoreB = b.likes + b.commentCount * 2 + b.views * 0.1;
        return scoreB - scoreA;
      });
    case "new":
      return posts.sort((a, b) => b.createdAt - a.createdAt);
    case "following":
      // Simulate following: show posts from first 3 authors
      return posts
        .filter((p) => p.authorIndex <= 2)
        .sort((a, b) => b.createdAt - a.createdAt);
    case "trending":
      return posts.sort((a, b) => b.views - a.views);
    default:
      return posts;
  }
}

const TRENDING_TAGS = [
  "ai", "gpt-5", "react", "nextjs", "rust", "security",
  "startup", "career", "typescript", "llm",
];

const SUGGESTED_USERS = DEMO_USERS.slice(1, 4);

function formatEventDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  const [localPosts, setLocalPosts] = useState(DEMO_POSTS);

  const filteredPosts = useMemo(() => getFilteredPosts(activeTab), [activeTab]);

  const handleNewPost = (post: { title: string; content: string; category: string; tags: string[] }) => {
    const newPost = {
      ...post,
      type: "post" as const,
      likes: 0,
      commentCount: 0,
      views: 1,
      isBoosted: false,
      isPinned: false,
      isDemo: false,
      createdAt: Date.now(),
      authorIndex: 0,
    };
    setLocalPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
      />
      <Sidebar />

      {/* Main feed */}
      <main className="flex-1 min-w-0">
        <PostComposer onPost={handleNewPost} />

        <div className="mt-4">
          <Tabs defaultValue="hot" onValueChange={(v) => setActiveTab(v as FeedTab)}>
            <TabsList className="mb-4 bg-zinc-900/40 border border-white/8">
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
              <FeedList posts={filteredPosts} />
            </TabsContent>
            <TabsContent value="new">
              <FeedList posts={filteredPosts} />
            </TabsContent>
            <TabsContent value="following">
              <FeedList posts={filteredPosts} />
            </TabsContent>
            <TabsContent value="trending">
              <FeedList posts={filteredPosts} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Right sidebar */}
      <aside className="hidden xl:block w-72 shrink-0">
        <div className="sticky top-20 flex flex-col gap-4">
          {/* Trending Tags */}
          <div className="glass rounded-xl p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              🔥 Trending Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_TAGS.map((tag) => (
                <Link key={tag} href={`/search?tag=${tag}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer text-[11px] hover:bg-[#3B82F6]/10 hover:text-[#3B82F6] transition-colors"
                  >
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="glass rounded-xl p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              📅 Upcoming Events
            </h3>
            <div className="space-y-3">
              {DEMO_EVENTS.slice(0, 3).map((event) => (
                <div key={event.title} className="group">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-center justify-center rounded-md bg-[#3B82F6]/10 px-2 py-1 text-center shrink-0">
                      <Calendar className="size-3 text-[#3B82F6] mb-0.5" />
                      <span className="text-[10px] font-medium text-[#3B82F6]">
                        {formatEventDate(event.startTime)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-tight truncate group-hover:text-[#3B82F6] transition-colors">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground capitalize">{event.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Who to follow */}
          <div className="glass rounded-xl p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              👥 Who to Follow
            </h3>
            <div className="space-y-3">
              {SUGGESTED_USERS.map((u) => (
                <div key={u.username} className="flex items-center gap-2.5">
                  <UserAvatar src={u.avatar} name={u.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">@{u.username}</p>
                  </div>
                  <Button variant="outline" size="xs" className="shrink-0 text-[10px] h-6 gap-1 border-white/10 hover:bg-[#3B82F6]/10 hover:text-[#3B82F6]">
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
