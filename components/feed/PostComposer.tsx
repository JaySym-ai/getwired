"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { LogIn, PenLine, X, Send } from "lucide-react";
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
import { useAppAuth } from "@/lib/auth";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

export function PostComposer() {
  const { user, isSignedIn, signIn } = useAppAuth();
  const categories = useQuery(api.forums.listCategories, {}) ?? [];
  const createPost = useMutation(api.posts.create);
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");

  if (!isSignedIn || !user) {
    return (
      <div className="glass flex items-center gap-3 rounded-xl px-4 py-4">
        <LogIn className="size-4 shrink-0 text-muted-foreground" />
        <p className="flex-1 text-sm text-muted-foreground">
          <button onClick={signIn} className="font-medium text-[#3B82F6] hover:underline cursor-pointer">
            Sign in
          </button>{" "}
          to create a post.
        </p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    setSubmitting(true);
    try {
      await createPost({
        title: title.trim(),
        content: content.trim(),
        category: category || "off-topic",
        tags,
      });

      toast.success("Post created successfully");
      setTitle("");
      setContent("");
      setCategory("");
      setTagInput("");
      setExpanded(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="glass w-full cursor-pointer rounded-xl p-4 text-left transition-all hover:border-[#3B82F6]/20"
      >
        <div className="flex items-center gap-3">
          <UserAvatar src={user.avatarUrl} name={user.displayName} size="md" />
          <span className="flex-1 text-sm text-muted-foreground">
            What&apos;s on your mind, {user.displayName.split(" ")[0]}?
          </span>
          <PenLine className="size-4 text-muted-foreground" />
        </div>
      </button>
    );
  }

  return (
    <div className="glass space-y-3 rounded-xl p-4">
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
        onChange={(event) => setTitle(event.target.value)}
        className="border-border bg-muted/50"
      />

      <Textarea
        placeholder="What do you want to share?"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        className="resize-none border-border bg-muted/50"
      />

      <div className="flex flex-wrap gap-2">
        <Select value={category} onValueChange={(value) => setCategory(value ?? "")}>
          <SelectTrigger className="w-44 border-border bg-muted/50">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((item) => (
              <SelectItem key={item.slug} value={item.slug}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Tags (comma separated)"
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          className="min-w-[160px] flex-1 border-border bg-muted/50"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => void handleSubmit()} disabled={submitting} className="gap-1.5">
          <Send className="size-3.5" />
          {submitting ? "Creating..." : "Create Post"}
        </Button>
      </div>
    </div>
  );
}
