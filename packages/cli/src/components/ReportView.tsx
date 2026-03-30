import React, { useState, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Header } from "./Header.js";
import { getReportDir } from "../config/settings.js";
import type { TestReport } from "../providers/types.js";

interface ReportViewProps {
  reportId?: string;
}

export function ReportView({ reportId }: ReportViewProps) {
  const { exit } = useApp();
  const [report, setReport] = useState<TestReport | null>(null);
  const [reports, setReports] = useState<string[]>([]);
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
      const jsonFiles: string[] = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const jsonPath = join(dir, entry.name, `${entry.name}.json`);
          if (existsSync(jsonPath)) {
            jsonFiles.push(entry.name);
          }
        } else if (entry.name.endsWith(".json")) {
          jsonFiles.push(entry.name);
        }
      }
      setReports(jsonFiles.sort().reverse());
      if (jsonFiles.length > 0 && !reportId) {
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
      // Try subdirectory format first: reports/<id>/<id>.json
      const cleanId = id.replace(/\.json$/, "");
      const subDirPath = resolve(dir, cleanId, `${cleanId}.json`);
      const flatPath = resolve(dir, id.endsWith(".json") ? id : `${id}.json`);

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
      if (key.downArrow) setSelectedIndex((p) => Math.min(reports.length - 1, p + 1));
      if (key.return && reports[selectedIndex]) {
        loadReport(reports[selectedIndex]);
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
          {reports.map((r, i) => (
            <Box key={r} gap={1}>
              <Text color={i === selectedIndex ? "greenBright" : "green"}>
                {i === selectedIndex ? " ▸ " : "   "}
              </Text>
              <Text color={i === selectedIndex ? "greenBright" : "green"} bold={i === selectedIndex}>
                {r.replace(".json", "")}
              </Text>
            </Box>
          ))}
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
                  <Box key={i} paddingLeft={1} flexDirection="column">
                    <Text color={f.severity === "critical" || f.severity === "high" ? "redBright" : "yellow"}>
                      {f.severity === "critical" || f.severity === "high" ? "✘" : "⚠"} [{f.severity}] {f.title}
                    </Text>
                    <Text color="green" dimColor>  {f.description.slice(0, 120)}</Text>
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
