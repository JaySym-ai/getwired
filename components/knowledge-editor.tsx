"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type Category = "product" | "faq" | "messaging" | "competitor_diff";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "product", label: "Product Info" },
  { value: "faq", label: "FAQ" },
  { value: "messaging", label: "Messaging Guidelines" },
  { value: "competitor_diff", label: "Competitor Differentiators" },
];

interface KnowledgeEditorProps {
  projectId: Id<"projects">;
  entry?: Doc<"knowledgeBase">;
  onComplete?: () => void;
}

export function KnowledgeEditor({ projectId, entry, onComplete }: KnowledgeEditorProps) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [category, setCategory] = useState<Category>(entry?.category ?? "product");
  const [isSaving, setIsSaving] = useState(false);

  const create = useMutation(api.knowledgeBase.create);
  const update = useMutation(api.knowledgeBase.update);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsSaving(true);
    try {
      if (entry) {
        await update({ entryId: entry._id, title, content, category });
      } else {
        await create({ projectId, title, content, category });
      }
      if (!entry) {
        setTitle("");
        setContent("");
        setCategory("product");
      }
      onComplete?.();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {entry ? "Edit Entry" : "Add Knowledge"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Product Overview"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={(v: string | null) => { if (v) setCategory(v as Category); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your product, key features, differentiators..."
              rows={6}
              required
            />
          </div>
          <Button type="submit" disabled={isSaving || !title.trim() || !content.trim()}>
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : entry ? "Update" : "Add Entry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

