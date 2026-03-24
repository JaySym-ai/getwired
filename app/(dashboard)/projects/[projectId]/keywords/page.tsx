"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { KeywordTable } from "@/components/keyword-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export default function KeywordsPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const keywords = useQuery(api.keywords.listByProject, { projectId });
  const addKeyword = useMutation(api.keywords.addKeyword);
  const [newKeyword, setNewKeyword] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    await addKeyword({ projectId, keyword: newKeyword.trim() });
    setNewKeyword("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keywords</h1>
          <p className="text-muted-foreground">
            Manage and analyze your tracked keywords
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 max-w-md">
        <Input
          placeholder="Add a keyword..."
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
        />
        <Button type="submit" disabled={!newKeyword.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </form>

      {keywords === undefined ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      ) : (
        <KeywordTable keywords={keywords} />
      )}
    </div>
  );
}

