"use client";

import { useState } from "react";
import { LogIn, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/shared/Avatar";
import { useAppAuth } from "@/lib/auth";

interface CommentComposerProps {
  placeholder?: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  compact?: boolean;
}

export function CommentComposer({
  placeholder = "Write a reply...",
  onSubmit,
  onCancel,
  compact = false,
}: CommentComposerProps) {
  const { user, signIn } = useAppAuth();
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setContent("");
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
        <LogIn className="size-4 shrink-0 text-muted-foreground" />
        <p className="flex-1 text-sm text-muted-foreground">
          <button onClick={signIn} className="font-medium text-[#3B82F6] hover:underline cursor-pointer">
            Sign in
          </button>{" "}
          to join the conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {!compact && (
        <UserAvatar
          src={user.avatarUrl}
          name={user.displayName}
          size="sm"
        />
      )}
      <div className="flex-1 space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="min-h-[60px] resize-none bg-muted/50 text-sm"
          rows={compact ? 2 : 3}
        />
        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="gap-1.5"
          >
            <Send className="size-3" />
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
}
