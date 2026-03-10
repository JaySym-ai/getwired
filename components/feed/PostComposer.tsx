"use client";

import { useState } from "react";
import { PenLine, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/Avatar";
import { useDemoAuth } from "@/lib/demo-auth";
import { DEMO_CATEGORIES } from "@/lib/demo-data";
import { toast } from "sonner";

interface PostComposerProps {
  onPost?: (post: {
    title: string;
    content: string;
    category: string;
    tags: string[];
  }) => void;
}

export function PostComposer({ onPost }: PostComposerProps) {
  const { user, isSignedIn } = useDemoAuth();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tagInput, setTagInput] = useState("");

  if (!isSignedIn || !user) return null;

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    const tags = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    onPost?.({
      title: title.trim(),
      content: content.trim(),
      category: category || "off-topic",
      tags,
    });

    toast.success("Post created successfully!");
    setTitle("");
    setContent("");
    setCategory("");
    setTagInput("");
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="glass rounded-xl p-4 w-full flex items-center gap-3 text-left hover:border-[#00FF41]/20 transition-all cursor-pointer"
      >
        <UserAvatar src={user.avatarUrl} name={user.displayName} size="md" />
        <span className="text-sm text-muted-foreground flex-1">
          What&apos;s on your mind, {user.displayName.split(" ")[0]}?
        </span>
        <PenLine className="size-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserAvatar src={user.avatarUrl} name={user.displayName} size="md" />
          <span className="text-sm font-medium">{user.displayName}</span>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={() => setExpanded(false)}>
          <X className="size-4" />
        </Button>
      </div>

      <Input
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-black/30 border-green-500/10"
      />

      <Textarea
        placeholder="What do you want to share?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="bg-black/30 border-green-500/10 resize-none"
      />

      <div className="flex gap-2 flex-wrap">
        <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
          <SelectTrigger className="w-44 bg-black/30 border-green-500/10">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {DEMO_CATEGORIES.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Tags (comma separated)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          className="flex-1 min-w-[160px] bg-black/30 border-green-500/10"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="gap-1.5">
          <Send className="size-3.5" />
          Create Post
        </Button>
      </div>
    </div>
  );
}

