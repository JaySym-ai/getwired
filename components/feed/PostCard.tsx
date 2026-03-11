"use client";

import Link from "next/link";
import { Heart, MessageCircle, Eye, Bookmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { TagList } from "@/components/shared/TagList";
import { Poll } from "@/components/shared/Poll";
import { DEMO_USERS, DEMO_CATEGORIES, DEMO_POLLS } from "@/lib/demo-data";
import type { UserRank } from "@/lib/types";

interface DemoPost {
  title: string;
  content: string;
  category: string;
  tags: string[];
  type: "post" | "poll";
  likes: number;
  commentCount: number;
  views: number;
  isBoosted: boolean;
  isPinned: boolean;
  createdAt: number;
  authorIndex: number;
}

interface PostCardProps {
  post: DemoPost;
  postIndex: number;
  liked: boolean;
  bookmarked: boolean;
  likeCount: number;
  onLike: () => void;
  onBookmark: () => void;
}

function formatRelativeTime(timestamp: number): string {
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

export function PostCard({ post, postIndex, liked, bookmarked, likeCount, onLike, onBookmark }: PostCardProps) {
  const author = DEMO_USERS[post.authorIndex];
  if (!author) return null;

  const category = DEMO_CATEGORIES.find((c) => c.slug === post.category);
  const contentPreview = post.content.length > 200 ? post.content.slice(0, 200) + "..." : post.content;
  const postUrl = `/forums/${post.category}/post-${postIndex}`;

  const poll = post.type === "poll"
    ? DEMO_POLLS.find((p) => p.postIndex === postIndex)
    : null;

  return (
    <article className="glass rounded-xl p-4 transition-all duration-200 hover:border-[#3B82F6]/20 hover:glow-green-sm group">
      {/* Boosted indicator */}
      {post.isBoosted && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400/70 mb-2">
          <Sparkles className="size-3" />
          <span>Promoted</span>
        </div>
      )}

      {/* Author row */}
      <div className="flex items-center gap-2.5 mb-3">
        <UserAvatar src={author.avatar} name={author.name} size="md" />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground truncate">{author.name}</span>
          <RankBadge rank={author.rank as UserRank} />
          <span className="text-xs text-muted-foreground ml-auto shrink-0">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>
      </div>

      {/* Title */}
      <Link href={postUrl} className="block mb-2 group-hover:text-[#3B82F6] transition-colors">
        <h3 className="text-base font-semibold leading-snug">{post.title}</h3>
      </Link>

      {/* Content preview */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3">
        {contentPreview}
      </p>

      {/* Poll */}
      {poll && (
        <div className="mb-3">
          <Poll
            pollId={`poll-${postIndex}`}
            question={poll.question}
            options={poll.options}
          />
        </div>
      )}

      {/* Category + Tags */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {category && (
          <Badge
            variant="outline"
            className="text-[10px] border-transparent"
            style={{ backgroundColor: `${category.color}20`, color: category.color }}
          >
            {category.name}
          </Badge>
        )}
        <TagList tags={post.tags.slice(0, 3)} size="sm" />
      </div>

      {/* Bottom bar */}
      <div className="flex items-center gap-1 -ml-1">
        <Button variant="ghost" size="icon-xs" onClick={onLike} className={liked ? "text-red-400" : "text-muted-foreground hover:text-red-400"}>
          <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} />
        </Button>
        <span className="text-xs text-muted-foreground mr-2">{likeCount}</span>

        <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-foreground" render={<Link href={postUrl} />}>
          <MessageCircle className="size-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground mr-2">{post.commentCount}</span>

        <Eye className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mr-2">{post.views.toLocaleString()}</span>

        <div className="ml-auto flex items-center gap-0.5">
          <ShareButtons url={postUrl} title={post.title} />
          <Button variant="ghost" size="icon-xs" onClick={onBookmark} className={bookmarked ? "text-[#3B82F6]" : "text-muted-foreground hover:text-[#3B82F6]"}>
            <Bookmark className={`size-3.5 ${bookmarked ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>
    </article>
  );
}

