import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AI Providers",
  description:
    "Configure AI providers for GetWired testing: Claude Code by Anthropic, Auggie by Augment Code, Codex by OpenAI, and OpenCode. Compare features and setup instructions.",
  alternates: { canonical: "https://getwired.dev/docs/providers" },
};

const providers = [
  {
    name: "Claude Code",
    id: "claude-code",
    desc: "Anthropic's Claude Code CLI. Uses Claude as the AI backbone to reason about your app, generate test scenarios, and analyze results. Excellent at understanding complex UIs and writing detailed bug reports.",
  },
  {
    name: "Auggie",
    id: "auggie",
    desc: "Augment Code's Auggie agent. Fast, context-aware testing powered by Auggie's deep codebase understanding. Great for projects already using Augment Code for development.",
  },
  {
    name: "Codex",
    id: "codex",
    desc: "OpenAI's Codex CLI. Leverages OpenAI models for test generation and analysis. Good general-purpose option with broad language model capabilities.",
  },
  {
    name: "OpenCode",
    id: "opencode",
    desc: "Open-source AI coding agent. A community-driven provider for teams that prefer open-source tooling. Works with various model backends.",
  },
];

export default function Providers() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-emerald-400 tracking-wider">
        [PROVIDERS]
      </h1>
      <p className="mt-2 font-mono text-sm text-emerald-500/50">
        AI providers that power GetWired testing.
      </p>
      <p className="mt-4 font-mono text-xs text-emerald-500/40 leading-relaxed">
        GetWired is provider-agnostic. It delegates AI reasoning to whichever coding agent you prefer.
        Set your provider during init or override per test run with <code className="text-emerald-400">--provider</code>.
      </p>

      <div className="mt-10 flex flex-col gap-4">
        {providers.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-emerald-500/15 bg-black/40 p-6"
          >
            <div className="flex items-center gap-3">
              <h3 className="font-mono text-sm font-bold text-emerald-300">{p.name}</h3>
              <code className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                --provider {p.id}
              </code>
            </div>
            <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
              {p.desc}
            </p>
          </div>
        ))}
      </div>

      <div
        className="mt-8 rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-5"
      >
        <p className="font-mono text-xs text-emerald-500/50 leading-relaxed">
          <span className="text-emerald-400 font-bold">Community providers:</span> GetWired&apos;s
          provider system is extensible. Want to add support for another AI agent? Check the{" "}
          <a
            href="https://github.com/JaySym-ai/getwired"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 underline hover:text-emerald-300"
          >
            GitHub repo
          </a>{" "}
          for the provider interface.
        </p>
      </div>

      <div className="mt-12 flex justify-between">
        <Link
          href="/docs/commands"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          &larr; Commands
        </Link>
        <Link
          href="/docs/test-modes"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          Next: Test Modes &rarr;
        </Link>
      </div>
    </div>
  );
}
