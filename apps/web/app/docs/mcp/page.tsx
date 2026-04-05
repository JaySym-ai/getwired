import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MCP Integration",
  description:
    "Connect GetWired to your AI coding agent via MCP. Step-by-step setup for Claude Code, Codex, Augment Code, Cursor, and Windsurf.",
  alternates: { canonical: "https://getwired.dev/docs/mcp" },
};

const agents = [
  {
    name: "Claude Code",
    id: "claude-code",
    description:
      "Anthropic's Claude Code supports MCP servers via a JSON settings file. You can configure it globally or per-project.",
    steps: [
      "Install GetWired globally: npm install -g getwired",
      "Open your settings file at ~/.claude/settings.json (global) or .claude/settings.json (project-scoped)",
      "Add the GetWired MCP server configuration (see below)",
      "Restart Claude Code for changes to take effect",
    ],
    configFile: "~/.claude/settings.json",
    configFormat: "json" as const,
    config: `{
  "mcpServers": {
    "getwired": {
      "command": "getwired",
      "args": ["mcp"]
    }
  }
}`,
  },
  {
    name: "OpenAI Codex",
    id: "codex",
    description:
      "OpenAI Codex CLI uses a TOML configuration file for MCP servers. You can also add servers via the CLI.",
    steps: [
      "Install GetWired globally: npm install -g getwired",
      "Open ~/.codex/config.toml (create it if it doesn't exist)",
      "Add the GetWired MCP server configuration (see below)",
      "Restart Codex for changes to take effect",
    ],
    configFile: "~/.codex/config.toml",
    configFormat: "toml" as const,
    config: `[mcp_servers.getwired]
command = "getwired"
args = ["mcp"]`,
    altMethod: "Or add it via the CLI: codex mcp add getwired -- getwired mcp",
  },
  {
    name: "Augment Code (Auggie)",
    id: "auggie",
    description:
      "Augment Code supports MCP through its settings panel. You can import a JSON configuration directly.",
    steps: [
      "Install GetWired globally: npm install -g getwired",
      "Open Augment Code settings",
      "Navigate to MCP servers section",
      "Click \"Import\" or \"Add Server\" and paste the JSON configuration below",
      "Save and restart if prompted",
    ],
    configFile: "Augment Settings > MCP Servers",
    configFormat: "json" as const,
    config: `{
  "mcpServers": {
    "getwired": {
      "command": "getwired",
      "args": ["mcp"]
    }
  }
}`,
  },
  {
    name: "Cursor",
    id: "cursor",
    description:
      "Cursor uses a JSON file for MCP configuration. Supports both global and project-scoped settings.",
    steps: [
      "Install GetWired globally: npm install -g getwired",
      "Open ~/.cursor/mcp.json (global) or .cursor/mcp.json (in your project root)",
      "Add the GetWired MCP server configuration (see below)",
      "Restart Cursor for changes to take effect",
    ],
    configFile: "~/.cursor/mcp.json",
    configFormat: "json" as const,
    config: `{
  "mcpServers": {
    "getwired": {
      "command": "getwired",
      "args": ["mcp"]
    }
  }
}`,
  },
  {
    name: "Windsurf",
    id: "windsurf",
    description:
      "Windsurf stores MCP configuration in a JSON file under your Codeium directory. You can also configure it through the UI.",
    steps: [
      "Install GetWired globally: npm install -g getwired",
      "Open ~/.codeium/windsurf/mcp_config.json",
      "Add the GetWired MCP server configuration (see below)",
      "Restart Windsurf or press Cmd/Ctrl+Shift+P and reload MCP servers",
    ],
    configFile: "~/.codeium/windsurf/mcp_config.json",
    configFormat: "json" as const,
    config: `{
  "mcpServers": {
    "getwired": {
      "command": "getwired",
      "args": ["mcp"]
    }
  }
}`,
  },
];

const tools = [
  {
    name: "getwired_check_status",
    description: "Check if GetWired is initialized and configured in a project. Call this first to understand the current state.",
  },
  {
    name: "getwired_init",
    description: "Initialize GetWired configuration in a project. Creates .getwired/config.json with sensible defaults.",
  },
  {
    name: "getwired_run_test",
    description: "Run a full AI-powered test session on a web, native, or desktop app. Accepts URL, scope, persona, platform, and regression options. Takes 2-5 minutes.",
  },
  {
    name: "getwired_list_reports",
    description: "List available test reports with summaries including pass/fail counts, timestamps, and finding counts.",
  },
  {
    name: "getwired_get_report",
    description: "Get a complete test report by ID with all findings, steps, and execution details.",
  },
  {
    name: "getwired_get_findings",
    description: "Get findings filtered by severity (critical, high, medium, low, info) or category (ui-regression, functional, accessibility, etc.).",
  },
];

export default function McpDocs() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-emerald-400 tracking-wider">
        [MCP]
      </h1>
      <p className="mt-2 font-mono text-sm text-emerald-500/50">
        Connect GetWired to your AI coding agent.
      </p>

      <p className="mt-6 font-mono text-xs text-emerald-500/60 leading-relaxed">
        GetWired includes a built-in MCP (Model Context Protocol) server that lets any
        compatible AI coding agent run tests, read reports, and manage your testing
        configuration. Your agent gets 6 tools to work with &mdash; from running a full
        test session to filtering findings by severity.
      </p>

      {/* Quick start */}
      <div className="mt-8 rounded-lg border border-emerald-500/15 bg-black/40 p-6">
        <h2 className="font-mono text-sm font-bold text-emerald-300">Quick Start</h2>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-3 font-mono text-xs">
            <span className="text-emerald-400 shrink-0">1.</span>
            <span className="text-emerald-500/60">Install GetWired globally</span>
          </div>
          <div
            className="rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-sm text-green-400"
            style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}
          >
            $ npm install -g getwired
          </div>
          <div className="flex gap-3 font-mono text-xs mt-2">
            <span className="text-emerald-400 shrink-0">2.</span>
            <span className="text-emerald-500/60">
              Add the config for your agent (see below)
            </span>
          </div>
          <div className="flex gap-3 font-mono text-xs mt-2">
            <span className="text-emerald-400 shrink-0">3.</span>
            <span className="text-emerald-500/60">
              Restart your agent &mdash; GetWired tools will appear automatically
            </span>
          </div>
        </div>
      </div>

      {/* Agent setup guides */}
      <h2 className="mt-12 font-mono text-lg font-bold text-emerald-400 tracking-wider">
        Setup by Agent
      </h2>

      <div className="mt-6 flex flex-col gap-8">
        {agents.map((agent) => (
          <div
            key={agent.id}
            id={agent.id}
            className="rounded-lg border border-emerald-500/15 bg-black/40 p-6"
          >
            <h3 className="font-mono text-sm font-bold text-emerald-300">
              {agent.name}
            </h3>
            <p className="mt-2 font-mono text-xs text-emerald-500/60 leading-relaxed">
              {agent.description}
            </p>

            <div className="mt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/30 mb-2">
                Steps
              </p>
              <div className="flex flex-col gap-1">
                {agent.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 font-mono text-xs">
                    <span className="text-emerald-400 shrink-0">{i + 1}.</span>
                    <span className="text-emerald-500/60">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-500/30 mb-2">
                {agent.configFile}
              </p>
              <div
                className="rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-sm text-green-400 whitespace-pre overflow-x-auto"
                style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}
              >
                {agent.config}
              </div>
            </div>

            {agent.altMethod && (
              <p className="mt-3 font-mono text-xs text-emerald-500/40">
                {agent.altMethod}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Available tools */}
      <h2 className="mt-12 font-mono text-lg font-bold text-emerald-400 tracking-wider">
        Available Tools
      </h2>
      <p className="mt-2 font-mono text-xs text-emerald-500/50">
        Once connected, your AI agent gets access to these tools:
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {tools.map((tool) => (
          <div
            key={tool.name}
            className="rounded-lg border border-emerald-500/15 bg-black/40 p-4"
          >
            <code className="font-mono text-sm text-emerald-400">{tool.name}</code>
            <p className="mt-1 font-mono text-xs text-emerald-500/60 leading-relaxed">
              {tool.description}
            </p>
          </div>
        ))}
      </div>

      {/* npx alternative */}
      <div className="mt-12 rounded-lg border border-emerald-500/15 bg-black/40 p-6">
        <h2 className="font-mono text-sm font-bold text-emerald-300">
          Without Global Install
        </h2>
        <p className="mt-2 font-mono text-xs text-emerald-500/60 leading-relaxed">
          If you prefer not to install globally, use npx in your MCP config instead:
        </p>
        <div
          className="mt-3 rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-sm text-green-400 whitespace-pre overflow-x-auto"
          style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}
        >
{`{
  "mcpServers": {
    "getwired": {
      "command": "npx",
      "args": ["-y", "getwired", "mcp"]
    }
  }
}`}
        </div>
      </div>

      <div className="mt-12 flex justify-between">
        <Link
          href="/docs/test-modes"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          &larr; Test Modes
        </Link>
        <Link
          href="/docs/configuration"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          Next: Configuration &rarr;
        </Link>
      </div>
    </div>
  );
}
