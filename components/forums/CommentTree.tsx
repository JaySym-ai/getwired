"use client";

import { useState, useMemo, useCallback } from "react";
import { Heart, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { CommentComposer } from "./CommentComposer";
import { DEMO_USERS, DEMO_COMMENTS } from "@/lib/demo-data";

type SortOption = "best" | "new" | "old";

interface DemoComment {
  id: string;
  postIndex: number;
  authorIndex: number;
  content: string;
  likes: number;
  createdAt: number;
  parentId?: string;
}

interface CommentNodeProps {
  comment: DemoComment;
  children: DemoComment[];
  allComments: DemoComment[];
  depth: number;
  onLike: (id: string) => void;
  likedComments: Set<string>;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CommentNode({ comment, children, allComments, depth, onLike, likedComments }: CommentNodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [localReplies, setLocalReplies] = useState<DemoComment[]>([]);
  const author = DEMO_USERS[comment.authorIndex];
  if (!author) return null;

  const MAX_DEPTH = 4;
  const allChildren = [...children, ...localReplies];
  const showMore = allChildren.length > 3 && depth >= 2;
  const [showAll, setShowAll] = useState(false);
  const visibleChildren = showMore && !showAll ? allChildren.slice(0, 2) : allChildren;

  const handleReply = (content: string) => {
    const newComment: DemoComment = {
      id: `local-${Date.now()}`,
      postIndex: comment.postIndex,
      authorIndex: 0,
      content,
      likes: 0,
      createdAt: Date.now(),
      parentId: comment.id,
    };
    setLocalReplies((prev) => [...prev, newComment]);
    setShowReply(false);
  };

  return (
    <div className={depth > 0 ? "ml-4 border-l border-[#3B82F6]/20 pl-4" : ""}>
      {!collapsed ? (
        <div className="py-2">
          <div className="flex items-center gap-2 mb-1">
            <UserAvatar src={author.avatar} name={author.name} size="sm" />
            <span className="text-xs font-medium text-white">{author.name}</span>
            <RankBadge rank={author.rank} />
            <span className="text-[10px] text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
            <button onClick={() => setCollapsed(true)} className="ml-auto text-muted-foreground hover:text-white">
              <ChevronUp className="size-3.5" />
            </button>
          </div>
          <p className="text-sm text-foreground/90 mb-2 whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1 text-xs transition-colors ${likedComments.has(comment.id) ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}
            >
              <Heart className={`size-3 ${likedComments.has(comment.id) ? "fill-current" : ""}`} />
              {comment.likes + (likedComments.has(comment.id) ? 1 : 0)}
            </button>
            {depth < MAX_DEPTH && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#3B82F6] transition-colors"
              >
                <MessageSquare className="size-3" />
                Reply
              </button>
            )}
          </div>
          {showReply && (
            <div className="mt-3">
              <CommentComposer compact onSubmit={handleReply} onCancel={() => setShowReply(false)} />
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => setCollapsed(false)} className="flex items-center gap-2 py-2 text-xs text-muted-foreground hover:text-white">
          <ChevronDown className="size-3.5" />
          <UserAvatar src={author.avatar} name={author.name} size="sm" />
          <span>{author.name}</span>
          <span>· {allChildren.length} {allChildren.length === 1 ? "reply" : "replies"}</span>
        </button>
      )}
      {!collapsed && visibleChildren.length > 0 && (
        <div>
          {visibleChildren.map((child) => {
            const grandChildren = allComments.filter((c) => c.parentId === child.id);
            return (
              <CommentNode
                key={child.id}
                comment={child}
                children={grandChildren}
                allComments={allComments}
                depth={depth + 1}
                onLike={onLike}
                likedComments={likedComments}
              />
            );
          })}
          {showMore && !showAll && (
            <button onClick={() => setShowAll(true)} className="text-xs text-[#3B82F6] hover:underline ml-4 py-1">
              Show {allChildren.length - 2} more {allChildren.length - 2 === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface CommentTreeProps {
  postIndex: number;
}

export function CommentTree({ postIndex }: CommentTreeProps) {
  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [topLevelReplies, setTopLevelReplies] = useState<DemoComment[]>([]);

  const comments: DemoComment[] = useMemo(() => {
    const postComments = DEMO_COMMENTS
      .map((c, i) => ({
        id: `comment-${i}`,
        postIndex: c.postIndex,
        authorIndex: c.authorIndex,
        content: c.content,
        likes: c.likes,
        createdAt: c.createdAt,
        parentId: c.isReply && c.parentIndex !== undefined ? `comment-${c.parentIndex}` : undefined,
      }))
      .filter((c) => c.postIndex === postIndex);
    return postComments;
  }, [postIndex]);

  const allComments = useMemo(() => [...comments, ...topLevelReplies], [comments, topLevelReplies]);

  const rootComments = useMemo(() => {
    const roots = allComments.filter((c) => !c.parentId);
    switch (sortBy) {
      case "best":
        return [...roots].sort((a, b) => b.likes - a.likes);
      case "new":
        return [...roots].sort((a, b) => b.createdAt - a.createdAt);
      case "old":
        return [...roots].sort((a, b) => a.createdAt - b.createdAt);
      default:
        return roots;
    }
  }, [allComments, sortBy]);

  const handleLike = useCallback((id: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleNewComment = (content: string) => {
    const newComment: DemoComment = {
      id: `local-${Date.now()}`,
      postIndex,
      authorIndex: 0,
      content,
      likes: 0,
      createdAt: Date.now(),
    };
    setTopLevelReplies((prev) => [...prev, newComment]);
  };

  const totalCount = allComments.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {totalCount} {totalCount === 1 ? "Comment" : "Comments"}
        </h3>
        <div className="flex items-center gap-1">
          {(["best", "new", "old"] as const).map((option) => (
            <Button
              key={option}
              variant={sortBy === option ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setSortBy(option)}
              className="capitalize text-xs"
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <CommentComposer placeholder="Write a comment..." onSubmit={handleNewComment} />

      <div className="space-y-1">
        {rootComments.map((comment) => {
          const children = allComments.filter((c) => c.parentId === comment.id);
          return (
            <CommentNode
              key={comment.id}
              comment={comment}
              children={children}
              allComments={allComments}
              depth={0}
              onLike={handleLike}
              likedComments={likedComments}
            />
          );
        })}
      </div>
    </div>
  );
}

