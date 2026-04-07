import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { configExists, loadConfig, getReportDir } from "../../config/settings.js";
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { join } from "node:path";
import {
  checkAgentBrowserInstalled,
  checkProviderCliInstalled,
} from "../../providers/ensure-cli.js";

type UrlReachability = {
  reachable: boolean | null;
  url: string | null;
  error?: string;
};

function redirectStdout(): () => void {
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = function (chunk: any, ...args: any[]) {
    return (process.stderr.write as any).call(process.stderr, chunk, ...args);
  } as any;
  return () => {
    process.stdout.write = originalWrite;
  };
}

async function checkUrlReachable(projectUrl?: string): Promise<UrlReachability> {
  if (!projectUrl) {
    return {
      reachable: null,
      url: null,
    };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(projectUrl);
  } catch (error) {
    return {
      reachable: false,
      url: projectUrl,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return {
      reachable: false,
      url: projectUrl,
      error: `Unsupported protocol: ${parsedUrl.protocol}`,
    };
  }

  const request = parsedUrl.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise<UrlReachability>((resolve) => {
    const req = request(parsedUrl, { method: "HEAD" }, (response) => {
      response.resume();
      resolve({
        reachable: true,
        url: projectUrl,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy(new Error("Request timed out after 5000ms"));
    });

    req.on("error", (error) => {
      resolve({
        reachable: false,
        url: projectUrl,
        error: error.message,
      });
    });

    req.end();
  });
}

export function registerCheckStatus(server: McpServer) {
  server.tool(
    "getwired_check_status",
    "Check if GetWired is initialized and ready to run tests. Reports config state and readiness of required dependencies (provider CLI, browser engine, project URL).",
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

        const restoreStdout = redirectStdout();
        let providerCli: { installed: boolean; binary: string; name: string };
        let agentBrowser: { installed: boolean };

        try {
          const providerCliStatus = checkProviderCliInstalled(config.provider);
          providerCli = {
            installed: providerCliStatus.installed,
            binary: providerCliStatus.binary,
            name: providerCliStatus.displayName,
          };
          agentBrowser = checkAgentBrowserInstalled();
        } finally {
          restoreStdout();
        }

        const urlReachable = await checkUrlReachable(config.project.url);
        const readiness = {
          providerCli,
          agentBrowser,
          urlReachable,
          ready:
            providerCli.installed
            && agentBrowser.installed
            && urlReachable.reachable !== false,
        };

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
                  readiness,
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
