import { execSync } from "node:child_process";
import { platform } from "node:os";

interface InstallMethod {
  /** Shell command to run */
  command: string;
  /** Human-readable label shown during install */
  label: string;
}

interface ProviderCli {
  binary: string;
  displayName: string;
  /** Ordered list of install methods — first successful one wins */
  installMethods: InstallMethod[];
  /** Manual instructions shown when all auto-install methods fail */
  manualInstructions: string;
}

const isMac = platform() === "darwin";
const isWindows = platform() === "win32";
const hasBrew = !isWindows && tryExec("command -v brew");

function buildToolClis(): Record<string, ProviderCli> {
  const agentBrowserMethods: InstallMethod[] = [
    { command: "npm install -g agent-browser", label: "npm" },
  ];
  if (hasBrew) {
    agentBrowserMethods.push({
      command: "brew install agent-browser",
      label: "Homebrew",
    });
  }

  return {
    "agent-browser": {
      binary: "agent-browser",
      displayName: "Agent Browser",
      installMethods: agentBrowserMethods,
      manualInstructions: "npm install -g agent-browser",
    },
  };
}

function buildProviderClis(): Record<string, ProviderCli> {
  const claudeCodeMethods: InstallMethod[] = [];
  if (!isWindows) {
    claudeCodeMethods.push({
      command: "curl -fsSL https://claude.ai/install.sh | bash",
      label: "curl installer",
    });
  }
  if (hasBrew) {
    claudeCodeMethods.push({
      command: "brew install --cask claude-code",
      label: "Homebrew",
    });
  }
  claudeCodeMethods.push({
    command: "npm install -g @anthropic-ai/claude-code",
    label: "npm",
  });

  const codexMethods: InstallMethod[] = [
    { command: "npm install -g @openai/codex", label: "npm" },
  ];

  const opencodeMethods: InstallMethod[] = [];
  if (!isWindows) {
    opencodeMethods.push({
      command: "curl -fsSL https://opencode.ai/install | bash",
      label: "curl installer",
    });
  }
  if (hasBrew) {
    opencodeMethods.push({
      command: "brew install anomalyco/tap/opencode",
      label: "Homebrew",
    });
  }
  opencodeMethods.push({
    command: "npm install -g opencode-ai",
    label: "npm",
  });

  return {
    "claude-code": {
      binary: "claude",
      displayName: "Claude Code",
      installMethods: claudeCodeMethods,
      manualInstructions: isMac
        ? "brew install --cask claude-code\n   or: curl -fsSL https://claude.ai/install.sh | bash"
        : "curl -fsSL https://claude.ai/install.sh | bash",
    },
    auggie: {
      binary: "auggie",
      displayName: "Auggie",
      installMethods: [
        { command: "npm install -g @augmentcode/auggie", label: "npm" },
      ],
      manualInstructions: "npm install -g @augmentcode/auggie",
    },
    codex: {
      binary: "codex",
      displayName: "Codex",
      installMethods: codexMethods,
      manualInstructions: "npm install -g @openai/codex",
    },
    opencode: {
      binary: "opencode",
      displayName: "OpenCode",
      installMethods: opencodeMethods,
      manualInstructions: isMac
        ? "brew install anomalyco/tap/opencode\n   or: curl -fsSL https://opencode.ai/install | bash"
        : "curl -fsSL https://opencode.ai/install | bash",
    },
  };
}

function tryExec(command: string): boolean {
  try {
    execSync(command, {
      encoding: "utf-8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

function runInstall(command: string): boolean {
  try {
    execSync(command, {
      encoding: "utf-8",
      timeout: 120000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures the CLI tool for a given provider is installed.
 * Tries each install method in order until one succeeds.
 * Returns true if the CLI is available after the check.
 */
export function ensureProviderCli(providerName: string): boolean {
  const clis = buildProviderClis();
  const cli = clis[providerName];
  if (!cli) return true; // Unknown provider — skip check

  if (tryExec(`command -v ${cli.binary}`)) {
    return true;
  }

  console.log(`\n⚙  ${cli.displayName} CLI not found (${cli.binary})`);

  for (const method of cli.installMethods) {
    console.log(`   Installing via ${method.label}…`);

    if (runInstall(method.command)) {
      console.log(`   ✓ ${cli.displayName} CLI installed successfully.\n`);
      return true;
    }

    console.log(`   ✗ ${method.label} failed, trying next method…`);
  }

  console.log(
    `\n   ✗ Auto-install failed. Install manually:\n   ${cli.manualInstructions}\n`,
  );
  return false;
}

/**
 * Ensures agent-browser CLI is installed and its browser engine is set up.
 * Called before any browser operations in the test flow.
 * Returns true if agent-browser is ready to use.
 */
export function ensureAgentBrowser(): boolean {
  const clis = buildToolClis();
  const cli = clis["agent-browser"];
  const browserInstallCommand = "agent-browser install";

  if (tryExec(`command -v ${cli.binary}`)) {
    if (!runInstall(browserInstallCommand)) {
      console.log(
        `   ✗ ${cli.displayName} browser engine is not ready. Run \`${browserInstallCommand}\` manually and try again.\n`,
      );
      return false;
    }

    return true;
  }

  console.log(`\n⚙  ${cli.displayName} not found — installing…`);

  for (const method of cli.installMethods) {
    console.log(`   Installing via ${method.label}…`);

    if (runInstall(method.command)) {
      // Run browser install after CLI is available
      console.log(`   Installing browser engine…`);
      if (!runInstall(browserInstallCommand)) {
        console.log(
          `   ✗ ${cli.displayName} CLI installed, but browser engine setup failed. Run \`${browserInstallCommand}\` manually and try again.\n`,
        );
        return false;
      }

      console.log(`   ✓ ${cli.displayName} installed successfully.\n`);
      return true;
    }

    console.log(`   ✗ ${method.label} failed, trying next method…`);
  }

  console.log(
    `\n   ✗ Auto-install failed. Install manually:\n   ${cli.manualInstructions}\n`,
  );
  return false;
}
