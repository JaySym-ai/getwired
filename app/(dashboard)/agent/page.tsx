import { AgentChat } from "@/components/agent-chat";

export default function AgentPage() {
  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Growth Agent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered assistant for growth intelligence
        </p>
      </div>
      <AgentChat />
    </div>
  );
}

