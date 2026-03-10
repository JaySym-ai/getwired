"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { SendHorizontal, Smile } from "lucide-react";
import { DEMO_USERS } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";

const EMOJI_GRID = [
  "😀", "😂", "🤣", "😍", "🤩", "😎", "🤔", "🙄",
  "👍", "👎", "👋", "🙌", "🔥", "❤️", "💯", "🚀",
  "🎉", "✅", "⚡", "🧠", "💪", "👀", "🤖", "🦀",
];

interface MessageInputProps {
  onSend: (content: string) => void;
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [value, setValue] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setValue(text);

    // Check for @mention
    const lastAt = text.lastIndexOf("@");
    if (lastAt !== -1 && (lastAt === 0 || text[lastAt - 1] === " ")) {
      const query = text.slice(lastAt + 1);
      if (!query.includes(" ")) {
        setShowMentions(true);
        setMentionFilter(query.toLowerCase());
        return;
      }
    }
    setShowMentions(false);
  }, []);

  const handleMention = useCallback((username: string) => {
    const lastAt = value.lastIndexOf("@");
    const newValue = value.slice(0, lastAt) + `@${username} `;
    setValue(newValue);
    setShowMentions(false);
    inputRef.current?.focus();
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    setShowMentions(false);
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape") {
        setShowMentions(false);
      }
    },
    [handleSend]
  );

  const filteredUsers = DEMO_USERS.filter((u) =>
    u.username.toLowerCase().includes(mentionFilter) ||
    u.displayName.toLowerCase().includes(mentionFilter)
  );

  return (
    <div className="relative border-t border-border bg-background/80 px-4 py-3">
      {/* Mention autocomplete */}
      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => handleMention(user.username)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
            >
              <span className="font-medium text-foreground">@{user.username}</span>
              <span className="text-muted-foreground">{user.displayName}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger className="inline-flex items-center justify-center size-8 shrink-0 rounded-md text-muted-foreground hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
            <Smile className="size-4" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start" side="top">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_GRID.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setValue((v) => v + emoji);
                    inputRef.current?.focus();
                  }}
                  className="size-8 flex items-center justify-center rounded hover:bg-secondary text-base transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className={cn(
            "flex-1 border-border/50 bg-secondary/30 focus-visible:ring-[#00FF41]/30",
            "placeholder:text-muted-foreground/60"
          )}
        />

        <Button
          onClick={handleSend}
          disabled={!value.trim()}
          size="icon"
          className="size-8 shrink-0 bg-[#00FF41] text-black hover:bg-[#00CC33] disabled:opacity-30"
        >
          <SendHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  );
}

