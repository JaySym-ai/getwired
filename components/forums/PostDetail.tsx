"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Heart, Bookmark, Share2, Eye, MessageSquare, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { api } from "../../convex/_generated/api";

function formatTimeAgo(ts: number) {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PostDetail({ postId }: { postId: string }) {
  const post = useQuery(api.posts.getDetailedById, { postId: postId as never });
  const relatedSource = useQuery(
    api.posts.listDetailed,
    post?.category ? { category: post.category, limit: 4 } : "skip",
  ) ?? [];
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const relatedPosts = useMemo(
    () => relatedSource.filter((candidate) => candidate._id !== postId).slice(0, 3),
    [postId, relatedSource],
  );

  if (post === undefined) {
    return null;
  }

  if (!post) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {post.categoryInfo && (
            <Link href={`/forums/${post.categoryInfo.slug}`}>
              <Badge
                variant="secondary"
                className="text-[10px]"
                style={{
                  color: post.categoryInfo.color,
                  borderColor: `${post.categoryInfo.color}30`,
                }}
              >
                {post.categoryInfo.name}
              </Badge>
            </Link>
          )}
          {post.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              #{tag}
            </Badge>
          ))}
          {post.isPinned && (
            <Badge className="border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[10px] text-[#3B82F6]">
              📌 Pinned
            </Badge>
          )}
        </div>

        <h1 className="mb-4 text-xl font-bold text-foreground">{post.title}</h1>

        <div className="mb-6 flex items-center gap-3">
          <UserAvatar src={post.author.avatar} name={post.author.name} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author.username}`}
                className="text-sm font-medium text-foreground transition-colors hover:text-[#3B82F6]"
              >
                {post.author.name}
              </Link>
              <RankBadge rank={post.author.rank} />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{formatTimeAgo(post.createdAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Eye className="size-3" /> {post.views.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm text-foreground/90">
          {post.content}
        </div>

        <Separator className="my-6" />

        <div className="flex items-center gap-2">
          <Button
            variant={liked ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setLiked((current) => !current)}
            className={`gap-1.5 ${liked ? "text-red-400" : ""}`}
          >
            <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} />
            {post.likes + (liked ? 1 : 0)}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <MessageSquare className="size-3.5" />
            {post.commentCount}
          </Button>
          <Button
            variant={bookmarked ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setBookmarked((current) => !current)}
            className={`gap-1.5 ${bookmarked ? "text-[#3B82F6]" : ""}`}
          >
            <Bookmark className={`size-3.5 ${bookmarked ? "fill-current" : ""}`} />
            Save
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Share2 className="size-3.5" />
            Share
          </Button>
        </div>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="mb-3 flex items-center gap-3">
          <UserAvatar src={post.author.avatar} name={post.author.name} size="lg" />
          <div>
            <Link
              href={`/profile/${post.author.username}`}
              className="text-sm font-semibold text-foreground transition-colors hover:text-[#3B82F6]"
            >
              {post.author.name}
            </Link>
            <div className="mt-0.5 flex items-center gap-1.5">
              <RankBadge rank={post.author.rank} />
              <span className="text-[10px] text-muted-foreground">
                {post.author.karma.toLocaleString()} karma
              </span>
            </div>
          </div>
        </div>
        {post.author.bio && (
          <p className="mb-3 line-clamp-3 text-xs text-muted-foreground">{post.author.bio}</p>
        )}
        <div className="mb-3 flex items-center gap-4 text-[10px] text-muted-foreground">
          {post.author.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" /> {post.author.location}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="size-3" /> Joined {formatDate(post.author.createdAt)}
          </span>
        </div>
        <Link href={`/profile/${post.author.username}`}>
          <Button variant="outline" size="sm" className="w-full">
            View Profile
          </Button>
        </Link>
      </div>

      {relatedPosts.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Related Posts</h3>
          <div className="space-y-3">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost._id}
                href={`/forums/${relatedPost.category ?? "off-topic"}/${relatedPost._id}`}
                className="group block"
              >
                <div className="rounded-lg p-3 transition-colors hover:bg-accent">
                  <h4 className="line-clamp-2 text-xs font-medium text-foreground transition-colors group-hover:text-[#3B82F6]">
                    {relatedPost.title}
                  </h4>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{relatedPost.author.name}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="size-2.5" /> {relatedPost.likes}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="size-2.5" /> {relatedPost.commentCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
