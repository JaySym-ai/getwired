import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { basename } from "node:path";
import { configExists, initConfig, saveConfig, loadConfig } from "../../config/settings.js";

export function registerInit(server: McpServer) {
  server.tool(
    "getwired_init",
    "Initialize GetWired configuration in a project. Creates .getwired/config.json with defaults.",
    {
      project_path: z.string().describe("Absolute path to the project root"),
      provider: z
        .enum(["claude-code", "auggie", "codex", "opencode"])
        .optional()
        .describe("AI provider to use (defaults to claude-code)"),
    },
    async ({ project_path, provider }) => {
      if (configExists(project_path)) {
        const config = await loadConfig(project_path);
        if (provider && provider !== config.provider) {
          config.provider = provider;
          await saveConfig(project_path, config);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "updated",
                    message: `Provider updated to ${provider}`,
                    configPath: `${project_path}/.getwired/config.json`,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "already_initialized",
                  message: "GetWired is already initialized in this project.",
                  configPath: `${project_path}/.getwired/config.json`,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      try {
        const projectName = basename(project_path);
        const settings = await initConfig(project_path, projectName);
        if (provider) {
          settings.provider = provider;
          await saveConfig(project_path, settings);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "initialized",
                  message: `GetWired initialized in ${project_path}`,
                  provider: settings.provider,
                  configPath: `${project_path}/.getwired/config.json`,
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
              text: `Error initializing: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
