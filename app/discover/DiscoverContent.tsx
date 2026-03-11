"use client";

import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Heart, MessageCircle, Eye } from "lucide-react";
import { DEMO_POSTS, DEMO_USERS, DEMO_EVENTS } from "@/lib/demo-data";
import type { UserRank } from "@/lib/types";
import { TrendingTags } from "@/components/discover/TrendingTags";
import { Leaderboard } from "@/components/discover/Leaderboard";
import { EventCard } from "@/components/discover/EventCard";
import { UserSuggestion } from "@/components/discover/UserSuggestion";

// Top 5 posts by likes
const trendingPosts = [...DEMO_POSTS]
  .sort((a, b) => b.likes - a.likes)
  .slice(0, 5);

// Suggested users (pick a variety)
const suggestedUsers = [DEMO_USERS[2], DEMO_USERS[3], DEMO_USERS[4], DEMO_USERS[5]]
  .filter((u): u is (typeof DEMO_USERS)[number] => Boolean(u));

// Upcoming events (sorted by start time)
const upcomingEvents = [...DEMO_EVENTS]
  .sort((a, b) => a.startTime - b.startTime)
  .slice(0, 4);

export function DiscoverContent() {
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <Sidebar />

      <main className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <span className="text-[#3B82F6]">⚡</span> Discover
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Explore trending topics, top contributors, and upcoming events
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Trending Posts */}
            <Card className="glass border-white/8">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Flame className="size-4 text-[#3B82F6]" />
                  Trending Posts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingPosts.map((post, i) => {
                  const author = DEMO_USERS[post.authorIndex];
                  if (!author) return null;
                  return (
                    <Link
                      key={`${post.title}-${i}`}
                      href={`/forums/${post.category}/post-${DEMO_POSTS.indexOf(post)}`}
                      className="flex gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors group"
                    >
                      <span className="text-lg font-bold text-muted-foreground/40 w-6 shrink-0 text-center">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug group-hover:text-[#3B82F6] transition-colors line-clamp-2">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1.5">
                            <UserAvatar src={author.avatar} name={author.name} size="sm" />
                            <span className="text-xs text-muted-foreground">{author.name}</span>
                            <RankBadge rank={author.rank as UserRank} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
                            <span className="flex items-center gap-0.5">
                              <Heart className="size-3" /> {post.likes}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <MessageCircle className="size-3" /> {post.commentCount}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Eye className="size-3" /> {post.views.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            {/* Trending Tags */}
            <TrendingTags />

            {/* Who to Follow */}
            <Card className="glass border-white/8">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  👥 Who to Follow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestedUsers.map((user) => (
                  <UserSuggestion key={user.clerkId} user={user} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Leaderboard />

            {/* Upcoming Events */}
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold mb-3">
                📅 Upcoming Events
              </h2>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.title} event={event} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

