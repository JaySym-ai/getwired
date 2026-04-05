import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { configExists } from "../../config/settings.js";
import type {
  TestReport,
  TestFinding,
  TestPersona,
} from "../../providers/types.js";
import type { OrchestratorCallbacks, TestStep } from "../../orchestrator/index.js";

/**
 * Temporarily redirect all stdout writes to stderr so that stray console.log
 * calls from the orchestrator (e.g. ensureAgentBrowser) don't corrupt the
 * MCP JSON-RPC stream on stdout.
 */
function redirectStdout(): () => void {
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (chunk: any, ...args: any[]) {
    return (process.stderr.write as any).call(process.stderr, chunk, ...args);
  } as any;
  return () => {
    process.stdout.write = originalWrite;
  };
}

export function registerRunTest(server: McpServer) {
  server.tool(
    "getwired_run_test",
    "Run a full AI-powered test session on a web app, native app, or desktop app. This is the main testing tool — it launches a browser, navigates the app, and reports bugs, regressions, and security issues. Takes 2-5 minutes.",
    {
      project_path: z.string().describe("Absolute path to the project root"),
      url: z
        .string()
        .optional()
        .describe("Local app URL to test (e.g. http://localhost:3000). Uses config URL if not provided."),
      scope: z
        .string()
        .optional()
        .describe("Scope of testing (e.g. auth, checkout, navigation)"),
      persona: z
        .enum(["standard", "hacky", "old-man"])
        .optional()
        .describe("Test persona: standard (normal user), hacky (security-focused), old-man (confused user)"),
      platform: z
        .enum(["android", "ios", "electron"])
        .optional()
        .describe("Native platform. Omit for web browser testing."),
      commit: z
        .string()
        .optional()
        .describe("Test against a specific commit for visual regression"),
      pr: z
        .string()
        .optional()
        .describe("Test against a specific PR for visual regression"),
      device: z
        .enum(["desktop", "mobile", "both"])
        .optional()
        .describe("Device profile (default: both)"),
    },
    async ({ project_path, url, scope, persona, platform, commit, pr, device }) => {
      if (!configExists(project_path)) {
        return {
          content: [
            {
              type: "text",
              text: "GetWired is not initialized. Run getwired_init first.",
            },
          ],
          isError: true,
        };
      }

      const logs: string[] = [];
      const findings: TestFinding[] = [];

      const callbacks: OrchestratorCallbacks = {
        onPhaseChange: (phase, msg) => {
          logs.push(`[${phase}] ${msg}`);
          // Write progress to stderr so MCP client logs show progress
          console.error(`[getwired] ${phase}: ${msg}`);
        },
        onStepUpdate: (_steps: TestStep[]) => {},
        onFinding: (finding) => {
          findings.push(finding);
          console.error(`[getwired] Finding: [${finding.severity}] ${finding.title}`);
        },
        onLog: (msg) => {
          logs.push(msg);
        },
      };

      // Redirect stdout to stderr during test execution to protect MCP protocol
      const restoreStdout = redirectStdout();

      try {
        let report: TestReport;

        if (platform === "android" || platform === "ios") {
          const { runNativeTestSession } = await import("../../orchestrator/index.js");
          report = await runNativeTestSession(
            project_path,
            {
              url,
              scope,
              persona: persona as TestPersona | undefined,
              nativePlatform: platform,
            },
            callbacks,
          );
        } else if (platform === "electron") {
          const { runDesktopTestSession } = await import("../../orchestrator/index.js");
          report = await runDesktopTestSession(
            project_path,
            {
              url,
              scope,
              persona: persona as TestPersona | undefined,
              desktopPlatform: "electron",
            },
            callbacks,
          );
        } else {
          const { runTestSession } = await import("../../orchestrator/index.js");
          report = await runTestSession(
            project_path,
            {
              url,
              commitId: commit,
              prId: pr,
              scope,
              persona: persona as TestPersona | undefined,
            },
            callbacks,
          );
        }

        // Strip large binary data from response
        const cleanReport = {
          id: report.id,
          timestamp: report.timestamp,
          provider: report.provider,
          summary: report.summary,
          findings: report.findings.map((f) => ({
            id: f.id,
            severity: f.severity,
            category: f.category,
            title: f.title,
            description: f.description,
            url: f.url ?? null,
            device: f.device ?? null,
            steps: f.steps ?? [],
            screenshotPath: f.screenshotPath ?? null,
          })),
          notes: report.notes,
          execution: report.execution ?? null,
        };

        return {
          content: [
            { type: "text", text: JSON.stringify(cleanReport, null, 2) },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: err instanceof Error ? err.message : String(err),
                  logs: logs.slice(-20), // Last 20 log entries for debugging
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      } finally {
        restoreStdout();
      }
    },
  );
}
