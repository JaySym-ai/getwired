"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Bot, Code2, Layers, Wrench, Database, Cloud, BrainCircuit } from "lucide-react";

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string }> = {
  Languages: { icon: Code2, color: "text-blue-400" },
  Frameworks: { icon: Layers, color: "text-emerald-400" },
  Tools: { icon: Wrench, color: "text-amber-400" },
  Databases: { icon: Database, color: "text-rose-400" },
  Cloud: { icon: Cloud, color: "text-cyan-400" },
  "ML & Data": { icon: BrainCircuit, color: "text-purple-400" },
  Other: { icon: Code2, color: "text-zinc-400" },
};

const TECH_CATEGORIES: Record<string, string[]> = {
  Languages: ["JavaScript", "TypeScript", "Python", "Rust", "Go", "Swift", "Kotlin", "Java", "C++", "Dart"],
  Frameworks: ["React", "Next.js", "Vue.js", "Svelte", "Angular", "React Native", "Flutter", "FastAPI", "Django", "Express"],
  Tools: ["Docker", "Kubernetes", "Git", "Linux", "Vim", "VS Code", "Figma", "Terraform"],
  Databases: ["PostgreSQL", "MongoDB", "Redis", "Prisma", "Drizzle", "Convex", "MySQL", "SQLite"],
  Cloud: ["AWS", "GCP", "Vercel", "Cloudflare", "Azure", "Netlify"],
  "ML & Data": ["TensorFlow", "PyTorch", "Hugging Face", "LangChain", "CUDA", "ONNX", "MLflow"],
  Other: [],
};

function categorizeTech(techStack: string[]): Record<string, string[]> {
  const categorized: Record<string, string[]> = {};
  const assigned = new Set<string>();

  for (const [category, knownItems] of Object.entries(TECH_CATEGORIES)) {
    if (category === "Other") continue;
    const matched = techStack.filter((t) => knownItems.includes(t));
    if (matched.length > 0) {
      categorized[category] = matched;
      matched.forEach((t) => assigned.add(t));
    }
  }

  const remaining = techStack.filter((t) => !assigned.has(t));
  if (remaining.length > 0) {
    categorized["Other"] = remaining;
  }

  return categorized;
}

interface TechStackProps {
  techStack: string[];
  aiTools: string[];
}

export function TechStack({ techStack, aiTools }: TechStackProps) {
  const categorized = categorizeTech(techStack);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-foreground">Tech Stack</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(categorized).map(([category, items]) => {
          const fallback = { icon: Code2, color: "text-zinc-400" };
          const meta = (CATEGORY_META as Record<string, { icon: React.ElementType; color: string } | undefined>)[category] ?? fallback;
          const Icon = meta.icon;
          return (
            <div key={category} className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Icon className={`size-3.5 ${meta.color}`} />
                {category}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {items.map((tech) => (
                  <Link key={tech} href={`/search?q=${encodeURIComponent(tech)}`}>
                    <Badge
                      variant="secondary"
                      className="cursor-pointer border border-transparent hover:bg-[#3B82F6]/10 hover:text-[#3B82F6] hover:border-[#3B82F6]/30 hover:shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all duration-200 gap-1.5"
                    >
                      <span className={`size-1.5 rounded-full ${meta.color.replace("text-", "bg-")} opacity-60`} />
                      {tech}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {aiTools.length > 0 && (
        <>
          <div className="border-t border-white/[0.06]" />
          <div className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Bot className="size-3.5 text-purple-400" />
              AI Tools
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {aiTools.map((tool) => (
                <Link key={tool} href={`/search?q=${encodeURIComponent(tool)}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30 hover:shadow-[0_0_12px_rgba(168,85,247,0.15)] transition-all duration-200 gap-1.5"
                  >
                    <span className="size-1.5 rounded-full bg-purple-400 opacity-60" />
                    {tool}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

