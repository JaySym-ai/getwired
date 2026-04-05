import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { configExists, loadConfig, getReportDir } from "../../config/settings.js";
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

export function registerCheckStatus(server: McpServer) {
  server.tool(
    "getwired_check_status",
    "Check if GetWired is initialized and configured in a project. Call this first to understand the current state.",
    {
      project_path: z.string().describe("Absolute path to the project root"),
    },
    async ({ project_path }) => {
      const initialized = configExists(project_path);

      if (!initialized) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  initialized: false,
                  message:
                    "GetWired is not initialized in this project. Use getwired_init to set it up.",
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      try {
        const config = await loadConfig(project_path);
        const reportDir = getReportDir(project_path);
        let reportCount = 0;
        if (existsSync(reportDir)) {
          const entries = await readdir(reportDir, { withFileTypes: true });
          const dirs = entries.filter((e: { isDirectory(): boolean }) => e.isDirectory());
          for (const dir of dirs) {
            const files = await readdir(join(reportDir, dir.name));
            if (files.some((f: string) => f.endsWith(".json") && f !== "debug.log")) {
              reportCount++;
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  initialized: true,
                  provider: config.provider,
                  projectName: config.project.name,
                  projectUrl: config.project.url ?? null,
                  deviceProfile: config.testing.deviceProfile,
                  reportCount,
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
              text: `Error reading config: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
