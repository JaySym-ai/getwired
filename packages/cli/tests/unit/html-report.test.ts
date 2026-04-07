import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { TestReport } from "../../src/providers/types.js";
import { renderHtmlReport } from "../../src/orchestrator/html-report.js";

function createReport(): TestReport {
  return {
    id: "gw-html-1234",
    timestamp: "2026-04-07T19:45:00.000Z",
    provider: "claude-code",
    context: {
      projectPath: "/repo",
      url: "http://localhost:3000/checkout",
      scope: "checkout",
      persona: "hacky",
      deviceProfile: "desktop",
      baselineDir: "/repo/.getwired/baselines",
      reportDir: "/repo/.getwired/reports/gw-html-1234",
    },
    findings: [
      {
        id: "finding-1",
        severity: "high",
        category: "functional",
        title: "Broken <Button>",
        description: "Submit action fails after entering \"card\" details.",
        screenshotPath: "/repo/.getwired/reports/gw-html-1234/screenshots/submit button.png",
        url: "http://localhost:3000/checkout",
        device: "desktop",
        steps: ["Open checkout", "Click submit"],
      },
    ],
    execution: {
      browserSessions: 1,
      navigations: 4,
      screenshots: 3,
      scenariosPlanned: 2,
      scenariosExecuted: 2,
      evidenceMet: true,
    },
    steps: [
      { name: "Capture screenshots", status: "passed", duration: 2400, details: "Saved 3 screenshots" },
      { name: "Generate report", status: "failed", details: "Markdown output was skipped" },
    ],
    summary: {
      totalTests: 2,
      passed: 1,
      failed: 1,
      warnings: 0,
      duration: 12_345,
    },
    notes: ["Found issue in the primary checkout flow."],
  };
}

describe("renderHtmlReport", () => {
  it("renders a self-contained HTML report with findings, steps, and metadata", () => {
    const html = renderHtmlReport(createReport());

    assert.match(html, /<!doctype html>/i);
    assert.match(html, /GetWired Test Report/);
    assert.match(html, /Findings \(1\)/);
    assert.match(html, /Test steps/);
    assert.match(html, /Run metadata/);
    assert.match(html, /Execution/);
    assert.match(html, /severity-high/);
    assert.match(html, /Broken &lt;Button&gt;/);
    assert.match(html, /Capture screenshots/);
    assert.match(html, /file:\/\/\/repo\/.getwired\/reports\/gw-html-1234\/screenshots\/submit%20button.png/);
    assert.ok(!html.includes("<img"), "expected screenshot paths to be referenced, not embedded");
  });
});