import { program } from "commander";
import { render } from "ink";

import { App } from "./components/App.js";
import { RunCommand } from "./components/RunCommand.js";
import { ReportView } from "./components/ReportView.js";
import { checkForUpdates, getLocalVersion } from "./update.js";

program
  .name("getwired")
  .description("Human-like AI testing CLI")
  .version(getLocalVersion());

program
  .command("init")
  .description("Initialize GetWired and open the dashboard")
  .option("--provider <provider>", "AI provider to use (claude-code, auggie, codex)")
  .action((options) => {
    render(<App mode="init" initProvider={options.provider} />);
  });

// Direct CLI commands (non-interactive, for CI/scripting)
program
  .command("test")
  .description("Run tests — tell me what to break")
  .option("-u, --url <url>", "Local app URL to test (localhost/loopback only; uses local config URL if not provided)")
  .option("-c, --commit <id>", "Test against a specific commit for regression")
  .option("-p, --pr <id>", "Test against a specific pull request")
  .option("--scope <scope>", "Scope of testing (e.g. auth, checkout, navigation)")
  .option("--persona <mode>", "Test persona: standard, hacky, or old-man", "standard")
  .option("-d, --device <profile>", "Device profile: desktop, mobile, or both", "both")
  .option("--platform <platform>", "Test platform: android, ios, or electron (uses native automation instead of browser)")
  .option("--provider <provider>", "Override AI provider for this run")
  .action((options) => {
    render(<RunCommand options={options} />);
  });

program
  .command("report")
  .description("View test reports (non-interactive)")
  .option("-i, --id <id>", "View a specific report by ID")
  .action((options) => {
    render(<ReportView reportId={options.id} />);
  });

// MCP server mode (no TUI, communicates over stdio JSON-RPC)
program
  .command("mcp")
  .description("Start MCP server for AI coding agent integration (Claude Code, Cursor, Windsurf, etc.)")
  .action(async () => {
    const { startMcpServer } = await import("./mcp/server.js");
    await startMcpServer();
  });

// Default: interactive dashboard
program
  .command("dashboard", { isDefault: true })
  .description("Open the interactive dashboard")
  .action(() => {
    render(<App mode="dashboard" />);
  });

checkForUpdates();
program.parse();
