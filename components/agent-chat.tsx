"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AgentMessage } from "@/components/agent-message";
import { AgentInput } from "@/components/agent-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot } from "lucide-react";

export function AgentChat() {
  const projects = useQuery(api.projects.listMyProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runs = useQuery(
    api.agent.listRuns,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );
  const createRun = useMutation(api.agent.createRun);
  const runAgent = useAction(api.agent.runAgent);

  const handleSubmit = async (prompt: string) => {
    if (!selectedProjectId) return;
    setIsRunning(true);
    try {
      const runId = await createRun({ projectId: selectedProjectId, prompt });
      await runAgent({ runId, projectId: selectedProjectId, prompt });
    } catch (e) {
      console.error("Agent run failed:", e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Project selector */}
      <div className="pb-4 border-b">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground">
            Project:
          </label>
          <Select
            value={selectedProjectId ?? ""}
            onValueChange={(v: string | null) => setSelectedProjectId(v ? (v as Id<"projects">) : null)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a project..." />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {!selectedProjectId ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bot className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Select a project to start</p>
            <p className="text-sm">
              Choose a project above to begin chatting with the growth agent
            </p>
          </div>
        ) : runs && runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bot className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Ask me anything</p>
            <p className="text-sm text-center max-w-md">
              I can search Reddit, analyze keywords, discover competitors, check
              trends, and more. Try: &quot;Find Reddit posts about my product&quot;
            </p>
          </div>
        ) : (
          runs?.map((run) => <AgentMessage key={run._id} run={run} />)
        )}
      </div>

      {/* Input */}
      <div className="pt-4 border-t">
        <AgentInput
          onSubmit={handleSubmit}
          isRunning={isRunning}
          disabled={!selectedProjectId}
        />
      </div>
    </div>
  );
}

