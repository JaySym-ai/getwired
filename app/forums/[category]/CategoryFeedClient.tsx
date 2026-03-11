"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Heart, MessageSquare, Eye, Flame, Clock, MessageCircle } from "lucide-react";
import { Brain, Globe, Smartphone, Cpu, ShieldCheck, Rocket, TrendingUp, Coffee, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { DEMO_CATEGORIES, DEMO_POSTS, DEMO_USERS } from "@/lib/demo-data";

const iconMap: Record<string, LucideIcon> = { Brain, Globe, Smartphone, Cpu, ShieldCheck, Rocket, TrendingUp, Coffee };
type SortOption = "hot" | "new" | "comments";

function formatTimeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface CategoryFeedClientProps { slug: string; }

export function CategoryFeedClient({ slug }: CategoryFeedClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>("hot");
  const category = DEMO_CATEGORIES.find((c) => c.slug === slug);
  const Icon = category ? (iconMap[category.icon] ?? Brain) : Brain;

  const posts = useMemo(() => {
    const filtered = DEMO_POSTS.map((p, i) => ({ ...p, index: i })).filter((p) => p.category === slug);
    switch (sortBy) {
      case "hot": return [...filtered].sort((a, b) => b.likes - a.likes);
      case "new": return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
      case "comments": return [...filtered].sort((a, b) => b.commentCount - a.commentCount);
      default: return filtered;
    }
  }, [slug, sortBy]);

  if (!category) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted-foreground">Category not found</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Link href="/forums" className="hover:text-white transition-colors">Forums</Link>
        <ChevronRight className="size-3" />
        <span className="text-white">{category.name}</span>
      </nav>

      {/* Category header */}
      <div className="glass rounded-xl p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
            <Icon className="size-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white">{category.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
          </div>
          <Badge variant="secondary" className="text-xs">{category.postCount} posts</Badge>
        </div>
      </div>

      {/* Sort + New Post */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {([["hot", Flame], ["new", Clock], ["comments", MessageCircle]] as const).map(([key, SortIcon]) => (
            <Button key={key} variant={sortBy === key ? "secondary" : "ghost"} size="sm" onClick={() => setSortBy(key)} className="gap-1.5 capitalize text-xs">
              <SortIcon className="size-3" />{key === "comments" ? "Most Commented" : key === "hot" ? "Hot" : "New"}
            </Button>
          ))}
        </div>
        <Button size="sm" className="gap-1.5"><Plus className="size-3" />New Post</Button>
      </div>

      {/* Posts list */}
      <div className="space-y-3">
        {posts.map((post) => {
          const author = DEMO_USERS[post.authorIndex];
          if (!author) return null;
          return (
            <Link key={post.index} href={`/forums/${slug}/post-${post.index}`} className="block group">
              <div className="glass rounded-xl p-4 transition-all hover:glow-green-sm">
                <div className="flex items-start gap-3">
                  <UserAvatar src={author.avatar} name={author.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">{author.name}</span>
                      <RankBadge rank={author.rank} />
                      <span className="text-[10px] text-muted-foreground">{formatTimeAgo(post.createdAt)}</span>
                      {post.isPinned && <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] text-[9px] border-[#3B82F6]/30 px-1 py-0">📌</Badge>}
                    </div>
                    <h3 className="text-sm font-medium text-white group-hover:text-[#3B82F6] transition-colors line-clamp-1">{post.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.content.slice(0, 150)}...</p>
                    <div className="flex items-center gap-3 mt-2">
                      {post.tags.slice(0, 3).map((tag) => (<Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">#{tag}</Badge>))}
                      <div className="flex items-center gap-3 ml-auto text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Heart className="size-3" />{post.likes}</span>
                        <span className="flex items-center gap-0.5"><MessageSquare className="size-3" />{post.commentCount}</span>
                        <span className="flex items-center gap-0.5"><Eye className="size-3" />{post.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No posts in this category yet</p>
        </div>
      )}
    </div>
  );
}

