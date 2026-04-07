#!/usr/bin/env node

const mode = process.env.OPENCODE_FAKE_MODE ?? process.env.FAKE_OPENCODE_MODE ?? "default";

const stdoutEvents = [
  { type: "text", text: "Analyzing page structure at localhost:3000..." },
  { type: "text", text: "Found 3 interactive elements." },
  { type: "text", text: "Test plan: check form validation, nav links, footer." },
];

const stderrNoise = [
  "Loading MCP server: filesystem...",
  "Loading MCP server: browser...",
  "Connected to 2 MCP servers (5 tools)",
  "Initializing tool: read_file...",
  "Initializing tool: list_files...",
  "Initializing tool: browser_navigate...",
  "All MCP tools ready",
];

const largeStderrHead = "LARGE-STDERR-HEAD";
const largeStderrTail = "LARGE-STDERR-TAIL";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function writeLines(stream, lines) {
  for (const line of lines) {
    stream.write(`${line}\n`);
  }
}

function writeJsonLines(stream, events) {
  for (const event of events) {
    stream.write(`${JSON.stringify(event)}\n`);
  }
}

void process.argv.slice(2);

switch (mode) {
  case "default":
    writeLines(process.stderr, stderrNoise);
    writeJsonLines(process.stdout, stdoutEvents);
    break;
  case "large-stderr":
    process.stderr.write(`${largeStderrHead}${"x".repeat(20_000)}${largeStderrTail}\n`);
    writeJsonLines(process.stdout, stdoutEvents);
    process.exitCode = 23;
    break;
  case "stderr-error":
    process.stderr.on("error", () => {});
    process.stderr.write("Preparing stderr failure simulation...\n");
    process.stderr.destroy(new Error("simulated stderr failure"));
    await sleep(10);
    writeJsonLines(process.stdout, stdoutEvents);
    break;
  default:
    process.stderr.write(`Unknown FAKE_OPENCODE_MODE: ${mode}\n`);
    process.exitCode = 64;
}

await sleep(10);