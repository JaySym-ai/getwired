import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getReportDir } from "../../config/settings.js";
import { loadReport, findLatestReport } from "./get-report.js";

export function registerGetFindings(server: McpServer) {
  server.tool(
    "getwired_get_findings",
    "Get test findings filtered by severity or category. Defaults to latest report if no report_id given.",
    {
      project_path: z.string().describe("Absolute path to the project root"),
      report_id: z.string().optional().describe("Report ID (defaults to latest report)"),
      severity: z
        .enum(["critical", "high", "medium", "low", "info"])
        .optional()
        .describe("Filter by severity level"),
      category: z
        .enum(["ui-regression", "functional", "accessibility", "performance", "seo", "console-error"])
        .optional()
        .describe("Filter by finding category"),
    },
    async ({ project_path, report_id, severity, category }) => {
      try {
        const reportDir = getReportDir(project_path);
        const id = report_id ?? (await findLatestReport(reportDir));

        if (!id) {
          return {
            content: [{ type: "text", text: "No reports found. Run getwired_run_test first." }],
            isError: true,
          };
        }

        const report = await loadReport(reportDir, id);
        if (!report) {
          return {
            content: [{ type: "text", text: `Report "${id}" not found.` }],
            isError: true,
          };
        }

        let findings = report.findings;
        if (severity) findings = findings.filter((f) => f.severity === severity);
        if (category) findings = findings.filter((f) => f.category === category);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  reportId: report.id,
                  timestamp: report.timestamp,
                  totalFindings: report.findings.length,
                  filteredCount: findings.length,
                  filters: { severity: severity ?? "all", category: category ?? "all" },
                  findings: findings.map((f) => ({
                    id: f.id,
                    severity: f.severity,
                    category: f.category,
                    title: f.title,
                    description: f.description,
                    url: f.url ?? null,
                    device: f.device ?? null,
                    steps: f.steps ?? [],
                  })),
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading findings: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
