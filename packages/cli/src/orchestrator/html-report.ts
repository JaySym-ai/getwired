import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

import type { TestFinding, TestReport, TestStepSummary } from "../providers/types.js";

const STEP_ICONS: Record<NonNullable<TestStepSummary["status"]>, string> = {
  pending: "○",
  running: "◉",
  passed: "✔",
  failed: "✘",
  skipped: "⊘",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60_000) return `${(durationMs / 1000).toFixed(durationMs >= 10_000 ? 1 : 2)}s`;

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function formatTimestamp(timestamp: string): string {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return timestamp;
  return parsed.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

function toFileHref(path: string): string {
  return isAbsolute(path) ? pathToFileURL(path).href : path;
}

function renderMetadata(entries: Array<[label: string, value: string | number | undefined]>): string {
  return entries
    .filter(([, value]) => value !== undefined && value !== "")
    .map(
      ([label, value]) => `<div class="meta-row"><span class="meta-label">${escapeHtml(label)}</span><span class="meta-value">${escapeHtml(String(value))}</span></div>`,
    )
    .join("");
}

function renderPathReference(label: string, path?: string): string {
  if (!path) return "";
  return `<li><span class="path-label">${escapeHtml(label)}:</span> <a href="${escapeHtml(toFileHref(path))}">${escapeHtml(path)}</a></li>`;
}

function renderFinding(finding: TestFinding): string {
  const details = [
    renderPathReference("Screenshot", finding.screenshotPath),
    renderPathReference("Diff", finding.diffScreenshotPath),
  ].filter(Boolean).join("");

  const steps = finding.steps?.length
    ? `<ol class="finding-steps">${finding.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`
    : "";

  const meta = [
    `<span class="pill">${escapeHtml(finding.category)}</span>`,
    finding.device ? `<span class="pill">${escapeHtml(finding.device)}</span>` : "",
    finding.url ? `<a class="pill link-pill" href="${escapeHtml(finding.url)}">${escapeHtml(finding.url)}</a>` : "",
  ].filter(Boolean).join("");

  return `
    <article class="panel finding-card">
      <div class="finding-header">
        <span class="badge severity-${escapeHtml(finding.severity)}">${escapeHtml(finding.severity.toUpperCase())}</span>
        <h3>${escapeHtml(finding.title)}</h3>
      </div>
      <div class="pill-row">${meta}</div>
      <p class="finding-description">${escapeHtml(finding.description)}</p>
      ${steps}
      ${details ? `<ul class="path-list">${details}</ul>` : ""}
    </article>`;
}

function renderStep(step: TestStepSummary): string {
  return `
    <li class="step-item step-${escapeHtml(step.status)}">
      <span class="step-badge">${STEP_ICONS[step.status]} ${escapeHtml(step.status)}</span>
      <div class="step-copy">
        <strong>${escapeHtml(step.name)}</strong>
        ${step.duration !== undefined ? `<span class="step-duration">${escapeHtml(formatDuration(step.duration))}</span>` : ""}
        ${step.details ? `<p>${escapeHtml(step.details)}</p>` : ""}
      </div>
    </li>`;
}

export function renderHtmlReport(report: TestReport): string {
  const summaryCards = [
    ["Total tests", report.summary.totalTests, "neutral"],
    ["Passed", report.summary.passed, "good"],
    ["Failed", report.summary.failed, "bad"],
    ["Warnings", report.summary.warnings, "warn"],
    ["Duration", formatDuration(report.summary.duration), "neutral"],
  ]
    .map(
      ([label, value, tone]) => `<div class="summary-card ${tone}"><span>${escapeHtml(String(label))}</span><strong>${escapeHtml(String(value))}</strong></div>`,
    )
    .join("");

  const findings = report.findings.length
    ? report.findings.map(renderFinding).join("")
    : `<p class="empty">No findings recorded.</p>`;

  const steps = report.steps?.length
    ? `<ol class="step-list">${report.steps.map(renderStep).join("")}</ol>`
    : `<p class="empty">No test step details recorded.</p>`;

  const notes = report.notes.filter(Boolean).length
    ? `<ul class="notes-list">${report.notes.filter(Boolean).map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
    : `<p class="empty">No notes captured.</p>`;

  const contextMetadata = renderMetadata([
    ["Report ID", report.id],
    ["Timestamp", formatTimestamp(report.timestamp)],
    ["Provider", report.provider],
    ["URL", report.context.url],
    ["Scope", report.context.scope],
    ["Persona", report.context.persona ?? "standard"],
    ["Device", report.context.deviceProfile],
    ["Commit", report.context.commitId],
    ["PR", report.context.prId],
    ["Report directory", report.context.reportDir],
  ]);

  const executionMetadata = report.execution
    ? renderMetadata([
        ["Browser sessions", report.execution.browserSessions],
        ["Navigations", report.execution.navigations],
        ["Screenshots", report.execution.screenshots],
        ["Scenarios planned", report.execution.scenariosPlanned],
        ["Scenarios executed", report.execution.scenariosExecuted],
        ["Evidence met", report.execution.evidenceMet ? "Yes" : "No"],
      ])
    : `<p class="empty">Execution metadata unavailable.</p>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GetWired Report · ${escapeHtml(report.id)}</title>
    <style>
      :root { color-scheme: dark; --bg: #040805; --panel: #0b140e; --panel-2: #101b13; --line: #21432f; --text: #eaffef; --muted: #9fc4a9; --accent: #7cff8a; --danger: #ff5c7c; --warn: #ffd166; --info: #7ed7ff; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 32px; background: radial-gradient(circle at top, #0c1e12 0%, var(--bg) 42%); color: var(--text); font: 14px/1.6 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }
      a { color: var(--accent); }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .report { max-width: 1100px; margin: 0 auto; }
      .hero, .panel { background: linear-gradient(180deg, rgba(19, 35, 24, 0.95), rgba(9, 16, 11, 0.96)); border: 1px solid var(--line); border-radius: 18px; box-shadow: 0 18px 48px rgba(0, 0, 0, 0.32); }
      .hero { padding: 24px; margin-bottom: 20px; }
      .hero h1 { margin: 0 0 6px; font-size: 30px; }
      .hero p { margin: 0; color: var(--muted); }
      .summary-grid, .two-up { display: grid; gap: 16px; }
      .summary-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); margin: 20px 0; }
      .two-up { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); margin-bottom: 20px; }
      .summary-card { padding: 14px 16px; border-radius: 14px; border: 1px solid var(--line); background: rgba(6, 12, 8, 0.72); }
      .summary-card span, .meta-label, .step-duration, .empty { color: var(--muted); }
      .summary-card strong { display: block; margin-top: 4px; font-size: 22px; }
      .summary-card.good strong { color: var(--accent); } .summary-card.bad strong { color: var(--danger); } .summary-card.warn strong { color: var(--warn); }
      .panel { padding: 20px; }
      .panel h2 { margin: 0 0 14px; font-size: 20px; }
      .meta-row { display: grid; grid-template-columns: minmax(120px, 160px) 1fr; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(33, 67, 47, 0.45); }
      .meta-row:last-child { border-bottom: 0; }
      .meta-label { text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; }
      .finding-stack { display: grid; gap: 16px; }
      .finding-card { padding: 18px; }
      .finding-header { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
      .finding-header h3 { margin: 0; font-size: 18px; }
      .badge, .pill, .step-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; border: 1px solid transparent; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }
      .badge.severity-critical, .badge.severity-high { background: rgba(255, 92, 124, 0.14); border-color: rgba(255, 92, 124, 0.35); color: var(--danger); }
      .badge.severity-medium { background: rgba(255, 209, 102, 0.14); border-color: rgba(255, 209, 102, 0.35); color: var(--warn); }
      .badge.severity-low, .badge.severity-info { background: rgba(124, 255, 138, 0.14); border-color: rgba(124, 255, 138, 0.35); color: var(--accent); }
      .pill-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
      .pill, .step-badge { background: rgba(18, 31, 22, 0.9); border-color: rgba(124, 255, 138, 0.2); color: var(--muted); text-decoration: none; }
      .link-pill { text-transform: none; letter-spacing: normal; }
      .finding-description { margin: 0 0 12px; }
      .finding-steps, .notes-list, .path-list { margin: 0; padding-left: 20px; }
      .path-list { margin-top: 12px; }
      .path-label { color: var(--muted); }
      .step-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
      .step-item { display: grid; grid-template-columns: max-content 1fr; gap: 12px; align-items: start; padding: 14px 16px; border: 1px solid var(--line); border-radius: 14px; background: rgba(8, 14, 10, 0.7); }
      .step-passed .step-badge { color: var(--accent); border-color: rgba(124, 255, 138, 0.3); }
      .step-failed .step-badge { color: var(--danger); border-color: rgba(255, 92, 124, 0.3); }
      .step-running .step-badge { color: var(--info); border-color: rgba(126, 215, 255, 0.3); }
      .step-skipped .step-badge { color: var(--warn); border-color: rgba(255, 209, 102, 0.3); }
      .step-copy strong { display: inline-block; margin-right: 10px; }
      .step-copy p { margin: 6px 0 0; }
      @media (max-width: 720px) { body { padding: 16px; } .hero h1 { font-size: 24px; } .meta-row, .step-item { grid-template-columns: 1fr; } }
    </style>
  </head>
  <body>
    <main class="report">
      <section class="hero">
        <h1>GetWired Test Report</h1>
        <p>${escapeHtml(report.id)} · ${escapeHtml(formatTimestamp(report.timestamp))}</p>
        <div class="summary-grid">${summaryCards}</div>
      </section>
      <section class="two-up">
        <article class="panel"><h2>Run metadata</h2>${contextMetadata}</article>
        <article class="panel"><h2>Execution</h2>${executionMetadata}</article>
      </section>
      <section class="panel" style="margin-bottom: 20px;"><h2>Findings (${report.findings.length})</h2><div class="finding-stack">${findings}</div></section>
      <section class="panel" style="margin-bottom: 20px;"><h2>Test steps</h2>${steps}</section>
      <section class="panel"><h2>Notes</h2>${notes}</section>
    </main>
  </body>
</html>`;
}