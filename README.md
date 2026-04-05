<p align="center">
  <strong>🔌 GetWired</strong><br/>
  <em>Human-Like AI Testing CLI</em>
</p>

<p align="center">
  Driven by the <a href="https://pxllnk.co/intent-getwired"><strong>Augment Code Community</strong></a> · Built with <a href="https://pxllnk.co/intent-getwired"><strong>Intent</strong></a>
</p>

---

Break your app before your users do. GetWired uses AI to test your web apps and native Android & iOS apps like a chaotic real human — clicking random links, typing garbage, rage-clicking buttons, and hunting for bugs, XSS vulnerabilities, and broken layouts.

## Install

```bash
npm install -g getwired
```

### Collaborator Local CLI Setup

If you want to run the local CLI build from this repo instead of a previously installed global package:

```bash
npm uninstall -g getwired
cd packages/cli
npm link
getwired 
```

This installs and uses the local version of the GetWired CLI from `packages/cli`.

## Quick Start

```bash
cd /path/to/your-app
npm run dev
getwired init
getwired test
```

Run GetWired from your project folder directly. For web apps, it tests local apps on `localhost` or other loopback addresses and will not target remote `.com` or other online websites. For native apps, it connects to Android emulators and iOS simulators to test your mobile builds.

## Commands

| Command | Description |
| --- | --- |
| `getwired` | Do everything from there |
| `getwired init` | Initialize GetWired and configure your AI provider |
| `getwired test` | Run AI-driven chaotic testing against your local dev server |
| `getwired report` | View test reports |
| `getwired mcp` | Start MCP server for AI coding agent integration |

### Test Flags

```
-u, --url <url>          Local URL to test (optional; localhost/loopback only)
-c, --commit <id>        Test against a specific commit for regression
-p, --pr <id>            Test against a specific pull request
--scope <scope>          Scope of testing (e.g. auth, checkout)
--persona <mode>         Test persona: standard, hacky, or old-man
-d, --device <profile>   Device profile: desktop, mobile, or both
--provider <provider>    Override AI provider for this run
```

## Supported Providers

| Provider | ID | Description |
| --- | --- | --- |
| **Claude Code** | `claude-code` | Anthropic's Claude — excellent at understanding complex UIs |
| **Auggie** | `auggie` | Augment Code's agent — fast, context-aware testing |
| **Codex** | `codex` | OpenAI's Codex CLI — lightweight and scriptable |
| **OpenCode** | `opencode` | Open-source provider — fully local, no API key needed |

```bash
npx getwired init --provider auggie
```

## Supported Platforms

| Platform | Description |
| --- | --- |
| **Web Apps** | Any web app on localhost — Next.js, React, Vue, Svelte, plain HTML, and more |
| **Native Android** | Android apps running in an emulator via ADB |
| **Native iOS** | iOS apps running in the Simulator via AXe |

## MCP Integration

Use GetWired as an MCP server so your AI coding agent can run tests directly. Works with Claude Code, Cursor, Windsurf, Codex, and any MCP-compatible tool.

```bash
getwired mcp
```

### Claude Code

Add to `~/.claude/settings.json` (global) or `.claude/settings.json` (project):

```json
{
  "mcpServers": {
    "getwired": {
      "command": "getwired",
      "args": ["mcp"]
    }
  }
}
```

Restart Claude Code for changes to take effect.

### OpenAI Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.getwired]
command = "getwired"
args = ["mcp"]
```

Or via the CLI:

```bash
codex mcp add getwired -- getwired mcp
```

### Augment Code (Auggie)

Open Augment settings, go to MCP servers, and add this JSON:

```json
{
  "mcpServers": {
    "getwired": {
      "command": "getwired",
      "args": ["mcp"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "getwired": {
      "command": "getwired",
      "args": ["mcp"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "getwired": {
      "command": "getwired",
      "args": ["mcp"]
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
| --- | --- |
| `getwired_check_status` | Check if GetWired is initialized in a project |
| `getwired_init` | Initialize GetWired configuration |
| `getwired_run_test` | Run a full AI-powered test session |
| `getwired_list_reports` | List past test reports |
| `getwired_get_report` | Get a full report by ID |
| `getwired_get_findings` | Get findings filtered by severity or category |

## How It Works

1. **Init** — Run GetWired from your project folder so it can scan that project, detect your framework (or native mobile platform), and find the dev server or emulator
2. **Test** — Your chosen AI explores your app like a chaotic human user — in a browser for web, or on an emulator/simulator for native
3. **Report** — Detailed HTML reports with screenshots and bug descriptions saved to `.getwired/reports/`

## Thanks

Special thanks to [AXe](https://github.com/cameroncooke/AXe) for native iOS Simulator interaction, to [Appium](https://github.com/appium/appium) for the open-source tooling we use in parts of our native testing flow, and to the Android `adb` toolchain for powering native emulator testing in GetWired.

## License

MIT
