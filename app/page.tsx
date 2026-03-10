import { Sidebar } from "@/components/layout/Sidebar";
import { Zap, MessageSquare, Newspaper, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <Sidebar />
      <main className="flex-1 min-w-0">
        {/* Hero Section */}
        <div className="glass rounded-2xl p-8 mb-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="size-8 text-[#00FF41]" />
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome to{" "}
                <span className="text-white">GetWired</span>
                <span className="text-[#00FF41] text-glow">.dev</span>
              </h1>
            </div>
            <p className="max-w-lg text-muted-foreground">
              The underground tech community for developers who push boundaries.
              Forums, real-time chat, tech news, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <StatCard icon={MessageSquare} label="Forum Threads" value="2.4k" />
              <StatCard icon={Users} label="Members" value="12.8k" />
              <StatCard icon={Newspaper} label="News Articles" value="890" />
            </div>
          </div>
        </div>

        {/* Placeholder feed */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-8 rounded-full bg-muted animate-pulse" />
                <div className="flex flex-col gap-1">
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-2 w-16 rounded bg-muted animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-3 w-full rounded bg-muted animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-black/30 px-4 py-2">
      <Icon className="size-4 text-[#00FF41]" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white">{value}</span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
