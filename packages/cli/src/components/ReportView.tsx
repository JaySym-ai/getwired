import { useState, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Header } from "./Header.js";
import { getReportDir } from "../config/settings.js";
import { findLatestReport } from "../mcp/tools/get-report.js";
import type { TestReport } from "../providers/types.js";

interface ReportViewProps {
  reportId?: string;
}

interface ReportListItem {
  id: string;
  timestamp: string | null;
  summary: TestReport["summary"] | null;
}

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) return "Unknown time";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDuration(duration: number | undefined) {
  if (typeof duration !== "number") return "Unknown duration";
  if (duration < 1000) return `${duration}ms`;

  const seconds = duration / 1000;
  return seconds < 10 ? `${seconds.toFixed(1)}s` : `${Math.round(seconds)}s`;
}

export function ReportView({ reportId }: ReportViewProps) {
  const { exit } = useApp();
  const [report, setReport] = useState<TestReport | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "detail">(reportId ? "detail" : "list");

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (reportId) {
      loadReport(reportId);
    }
  }, [reportId]);

  async function loadReports() {
    try {
      const dir = getReportDir(process.cwd());
      const entries = await readdir(dir, { withFileTypes: true });
      const summaries = await Promise.all(entries.flatMap((entry) => {
        if (entry.isDirectory()) {
          const jsonPath = join(dir, entry.name, `${entry.name}.json`);
          if (!existsSync(jsonPath)) return [];

          return [
            readFile(jsonPath, "utf-8")
              .then((raw) => {
                const parsed = JSON.parse(raw) as TestReport;
                return {
                  id: entry.name,
                  timestamp: parsed.timestamp,
                  summary: parsed.summary,
                } satisfies ReportListItem;
              })
              .catch(() => ({
                id: entry.name,
                timestamp: null,
                summary: null,
              } satisfies ReportListItem)),
          ];
        }

        if (!entry.name.endsWith(".json")) return [];

        const jsonPath = join(dir, entry.name);
        return [
          readFile(jsonPath, "utf-8")
            .then((raw) => {
              const parsed = JSON.parse(raw) as TestReport;
              return {
                id: entry.name.replace(/\.json$/, ""),
                timestamp: parsed.timestamp,
                summary: parsed.summary,
              } satisfies ReportListItem;
            })
            .catch(() => ({
              id: entry.name.replace(/\.json$/, ""),
              timestamp: null,
              summary: null,
            } satisfies ReportListItem)),
        ];
      }));

      setReports(summaries.sort((a, b) => b.id.localeCompare(a.id)));
      setSelectedIndex(0);
      if (summaries.length > 0 && !reportId) {
        // Auto-load latest
      }
    } catch {
      setError("No reports found. Run `getwired test` first.");
    }
  }

  async function loadReport(id: string) {
    try {
      const dir = getReportDir(process.cwd());
      const resolvedDir = resolve(dir);
      const requestedId = id.replace(/\.json$/, "");
      const cleanId = requestedId === "latest"
        ? await findLatestReport(dir)
        : requestedId;

      if (!cleanId) {
        setError("No reports found. Run `getwired test` first.");
        return;
      }

      // Try subdirectory format first: reports/<id>/<id>.json
      const subDirPath = resolve(dir, cleanId, `${cleanId}.json`);
      const flatPath = resolve(dir, id.endsWith(".json") ? id : `${cleanId}.json`);

      // Prevent path traversal — resolved path must stay within reports dir
      if (!subDirPath.startsWith(resolvedDir + "/") || !flatPath.startsWith(resolvedDir + "/")) {
        setError(`Invalid report ID: ${id}`);
        return;
      }

      const filePath = existsSync(subDirPath) ? subDirPath : flatPath;
      const raw = await readFile(filePath, "utf-8");
      setReport(JSON.parse(raw));
      setView("detail");
    } catch {
      setError(`Could not load report: ${id}`);
    }
  }

  useInput((input, key) => {
    if (input === "q") { exit(); return; }

    if (view === "list") {
      if (key.upArrow) setSelectedIndex((p) => Math.max(0, p - 1));
      if (key.downArrow) setSelectedIndex((p) => Math.max(0, Math.min(reports.length - 1, p + 1)));
      if (key.return && reports[selectedIndex]) {
        loadReport(reports[selectedIndex].id);
      }
    }

    if (view === "detail") {
      if (key.escape || input === "b") setView("list");
    }
  });

  return (
    <Box flexDirection="column">
      <Header subtitle="Test Reports" />

      {error && (
        <Box paddingX={2}>
          <Text color="yellow">{error}</Text>
        </Box>
      )}

      {view === "list" && (
        <Box flexDirection="column" paddingX={2}>
          <Text color="greenBright" bold>
            ┌─ Reports ─────────────────────────────────────
          </Text>
          {reports.length === 0 && (
            <Text color="green" dimColor>  No reports yet.</Text>
          )}
          {reports.map((r, i) => {
            const isSelected = i === selectedIndex;

            return (
              <Box
                key={r.id}
                borderStyle="single"
                borderColor={isSelected ? "greenBright" : "green"}
                flexDirection="column"
                paddingX={1}
              >
                <Box gap={1}>
                  <Text color={isSelected ? "greenBright" : "green"}>
                    {isSelected ? "▸" : " "}
                  </Text>
                  <Text color={isSelected ? "greenBright" : "green"} bold={isSelected}>
                    {r.id}
                  </Text>
                </Box>
                <Box gap={2} paddingLeft={2}>
                  <Text color={isSelected ? "greenBright" : "green"} dimColor>
                    {formatTimestamp(r.timestamp)}
                  </Text>
                  <Text color="green">✔ {r.summary?.passed ?? "?"}</Text>
                  <Text color="redBright">✘ {r.summary?.failed ?? "?"}</Text>
                  <Text color="yellow">⚠ {r.summary?.warnings ?? "?"}</Text>
                  <Text color={isSelected ? "greenBright" : "green"} dimColor>
                    {formatDuration(r.summary?.duration)}
                  </Text>
                </Box>
              </Box>
            );
          })}
          <Text color="greenBright" bold>
            └──────────────────────────────────────────────────
          </Text>
          <Box marginTop={1} gap={2}>
            <Text color="green" dimColor>[↑↓] Navigate</Text>
            <Text color="green" dimColor>[Enter] View</Text>
            <Text color="green" dimColor>[q] Quit</Text>
          </Box>
        </Box>
      )}

      {view === "detail" && report && (
        <Box flexDirection="column" paddingX={2}>
          <Box borderStyle="single" borderColor="green" flexDirection="column" paddingX={2} paddingY={1}>
            <Box justifyContent="space-between" marginBottom={1}>
              <Text color="greenBright" bold>Report #{report.id}</Text>
              <Text color="green" dimColor>{report.timestamp.split("T")[0]}</Text>
            </Box>

            <Box gap={2} marginBottom={1}>
              <Text color="green" dimColor>Provider: {report.provider}</Text>
              <Text color="green" dimColor>Device: {report.context.deviceProfile}</Text>
              <Text color="green" dimColor>Duration: {report.summary.duration}ms</Text>
            </Box>

            {report.execution && (
              <Box gap={2} marginBottom={1}>
                <Text color={report.execution.evidenceMet ? "green" : "redBright"} dimColor={!report.execution.evidenceMet}>
                  Navigations: {report.execution.navigations}
                </Text>
                <Text color={report.execution.evidenceMet ? "green" : "redBright"} dimColor={!report.execution.evidenceMet}>
                  Screenshots: {report.execution.screenshots}
                </Text>
              </Box>
            )}

            <Box flexDirection="column" gap={0}>
              <Box gap={1}>
                <Text color="green">✔</Text>
                <Text color="green">{report.summary.passed} tests passed</Text>
              </Box>
              <Box gap={1}>
                <Text color="redBright">✘</Text>
                <Text color="redBright">{report.summary.failed} issues found</Text>
              </Box>
              <Box gap={1}>
                <Text color="yellow">⚠</Text>
                <Text color="yellow">{report.summary.warnings} warnings</Text>
              </Box>
            </Box>

            {report.steps && report.steps.some((s) => s.status === "failed") && (
              <Box marginTop={1} flexDirection="column">
                <Text color="redBright" bold>── Failed Steps ──────────────────────</Text>
                {report.steps.filter((s) => s.status === "failed").map((s, i) => (
                  <Box key={i} paddingLeft={1} flexDirection="column">
                    <Text color="redBright">✘ {s.name}</Text>
                    {s.details && <Text color="red" dimColor>  → {s.details}</Text>}
                  </Box>
                ))}
              </Box>
            )}
            {report.findings.length > 0 && (
              <Box marginTop={1} flexDirection="column">
                <Text color="greenBright" bold>── Findings ──────────────────────────</Text>
                {report.findings.map((f, i) => (
                  <Box key={i} paddingLeft={1} flexDirection="column" marginBottom={1}>
                    <Text color={f.severity === "critical" || f.severity === "high" ? "redBright" : "yellow"}>
                      {f.severity === "critical" || f.severity === "high" ? "✘" : "⚠"} [{f.severity}] {f.title}
                    </Text>
                    <Text color="green" dimColor wrap="wrap">  What: {f.description}</Text>
                    {f.url && <Text color="cyan" dimColor>  URL: {f.url}</Text>}
                    {f.steps && f.steps.length > 0 && (
                      <Text color="green" dimColor>  Steps: {f.steps.slice(0, 3).join(" → ")}{f.steps.length > 3 ? " …" : ""}</Text>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Box marginTop={1} gap={2}>
            <Text color="green" dimColor>[b] Back</Text>
            <Text color="green" dimColor>[q] Quit</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
