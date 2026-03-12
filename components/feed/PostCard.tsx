"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { Heart, MessageCircle, Eye, Bookmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { TagList } from "@/components/shared/TagList";
import { Poll } from "@/components/shared/Poll";

interface PostCardProps {
  post: any;
  liked: boolean;
  bookmarked: boolean;
  likeCount: number;
  onLike: () => void;
  onBookmark: () => void;
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function PostCard({ post, liked, bookmarked, likeCount, onLike, onBookmark }: PostCardProps) {
  const contentPreview = post.content.length > 200 ? `${post.content.slice(0, 200)}...` : post.content;
  const postUrl = `/forums/${post.category ?? "off-topic"}/${post._id}`;

  return (
    <article className="glass group rounded-xl p-4 transition-all duration-200 hover:border-[#3B82F6]/20 hover:glow-green-sm">
      {post.isBoosted && (
        <div className="mb-2 flex items-center gap-1.5 text-[10px] text-amber-400/70">
          <Sparkles className="size-3" />
          <span>Promoted</span>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2.5">
        <UserAvatar src={post.author.avatar} name={post.author.name} size="md" />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{post.author.name}</span>
          <RankBadge rank={post.author.rank} />
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>
      </div>

      <Link href={postUrl} className="mb-2 block transition-colors group-hover:text-[#3B82F6]">
        <h3 className="text-base font-semibold leading-snug">{post.title}</h3>
      </Link>

      <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {contentPreview}
      </p>

      {post.poll && (
        <div className="mb-3">
          <Poll pollId={post.poll._id} question={post.poll.question} options={post.poll.options} />
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {post.categoryInfo && (
          <Badge
            variant="outline"
            className="border-transparent text-[10px]"
            style={{
              backgroundColor: `${post.categoryInfo.color}20`,
              color: post.categoryInfo.color,
            }}
          >
            {post.categoryInfo.name}
          </Badge>
        )}
        <TagList tags={post.tags.slice(0, 3)} size="sm" />
      </div>

      <div className="-ml-1 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onLike}
          className={liked ? "text-red-400" : "text-muted-foreground hover:text-red-400"}
        >
          <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} />
        </Button>
        <span className="mr-2 text-xs text-muted-foreground">{likeCount}</span>

        <Link
          href={postUrl}
          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MessageCircle className="size-3.5" />
        </Link>
        <span className="mr-2 text-xs text-muted-foreground">{post.commentCount}</span>

        <Eye className="size-3.5 text-muted-foreground" />
        <span className="mr-2 text-xs text-muted-foreground">{post.views.toLocaleString()}</span>

        <div className="ml-auto flex items-center gap-0.5">
          <ShareButtons url={postUrl} title={post.title} />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onBookmark}
            className={bookmarked ? "text-[#3B82F6]" : "text-muted-foreground hover:text-[#3B82F6]"}
          >
            <Bookmark className={`size-3.5 ${bookmarked ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>
    </article>
  );
}
