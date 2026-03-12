"use client";

import { useState } from "react";
import { Send } from "lucide-react";
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
  const { user } = useAppAuth();
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setContent("");
  };

  if (!user) return null;

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
