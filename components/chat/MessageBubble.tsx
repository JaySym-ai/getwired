"use client";

import { UserAvatar } from "@/components/shared/Avatar";
import { RankBadge } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SmilePlus, MessageSquare, MoreHorizontal } from "lucide-react";
import type { DemoUser } from "@/lib/demo-auth";

const QUICK_EMOJIS = ["👍", "❤️", "🔥", "🚀", "😂", "🎉", "💯", "👀", "🧠", "⚡"];

export interface ChatReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface ChatMessageData {
  id: string;
  author: DemoUser;
  content: string;
  reactions: ChatReaction[];
  threadCount: number;
  createdAt: number;
  isOwn: boolean;
}

interface MessageBubbleProps {
  message: ChatMessageData;
  onReact: (messageId: string, emoji: string) => void;
  onOpenThread: (messageId: string) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, onReact, onOpenThread }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-1.5 hover:bg-white/[0.02] transition-colors",
        message.isOwn && "bg-white/[0.01]"
      )}
    >
      <UserAvatar
        src={message.author.avatarUrl}
        name={message.author.displayName}
        size="md"
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-semibold", message.isOwn ? "text-[#00FF41]" : "text-foreground")}>
            {message.author.displayName}
          </span>
          <RankBadge rank={message.author.rank} />
          <span className="text-[10px] text-muted-foreground">{formatTime(message.createdAt)}</span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{message.content}</p>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(message.id, r.emoji)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition-colors",
                  r.reacted
                    ? "border-[#00FF41]/40 bg-[#00FF41]/10 text-[#00FF41]"
                    : "border-border bg-secondary/50 text-muted-foreground hover:border-[#00FF41]/30"
                )}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread indicator */}
        {message.threadCount > 0 && (
          <button
            onClick={() => onOpenThread(message.id)}
            className="mt-1 flex items-center gap-1 text-xs text-[#00FF41]/80 hover:text-[#00FF41] transition-colors"
          >
            <MessageSquare className="size-3" />
            <span>{message.threadCount} {message.threadCount === 1 ? "reply" : "replies"}</span>
          </button>
        )}
      </div>

      {/* Hover actions */}
      <div className="flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Popover>
          <PopoverTrigger className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
            <SmilePlus className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="end">
            <div className="grid grid-cols-5 gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className="size-8 flex items-center justify-center rounded hover:bg-secondary text-base transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => onOpenThread(message.id)}>
          <MessageSquare className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7">
          <MoreHorizontal className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

