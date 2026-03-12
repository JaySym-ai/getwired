"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Heart, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { CommentComposer } from "./CommentComposer";
import { useAppAuth } from "@/lib/auth";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

type SortOption = "best" | "new" | "old";

function formatTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function sortComments(comments: Array<any>, sortBy: SortOption) {
  const next = [...comments];
  switch (sortBy) {
    case "best":
      return next.sort((left, right) => right.likes - left.likes);
    case "new":
      return next.sort((left, right) => right.createdAt - left.createdAt);
    case "old":
      return next.sort((left, right) => left.createdAt - right.createdAt);
    default:
      return next;
  }
}

function CommentNode({
  comment,
  commentsByParent,
  depth,
  likedComments,
  onLike,
  onReply,
}: {
  comment: any;
  commentsByParent: Map<string, Array<any>>;
  depth: number;
  likedComments: Set<string>;
  onLike: (id: string) => void;
  onReply: (parentId: string, content: string) => Promise<void>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const children = commentsByParent.get(comment._id) ?? [];
  const MAX_DEPTH = 4;

  return (
    <div className={depth > 0 ? "ml-4 border-l border-[#3B82F6]/20 pl-4" : ""}>
      {!collapsed ? (
        <div className="py-2">
          <div className="mb-1 flex items-center gap-2">
            <UserAvatar src={comment.author.avatar} name={comment.author.name} size="sm" />
            <span className="text-xs font-medium text-foreground">{comment.author.name}</span>
            <RankBadge rank={comment.author.rank} />
            <span className="text-[10px] text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
            <button
              onClick={() => setCollapsed(true)}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <ChevronUp className="size-3.5" />
            </button>
          </div>
          <p className="mb-2 whitespace-pre-wrap text-sm text-foreground/90">{comment.content}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLike(comment._id)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                likedComments.has(comment._id)
                  ? "text-red-400"
                  : "text-muted-foreground hover:text-red-400"
              }`}
            >
              <Heart className={`size-3 ${likedComments.has(comment._id) ? "fill-current" : ""}`} />
              {comment.likes + (likedComments.has(comment._id) ? 1 : 0)}
            </button>
            {depth < MAX_DEPTH && (
              <button
                onClick={() => setShowReply((current) => !current)}
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-[#3B82F6]"
              >
                <MessageSquare className="size-3" />
                Reply
              </button>
            )}
          </div>
          {showReply && (
            <div className="mt-3">
              <CommentComposer
                compact
                onSubmit={(content) => void onReply(comment._id, content).then(() => setShowReply(false))}
                onCancel={() => setShowReply(false)}
              />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="size-3.5" />
          <UserAvatar src={comment.author.avatar} name={comment.author.name} size="sm" />
          <span>{comment.author.name}</span>
          <span>
            · {children.length} {children.length === 1 ? "reply" : "replies"}
          </span>
        </button>
      )}
      {!collapsed &&
        children.map((child) => (
          <CommentNode
            key={child._id}
            comment={child}
            commentsByParent={commentsByParent}
            depth={depth + 1}
            likedComments={likedComments}
            onLike={onLike}
            onReply={onReply}
          />
        ))}
    </div>
  );
}

export function CommentTree({ postId }: { postId: string }) {
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const comments = useQuery(api.comments.getByPost, { postId: postId as never }) ?? [];
  const createComment = useMutation(api.comments.create);

  const commentsByParent = useMemo(() => {
    const map = new Map<string, Array<any>>();
    for (const comment of comments) {
      if (!comment.parentId) {
        continue;
      }

      const current = map.get(comment.parentId) ?? [];
      current.push(comment);
      map.set(comment.parentId, sortComments(current, sortBy));
    }
    return map;
  }, [comments, sortBy]);

  const rootComments = useMemo(
    () => sortComments(comments.filter((comment) => !comment.parentId), sortBy),
    [comments, sortBy],
  );

  const { isSignedIn, signIn } = useAppAuth();

  const handleReply = useCallback(
    async (parentId: string | undefined, content: string) => {
      if (!isSignedIn) {
        toast.error("Sign in required", {
          description: "You need to sign in to comment.",
          action: { label: "Sign In", onClick: signIn },
        });
        return;
      }
      await createComment({
        postId: postId as never,
        parentId: parentId ? (parentId as never) : undefined,
        content,
      });
    },
    [isSignedIn, signIn, createComment, postId],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
        </h3>
        <div className="flex items-center gap-1">
          {(["best", "new", "old"] as const).map((option) => (
            <Button
              key={option}
              variant={sortBy === option ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setSortBy(option)}
              className="text-xs capitalize"
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <CommentComposer placeholder="Write a comment..." onSubmit={(content) => void handleReply(undefined, content)} />

      <div className="space-y-1">
        {rootComments.map((comment) => (
          <CommentNode
            key={comment._id}
            comment={comment}
            commentsByParent={commentsByParent}
            depth={0}
            likedComments={likedComments}
            onLike={(id) => {
              setLikedComments((current) => {
                const next = new Set(current);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
            onReply={handleReply}
          />
        ))}
      </div>
    </div>
  );
}
