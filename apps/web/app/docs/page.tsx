import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation — GetWired AI Testing CLI",
  description:
    "Complete documentation for GetWired: installation, CLI commands, AI provider setup (Claude Code, Auggie, Codex, OpenCode), test modes, reports, and configuration.",
  alternates: { canonical: "https://getwired.dev/docs" },
};

const CARDS = [
  { href: "/docs/getting-started", title: "GETTING-STARTED", desc: "Install, launch, and first run" },
  { href: "/docs/commands", title: "COMMANDS", desc: "All CLI commands with examples" },
  { href: "/docs/providers", title: "PROVIDERS", desc: "Claude Code, Auggie, Codex, OpenCode" },
  { href: "/docs/test-modes", title: "TEST-MODES", desc: "Test, regression, baseline, and scoped runs" },
  { href: "/docs/reports", title: "REPORTS", desc: "Where outputs are saved and how to read them" },
  { href: "/docs/configuration", title: "CONFIGURATION", desc: "Settings, notes, and project config" },
  { href: "/docs/faq", title: "FAQ", desc: "Common questions" },
];

export default function DocsIndex() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-emerald-400 tracking-wider">
        GetWired Documentation
      </h1>
      <p className="mt-3 font-mono text-sm text-emerald-500/50">
        Welcome to the docs. Use the sidebar to navigate, or pick a section below.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-lg border border-emerald-500/15 bg-black/40 p-5 transition hover:border-emerald-500/40 hover:bg-emerald-950/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
          >
            <span className="font-mono text-sm font-bold text-emerald-400 group-hover:text-emerald-300">
              [{card.title}]
            </span>
            <span className="mt-2 block font-mono text-xs text-emerald-500/50">
              {card.desc}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
