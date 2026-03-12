"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Heart, MessageCircle, Eye } from "lucide-react";
import { TrendingTags } from "@/components/discover/TrendingTags";
import { Leaderboard } from "@/components/discover/Leaderboard";
import { EventCard } from "@/components/discover/EventCard";
import { UserSuggestion } from "@/components/discover/UserSuggestion";
import { api } from "../../convex/_generated/api";

export function DiscoverContent() {
  const trendingPosts = useQuery(api.posts.getTrendingDetailed, { limit: 5 }) ?? [];
  const suggestedUsers = useQuery(api.users.listSuggestions, { limit: 4 }) ?? [];
  const upcomingEvents = useQuery(api.events.getUpcoming, { limit: 4 }) ?? [];
  const users = useQuery(api.users.list, {}) ?? [];

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-bold">
          <span className="text-[#3B82F6]">⚡</span> Discover
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Explore trending topics, top contributors, and upcoming events
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Card className="glass border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Flame className="size-4 text-[#3B82F6]" />
                  Trending Posts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingPosts.map((post, index) => (
                  <Link
                    key={post._id}
                    href={`/forums/${post.category ?? "off-topic"}/${post._id}`}
                    className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                  >
                    <span className="w-6 shrink-0 text-center text-lg font-bold text-muted-foreground/40">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-[#3B82F6]">
                        {post.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <UserAvatar src={post.author.avatar} name={post.author.name} size="sm" />
                          <span className="text-xs text-muted-foreground">{post.author.name}</span>
                          <RankBadge rank={post.author.rank} />
                        </div>
                        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
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
                ))}
              </CardContent>
            </Card>

            <TrendingTags />

            <Card className="glass border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  👥 Who to Follow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestedUsers.map((user) => (
                  <UserSuggestion
                    key={user._id}
                    user={{
                      clerkId: user.clerkId,
                      name: user.name,
                      username: user.username,
                      avatar: user.avatar ?? "",
                      bio: user.bio,
                      techStack: user.techStack,
                    }}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Leaderboard />

            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                📅 Upcoming Events
              </h2>
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const host = users.find((user) => user._id === event.hostId);
                  return (
                    <EventCard
                      key={event._id}
                      event={{
                        ...event,
                        attendees: event.attendees.map((attendee) => attendee.toString()),
                        host: host
                          ? {
                              name: host.name,
                              username: host.username,
                              avatar: host.avatar,
                            }
                          : null,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
