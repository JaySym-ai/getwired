"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface AgentInputProps {
  onSubmit: (prompt: string) => Promise<void>;
  isRunning: boolean;
  disabled?: boolean;
}

export function AgentInput({ onSubmit, isRunning, disabled }: AgentInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isRunning || disabled) return;
    const text = prompt.trim();
    setPrompt("");
    await onSubmit(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <Textarea
        placeholder={
          disabled
            ? "Select a project first..."
            : "Ask the agent to analyze your growth..."
        }
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isRunning || disabled}
        className="min-h-[60px] max-h-[200px] resize-none"
        rows={2}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!prompt.trim() || isRunning || disabled}
        className="shrink-0 h-[60px] w-[60px]"
      >
        {isRunning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}

