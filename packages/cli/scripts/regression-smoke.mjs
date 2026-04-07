import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = join(scriptDir, "..");
const cliEntry = join(packageDir, "dist", "cli.js");
const packageJson = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));

function runCli(args) {
  return execFileSync(process.execPath, [cliEntry, ...args], {
    cwd: packageDir,
    encoding: "utf8",
    env: {
      ...process.env,
      GETWIRED_DISABLE_UPDATE_CHECK: "1",
    },
  });
}

function expectIncludes(output, fragments, label) {
  for (const fragment of fragments) {
    assert.match(
      output,
      new RegExp(escapeRegExp(fragment)),
      `${label} is missing expected text: ${fragment}`,
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const rootHelp = runCli(["--help"]);
expectIncludes(rootHelp, [
  "Human-like AI testing CLI",
  "init",
  "test",
  "report",
  "dashboard",
], "root help");

const initHelp = runCli(["init", "--help"]);
expectIncludes(initHelp, [
  "Initialize GetWired and open the dashboard",
  "--provider <provider>",
], "init help");

const testHelp = runCli(["test", "--help"]);
expectIncludes(testHelp, [
  "Run tests",
  "--url <url>",
  "--commit <id>",
  "--pr <id>",
  "--scope <scope>",
  "--persona <mode>",
  "--device <profile>",
  "--provider <provider>",
], "test help");

const reportHelp = runCli(["report", "--help"]);
expectIncludes(reportHelp, [
  "View test reports",
  "--id <id>",
  "--latest",
], "report help");

const version = runCli(["--version"]).trim();
assert.equal(version, packageJson.version, "CLI version output does not match package.json");

console.log("CLI regression smoke check passed.");
