import { AgentChat } from "@/components/agent-chat";

export default function AgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Growth Agent</h1>
        <p className="text-muted-foreground">
          AI-powered assistant for growth intelligence
        </p>
      </div>
      <AgentChat />
    </div>
  );
}

