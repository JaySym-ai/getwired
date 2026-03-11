"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Bot } from "lucide-react";

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
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">Tech Stack</h2>

      <div className="space-y-4">
        {Object.entries(categorized).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {items.map((tech) => (
                <Link key={tech} href={`/search?q=${encodeURIComponent(tech)}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-[#3B82F6]/10 hover:text-[#3B82F6] hover:border-[#3B82F6]/30 transition-colors border border-transparent"
                  >
                    {tech}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {aiTools.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bot className="size-3.5" />
            AI Tools
          </h3>
          <div className="flex flex-wrap gap-2">
            {aiTools.map((tool) => (
              <Link key={tool} href={`/search?q=${encodeURIComponent(tool)}`}>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30 transition-colors"
                >
                  {tool}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

