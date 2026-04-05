# GetWired

GetWired is an AI-powered CLI for visual regression and exploratory testing.

## Install

```bash
npm install -g getwired
```

## Usage

```bash
cd /path/to/your-app
getwired init
npm run dev
getwired test --url http://localhost:3000
getwired report
```

Run GetWired from the project folder directly. It only tests local apps on `localhost` or loopback addresses and rejects remote online URLs.

## Commands

- `getwired init` initializes `.getwired/` in the current project folder and opens the dashboard.
- `getwired test` runs a testing session against a local app in the current project folder.
- `getwired report` opens a saved report by id.
- `getwired dashboard` opens the interactive dashboard.
- `getwired mcp` starts an MCP server for AI coding agent integration.

## MCP Server

Run `getwired mcp` to start an MCP server that any AI coding agent can connect to. Add this to your agent's config:

**Claude Code** (`~/.claude/settings.json`):
```json
{
  "mcpServers": {
    "getwired": { "command": "getwired", "args": ["mcp"] }
  }
}
```

**Codex** (`~/.codex/config.toml`):
```toml
[mcp_servers.getwired]
command = "getwired"
args = ["mcp"]
```

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "getwired": { "command": "getwired", "args": ["mcp"] }
  }
}
```

**Windsurf** (`~/.codeium/windsurf/mcp_config.json`):
```json
{
  "mcpServers": {
    "getwired": { "command": "getwired", "args": ["mcp"] }
  }
}
```

**Augment Code**: Open Augment settings > MCP servers, import the same JSON as Claude Code above.

## Requirements

- Node.js 20 or newer

## Repository

https://github.com/JaySym-ai/getwired
