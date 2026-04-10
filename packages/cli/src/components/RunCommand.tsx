import { useState, useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { exec } from "node:child_process";
import { Header } from "./Header.js";
import { StatusBar } from "./StatusBar.js";
import { TestProgress } from "./TestProgress.js";
import { ProviderStream } from "./ProviderStream.js";
import { runTestSession, runNativeTestSession, runDesktopTestSession } from "../orchestrator/index.js";
import type { TestStep, TestPhase } from "../orchestrator/index.js";
import type { DeviceProfile, NativePlatform, TestFinding, TestPersona, TestReport } from "../providers/types.js";
import type { DesktopPlatform } from "../desktop/types.js";

const DESKTOP_PLATFORMS: string[] = ["electron"];
function isDesktopPlatform(p: string): p is DesktopPlatform {
  return DESKTOP_PLATFORMS.includes(p);
}

interface RunCommandProps {
  options: {
    url?: string;
    commit?: string;
    pr?: string;
    scope?: string;
    persona?: TestPersona;
    device?: string;
    platform?: NativePlatform | DesktopPlatform;
    provider?: string;
    baselineOnly?: boolean;
  };
}

export function RunCommand({ options }: RunCommandProps) {
  const { exit: _exit } = useApp();
  const [phase, setPhase] = useState<TestPhase>("initializing");
  const [phaseMessage, setPhaseMessage] = useState("Starting...");
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [findings, setFindings] = useState<TestFinding[]>([]);
  const [, setLogs] = useState<string[]>([]);
  const [report, setReport] = useState<TestReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providerOutput, setProviderOutput] = useState("");

  useEffect(() => {
    const projectPath = process.cwd();
    const device = options.device as DeviceProfile | undefined;
    const callbacks = {
      onPhaseChange: (p: TestPhase, msg: string) => {
        setPhase(p);
        setPhaseMessage(msg);
      },
      onStepUpdate: (s: TestStep[]) => setSteps([...s]),
      onFinding: (f: TestFinding) => setFindings((prev) => [...prev, f]),
      onLog: (msg: string) => setLogs((prev) => [...prev, msg].slice(-10)),
      onProviderOutput: (text: string) => setProviderOutput((prev) => prev + text),
    };

    let session: Promise<TestReport>;

    if (options.platform && isDesktopPlatform(options.platform)) {
      const runOptions = {
        url: options.url,
        scope: options.scope,
        persona: options.persona,
        desktopPlatform: options.platform,
        provider: options.provider,
        device,
      };
      session = runDesktopTestSession(projectPath, runOptions, callbacks);
    } else if (options.platform) {
      const runOptions = {
        url: options.url,
        scope: options.scope,
        persona: options.persona,
        nativePlatform: options.platform,
        provider: options.provider,
        device,
      };
      session = runNativeTestSession(projectPath, runOptions, callbacks);
    } else {
      session = runTestSession(
        projectPath,
        {
          url: options.url,
          commitId: options.commit,
          prId: options.pr,
          scope: options.scope,
          persona: options.persona,
          provider: options.provider,
          device,
        },
        callbacks,
      );
    }

    session
      .then((r: TestReport) => setReport(r))
      .catch((err: unknown) => setError(String(err)));
  }, []);

  const statusMap: Record<TestPhase, "idle" | "testing" | "analyzing" | "reporting" | "error"> = {
    initializing: "testing",
    scanning: "testing",
    planning: "analyzing",
    "capturing-baseline": "testing",
    testing: "testing",
    "capturing-current": "testing",
    comparing: "analyzing",
    analyzing: "analyzing",
    breaking: "testing",
    reporting: "reporting",
    done: "idle",
    error: "error",
  };

  const mode = options.commit
    ? `Regression · commit ${options.commit.slice(0, 7)}`
    : options.pr
      ? `Regression · PR #${options.pr}`
      : options.platform
        ? `${options.platform === "ios" ? "iOS" : options.platform === "android" ? "Android" : "Electron"} · ${options.url ?? "Launch app"}`
      : options.baselineOnly
        ? "Capturing Baselines"
        : options.persona && options.persona !== "standard"
          ? `${getPersonaLabel(options.persona)}${options.url ? ` · ${options.url}` : ""}`
        : options.url
          ? `Testing · ${options.url}`
          : "Full Test Suite";

  return (
    <Box flexDirection="column">
      <Header subtitle={mode} />
      <StatusBar status={statusMap[phase] ?? "testing"} message={phaseMessage} />

      {/* Split Pane: Left = Progress | Right = Agent Feed */}
      <Box flexDirection="row" marginY={1} minHeight={20} width="100%">
        {/* Left Panel */}
        <Box flexDirection="column" width="50%" flexGrow={0} flexShrink={0}>
          {steps.length > 0 && (
            <TestProgress steps={steps} currentStep={Math.max(0, steps.findIndex((s) => s.status === "running"))} />
          )}

          {findings.length > 0 && (
            <Box flexDirection="column" paddingX={1} marginTop={1}>
              <Text color="greenBright" bold>── Findings ({findings.length}) ──</Text>
              {findings.slice(-6).map((f, i) => (
                <Box key={i} gap={1} paddingLeft={1}>
                  <Text color={f.severity === "critical" || f.severity === "high" ? "redBright" : "yellow"}>
                    {f.severity === "critical" || f.severity === "high" ? "✘" : "⚠"} [{f.severity}] {f.title.slice(0, 40)}
                  </Text>
                </Box>
              ))}
            </Box>
          )}

          {report && (
            <Box flexDirection="column" paddingX={1} marginTop={1}>
              <Text color="greenBright" bold>✔ Testing Complete</Text>
              <Text color="green">
                {report.summary.passed} passed · {report.summary.failed} failed · {report.summary.warnings} warnings
              </Text>
              {report.execution && (
                <Text color={report.execution.evidenceMet ? "green" : "redBright"} dimColor={!report.execution.evidenceMet}>
                  {options.platform ? "Device evidence" : "Browser evidence"}: {report.execution.navigations} navigations · {report.execution.screenshots} screenshots
                </Text>
              )}
              <Text color="green" dimColor>
                {report.summary.duration}ms · .getwired/reports/{report.id}/{report.id}.json
              </Text>
              {(() => {
                const htmlPath = join(process.cwd(), ".getwired", "reports", report.id, "report.html");
                const htmlExists = existsSync(htmlPath);
                if (htmlExists) {
                  const fileUrl = pathToFileURL(htmlPath).href;
                  return (
                    <Box flexDirection="column">
                      <Text color="greenBright" bold>
                        📄 Report: <Text color="cyan">{fileUrl}</Text>
                      </Text>
                      <Text color="green" dimColor>
                        ↑ Click the link above to open in your browser
                      </Text>
                    </Box>
                  );
                }
                return null;
              })()}
              {report.execution?.screenshots ? (
                <Text color="green" dimColor>
                  Screenshots: .getwired/reports/{report.id}/screenshots/
                </Text>
              ) : (
                <Text color="redBright" dimColor>
                  Screenshots: none captured
                </Text>
              )}
            </Box>
          )}

          {error && (
            <Box flexDirection="column" paddingX={1} marginTop={1}>
              <Text color="redBright">Error: {error.slice(0, 120)}</Text>
            </Box>
          )}
        </Box>

        {/* Right Panel: Live Provider Output */}
        <Box width="50%" flexGrow={0} flexShrink={0}>
          <ProviderStream
            output={providerOutput}
            isStreaming={!report && !error && phase !== "done" && phase !== "error"}
          />
        </Box>
      </Box>

      <Box paddingX={2} marginTop={1} gap={2}>
        <Text color="green" dimColor>[Ctrl+C] Cancel</Text>
      </Box>
    </Box>
  );
}

function getPersonaLabel(persona: TestPersona): string {
  switch (persona) {
    case "hacky": return "Hacky Testing";
    case "old-man": return "Old Man Test";
    default: return "Testing";
  }
}
