"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  MessageSquare,
  ThumbsUp,
  Eye,
  X,
  CheckCheck,
} from "lucide-react";

function getRelevanceBadge(score: number) {
  if (score >= 70) return { label: "High", variant: "default" as const };
  if (score >= 40) return { label: "Medium", variant: "secondary" as const };
  return { label: "Low", variant: "outline" as const };
}

function timeAgo(utcSeconds: number): string {
  const diff = Date.now() / 1000 - utcSeconds;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface RedditPostCardProps {
  post: Doc<"redditPosts">;
  onDraftResponse?: (postId: Doc<"redditPosts">["_id"]) => void;
}

export function RedditPostCard({ post, onDraftResponse }: RedditPostCardProps) {
  const updateStatus = useMutation(api.reddit.updatePostStatus);
  const relevance = getRelevanceBadge(post.relevanceScore);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                r/{post.subreddit}
              </Badge>
              <Badge variant={relevance.variant} className="text-xs">
                {relevance.label} ({post.relevanceScore})
              </Badge>
              <Badge
                variant={
                  post.status === "new"
                    ? "default"
                    : post.status === "responded"
                      ? "default"
                      : "secondary"
                }
                className="text-xs"
              >
                {post.status}
              </Badge>
            </div>
            <CardTitle className="text-sm leading-tight">
              {post.title}
            </CardTitle>
          </div>
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.selfText && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {post.selfText}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" /> {post.score}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> {post.numComments}
          </span>
          <span>{timeAgo(post.createdUtc)}</span>
        </div>
        {post.suggestedResponse && (
          <div className="rounded-md bg-muted p-2 text-xs">
            <p className="font-medium mb-1">Suggested Response:</p>
            <p className="line-clamp-2">{post.suggestedResponse}</p>
          </div>
        )}
        <div className="flex gap-2">
          {onDraftResponse && post.status !== "responded" && (
            <Button
              size="sm"
              variant="default"
              onClick={() => onDraftResponse(post._id)}
            >
              Draft Response
            </Button>
          )}
          {post.status === "new" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus({ postId: post._id, status: "reviewed" })}
            >
              <Eye className="mr-1 h-3 w-3" /> Mark Reviewed
            </Button>
          )}
          {post.status !== "dismissed" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateStatus({ postId: post._id, status: "dismissed" })}
            >
              <X className="mr-1 h-3 w-3" /> Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

