import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerCheckStatus } from "./tools/check-status.js";
import { registerInit } from "./tools/init-project.js";
import { registerRunTest } from "./tools/run-test.js";
import { registerListReports } from "./tools/list-reports.js";
import { registerGetReport } from "./tools/get-report.js";
import { registerGetFindings } from "./tools/get-findings.js";

export async function startMcpServer() {
  const server = new McpServer({
    name: "getwired",
    version: "0.0.16",
  });

  registerCheckStatus(server);
  registerInit(server);
  registerRunTest(server);
  registerListReports(server);
  registerGetReport(server);
  registerGetFindings(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
