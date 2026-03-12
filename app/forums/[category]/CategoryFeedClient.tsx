"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  ChevronRight,
  Plus,
  Heart,
  MessageSquare,
  Eye,
  Flame,
  Clock,
  MessageCircle,
} from "lucide-react";
import {
  Brain,
  Globe,
  Smartphone,
  Cpu,
  ShieldCheck,
  Rocket,
  TrendingUp,
  Coffee,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { api } from "../../../convex/_generated/api";

const iconMap: Record<string, LucideIcon> = {
  Brain,
  Globe,
  Smartphone,
  Cpu,
  ShieldCheck,
  Rocket,
  TrendingUp,
  Coffee,
};

type SortOption = "hot" | "new" | "comments";

function formatTimeAgo(ts: number) {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CategoryFeedClient({ slug }: { slug: string }) {
  const [sortBy, setSortBy] = useState<SortOption>("hot");
  const category = useQuery(api.forums.getCategoryBySlug, { slug });
  const rawPosts = useQuery(api.posts.listDetailed, { category: slug, limit: 100 }) ?? [];
  const Icon = category ? iconMap[category.icon] ?? Brain : Brain;

  const posts = useMemo(() => {
    const next = [...rawPosts];
    switch (sortBy) {
      case "hot":
        return next.sort((left, right) => right.likes - left.likes);
      case "new":
        return next.sort((left, right) => right.createdAt - left.createdAt);
      case "comments":
        return next.sort((left, right) => right.commentCount - left.commentCount);
      default:
        return next;
    }
  }, [rawPosts, sortBy]);

  if (category === undefined) {
    return null;
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted-foreground">
        Category not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/forums" className="transition-colors hover:text-foreground">
          Forums
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      <div className="glass mb-6 rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${category.color}15`, color: category.color }}
          >
            <Icon className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-foreground">{category.name}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{category.description}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {category.postCount} posts
          </Badge>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {([
            ["hot", Flame, "Hot"],
            ["new", Clock, "New"],
            ["comments", MessageCircle, "Most Commented"],
          ] as const).map(([key, SortIcon, label]) => (
            <Button
              key={key}
              variant={sortBy === key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy(key)}
              className="gap-1.5 text-xs capitalize"
            >
              <SortIcon className="size-3" />
              {label}
            </Button>
          ))}
        </div>
        <Link href="/">
          <Button size="sm" className="gap-1.5">
            <Plus className="size-3" />
            New Post
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <Link key={post._id} href={`/forums/${slug}/${post._id}`} className="group block">
            <div className="glass rounded-xl p-4 transition-all hover:glow-green-sm">
              <div className="flex items-start gap-3">
                <UserAvatar src={post.author.avatar} name={post.author.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{post.author.name}</span>
                    <RankBadge rank={post.author.rank} />
                    <span className="text-[10px] text-muted-foreground">{formatTimeAgo(post.createdAt)}</span>
                    {post.isPinned && (
                      <Badge className="border-[#3B82F6]/30 bg-[#3B82F6]/10 px-1 py-0 text-[9px] text-[#3B82F6]">
                        📌
                      </Badge>
                    )}
                  </div>
                  <h3 className="line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-[#3B82F6]">
                    {post.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {post.content.slice(0, 150)}...
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    {post.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[9px]">
                        #{tag}
                      </Badge>
                    ))}
                    <div className="ml-auto flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Heart className="size-3" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageSquare className="size-3" />
                        {post.commentCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Eye className="size-3" />
                        {post.views}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-sm">No posts in this category yet</p>
        </div>
      )}
    </div>
  );
}
