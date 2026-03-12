"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Eye, ArrowRight } from "lucide-react";

interface PostItem {
  id?: string;
  title: string;
  category?: string;
  categorySlug?: string;
  likes: number;
  commentCount: number;
  views: number;
  createdAt: number;
}

interface CommentItem {
  id?: string;
  content: string;
  postId?: string;
  postTitle: string;
  likes: number;
  createdAt: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-blue-500",
  "Show & Tell": "bg-emerald-500",
  Help: "bg-amber-500",
  Discussion: "bg-purple-500",
  News: "bg-cyan-500",
  Career: "bg-rose-500",
};

function getCategoryColor(category?: string): string {
  if (!category) return "bg-[#3B82F6]";
  return CATEGORY_COLORS[category] ?? "bg-[#3B82F6]";
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function StatPill({ icon: Icon, value }: { icon: React.ElementType; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-muted-foreground">
      <Icon className="size-3" />
      {value}
    </span>
  );
}

interface ActivityFeedProps {
  posts: PostItem[];
  comments: CommentItem[];
  mode?: "posts" | "comments" | "all";
}

export function ActivityFeed({ posts, comments, mode = "all" }: ActivityFeedProps) {
  const showPosts = mode === "all" || mode === "posts";
  const showComments = mode === "all" || mode === "comments";

  return (
    <div className="space-y-6">
      {showPosts && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Recent Posts
              <span className="text-sm font-normal text-muted-foreground ml-2">({posts.length})</span>
            </h3>
            {mode === "all" && posts.length > 3 && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                View all <ArrowRight className="size-3 ml-1" />
              </Button>
            )}
          </div>

          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No posts yet.</p>
          ) : (
            <div className="space-y-2">
              {(mode === "all" ? posts.slice(0, 3) : posts).map((post, i) => (
                <article
                  key={i}
                  className="group glass rounded-xl overflow-hidden flex transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-px hover:border-border"
                >
                  {/* Left accent bar */}
                  <div className={`w-[3px] shrink-0 ${getCategoryColor(post.category)}`} />
                  <div className="flex-1 p-3 pl-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground text-sm leading-snug group-hover:text-[#3B82F6] transition-colors">
                          {post.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {post.category && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {post.category}
                            </Badge>
                          )}
                          <StatPill icon={ThumbsUp} value={post.likes} />
                          <StatPill icon={MessageSquare} value={post.commentCount} />
                          <StatPill icon={Eye} value={post.views} />
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-0.5">{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {showComments && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Recent Comments
              <span className="text-sm font-normal text-muted-foreground ml-2">({comments.length})</span>
            </h3>
            {mode === "all" && comments.length > 3 && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                View all <ArrowRight className="size-3 ml-1" />
              </Button>
            )}
          </div>

          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No comments yet.</p>
          ) : (
            <div className="space-y-2">
              {(mode === "all" ? comments.slice(0, 3) : comments).map((comment, i) => (
                <article
                  key={i}
                  className="group glass rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-px hover:border-border"
                >
                  <div className="p-3 pl-4 border-l-2 border-[#3B82F6]/40 ml-px">
                    <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed italic">
                      &ldquo;{comment.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="truncate">
                        on <span className="text-foreground/60 font-medium">{comment.postTitle}</span>
                      </span>
                      <span className="ml-auto flex items-center gap-2 shrink-0">
                        <StatPill icon={ThumbsUp} value={comment.likes} />
                        <span className="text-[11px]">{timeAgo(comment.createdAt)}</span>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
