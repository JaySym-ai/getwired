import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getReportDir } from "../../config/settings.js";
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { TestReport } from "../../providers/types.js";

export function registerListReports(server: McpServer) {
  server.tool(
    "getwired_list_reports",
    "List available test reports with summaries. Returns report IDs, timestamps, and pass/fail counts.",
    {
      project_path: z.string().describe("Absolute path to the project root"),
      limit: z.number().optional().describe("Maximum number of reports to return (default 10)"),
    },
    async ({ project_path, limit }) => {
      const max = limit ?? 10;
      const reportDir = getReportDir(project_path);

      if (!existsSync(reportDir)) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ reports: [], message: "No reports directory found." }, null, 2),
            },
          ],
        };
      }

      try {
        const entries = await readdir(reportDir, { withFileTypes: true });
        const dirs = entries
          .filter((e) => e.isDirectory())
          .map((e) => e.name)
          .sort()
          .reverse()
          .slice(0, max);

        const summaries = [];
        for (const dir of dirs) {
          try {
            // Reports are saved as <id>.json inside the directory
            const files = await readdir(join(reportDir, dir));
            const jsonFile = files.find((f) => f.endsWith(".json") && f !== "debug.log");
            if (!jsonFile) continue;

            const raw = await readFile(join(reportDir, dir, jsonFile), "utf-8");
            const report: TestReport = JSON.parse(raw);
            summaries.push({
              id: report.id,
              timestamp: report.timestamp,
              provider: report.provider,
              url: report.context.url ?? null,
              passed: report.summary.passed,
              failed: report.summary.failed,
              warnings: report.summary.warnings,
              duration: report.summary.duration,
              findingCount: report.findings.length,
            });
          } catch {
            // Skip malformed reports
          }
        }

        return {
          content: [
            { type: "text", text: JSON.stringify({ reports: summaries }, null, 2) },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing reports: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
