import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CLI Commands",
  description:
    "Complete reference for all GetWired CLI commands: init, test, baseline, regression, report, and their flags and usage examples.",
  alternates: { canonical: "https://getwired.dev/docs/commands" },
};

const commands = [
  {
    name: "getwired init",
    desc: "Initialize GetWired in your project root. It scans the current project folder, detects your framework and local dev server, and creates the .getwired/ config directory.",
    flags: [
      { flag: "--provider <provider>", desc: "AI provider to use (claude-code, auggie, codex)" },
    ],
    example: "$ getwired init --provider auggie",
  },
  {
    name: "getwired test",
    desc: "Run AI-driven testing against your local dev server. GetWired only targets localhost or loopback URLs from the current project folder, not remote `.com` or other online sites.",
    flags: [
      { flag: "-u, --url <url>", desc: "Optional local URL to test (must be localhost or loopback)" },
      { flag: "-c, --commit <id>", desc: "Test against a specific commit for regression" },
      { flag: "-p, --pr <id>", desc: "Test against a specific pull request" },
      { flag: "--scope <scope>", desc: "Scope of testing (e.g. auth, checkout, navigation)" },
      { flag: "-d, --device <profile>", desc: "Device profile: desktop, mobile, or both (default: both)" },
      { flag: "--provider <provider>", desc: "Override AI provider for this run" },
    ],
    example: "$ getwired test --url http://localhost:3000 --scope auth --device mobile",
  },
  {
    name: "getwired report",
    desc: "View past test reports. Shows findings, screenshots, and regression data.",
    flags: [
      { flag: "-i, --id <id>", desc: "View a specific report by ID" },
    ],
    example: "$ getwired report --id latest",
  },
  {
    name: "getwired mcp",
    desc: "Start an MCP server for AI coding agent integration. Lets Claude Code, Codex, Cursor, Windsurf, and other MCP-compatible agents run tests, read reports, and manage configuration directly.",
    flags: [],
    example: "$ getwired mcp",
  },
  {
    name: "getwired dashboard",
    desc: "Open the interactive TUI dashboard. This is the default command when running getwired with no arguments. Gives you access to test runs, reports, notes, and settings.",
    flags: [],
    example: "$ getwired",
  },
];

export default function Commands() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-emerald-400 tracking-wider">
        [COMMANDS]
      </h1>
      <p className="mt-2 font-mono text-sm text-emerald-500/50">
        All CLI commands with examples.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        {commands.map((cmd) => (
          <div
            key={cmd.name}
            className="rounded-lg border border-emerald-500/15 bg-black/40 p-6"
          >
            <h3 className="font-mono text-sm font-bold text-emerald-300">{cmd.name}</h3>
            <p className="mt-2 font-mono text-xs text-emerald-500/60 leading-relaxed">
              {cmd.desc}
            </p>

            {cmd.flags.length > 0 && (
              <div className="mt-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/30 mb-2">
                  Options
                </p>
                <div className="flex flex-col gap-1">
                  {cmd.flags.map((f) => (
                    <div key={f.flag} className="flex gap-3 font-mono text-xs">
                      <code className="text-emerald-400 shrink-0">{f.flag}</code>
                      <span className="text-emerald-500/40">{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className="mt-4 rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-sm text-green-400"
              style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}
            >
              {cmd.example}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-between">
        <Link
          href="/docs/getting-started"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          &larr; Getting Started
        </Link>
        <Link
          href="/docs/providers"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          Next: Providers &rarr;
        </Link>
      </div>
    </div>
  );
}
