import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getReportDir } from "../../config/settings.js";
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { TestReport } from "../../providers/types.js";

/** Strip base64 screenshot data from findings to keep response size manageable. */
function stripScreenshotData(report: TestReport): TestReport {
  return {
    ...report,
    findings: report.findings.map((f) => ({
      ...f,
      // Keep paths but note they're local file paths
      screenshotPath: f.screenshotPath ?? undefined,
      diffScreenshotPath: f.diffScreenshotPath ?? undefined,
    })),
  };
}

async function findLatestReport(reportDir: string): Promise<string | null> {
  if (!existsSync(reportDir)) return null;
  const entries = await readdir(reportDir, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .reverse();
  return dirs[0] ?? null;
}

async function loadReport(reportDir: string, reportId: string): Promise<TestReport | null> {
  const dir = join(reportDir, reportId);
  if (!existsSync(dir)) return null;

  const files = await readdir(dir);
  const jsonFile = files.find((f) => f.endsWith(".json") && f !== "debug.log");
  if (!jsonFile) return null;

  const raw = await readFile(join(dir, jsonFile), "utf-8");
  return JSON.parse(raw) as TestReport;
}

export { loadReport, findLatestReport };

export function registerGetReport(server: McpServer) {
  server.tool(
    "getwired_get_report",
    "Get a full test report by ID. Returns all findings, steps, and summary.",
    {
      project_path: z.string().describe("Absolute path to the project root"),
      report_id: z.string().describe("Report ID (e.g. gw-m4x2k1a3-7f2b). Use getwired_list_reports to find IDs."),
    },
    async ({ project_path, report_id }) => {
      try {
        const reportDir = getReportDir(project_path);
        const report = await loadReport(reportDir, report_id);

        if (!report) {
          return {
            content: [
              {
                type: "text",
                text: `Report "${report_id}" not found. Use getwired_list_reports to see available reports.`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            { type: "text", text: JSON.stringify(stripScreenshotData(report), null, 2) },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading report: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
