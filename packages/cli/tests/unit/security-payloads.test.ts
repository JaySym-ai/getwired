import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { GetwiredSettings } from "../../src/config/settings.js";
import { buildSecurityPayloadSection } from "../../src/orchestrator/security-section.js";
import {
  BUILT_IN_PAYLOADS,
  formatPayloadsForPrompt,
  getPayloads,
  getPayloadsForTarget,
} from "../../src/security/payloads.js";

function createDefaultSettings(): GetwiredSettings {
  return {
    provider: "claude-code",
    auth: {},
    authentication: {
      cookies: [],
      localStorage: {},
      credentials: {},
    },
    native: {
      ios: {},
      android: {},
      electron: {},
    },
    testing: {
      deviceProfile: "both",
      viewports: {
        desktop: { width: 1920, height: 1080 },
        mobile: { width: 390, height: 844 },
      },
      screenshotFullPage: true,
      screenshotDelay: 1000,
      diffThreshold: 0.01,
      maxConcurrency: 3,
      showBrowser: false,
    },
    project: {
      name: "test-project",
      url: undefined,
      notes: [],
      pages: [],
      ignorePatterns: ["node_modules", ".git", "dist", ".next"],
    },
    reporting: {
      outputFormat: "json",
      includeScreenshots: true,
      autoOpen: false,
    },
    security: {
      enabledCategories: ["xss", "sqli", "path-traversal", "template-injection", "header-injection"],
      injectPayloads: true,
    },
    telemetry: true,
  };
}

describe("security payloads module", () => {
  it("returns all built-in payloads when no categories are provided", () => {
    assert.deepEqual(getPayloads(), BUILT_IN_PAYLOADS);
  });

  it("returns only XSS payloads when filtered to xss", () => {
    const payloads = getPayloads(["xss"]);

    assert.ok(payloads.length > 0);
    assert.ok(payloads.every((payload) => payload.category === "xss"));
  });

  it("returns both XSS and SQLi payloads when filtered to multiple categories", () => {
    const payloads = getPayloads(["xss", "sqli"]);

    assert.ok(payloads.some((payload) => payload.category === "xss"));
    assert.ok(payloads.some((payload) => payload.category === "sqli"));
    assert.ok(payloads.every((payload) => payload.category === "xss" || payload.category === "sqli"));
  });

  it("returns only input-targeted payloads for the input target", () => {
    const payloads = getPayloadsForTarget("input");

    assert.ok(payloads.length > 0);
    assert.ok(payloads.every((payload) => payload.target === "input"));
  });

  it("formats payloads into grouped prompt text within the expected size bound", () => {
    const prompt = formatPayloadsForPrompt(getPayloads());

    assert.match(prompt, /## Security Payloads/);
    assert.match(prompt, /### XSS/);
    assert.match(prompt, /### SQLi/);
    assert.ok(prompt.length < 8000);
  });
});

describe("buildSecurityPayloadSection", () => {
  it("returns an empty string for the standard persona", () => {
    assert.equal(buildSecurityPayloadSection("standard", createDefaultSettings()), "");
  });

  it("returns an empty string for the old-man persona", () => {
    assert.equal(buildSecurityPayloadSection("old-man", createDefaultSettings()), "");
  });

  it("returns a payload section for the hacky persona", () => {
    const section = buildSecurityPayloadSection("hacky", createDefaultSettings());

    assert.match(section, /Security Payload Reference/);
    assert.match(section, /## Security Payloads/);
    assert.ok(section.includes("<script>alert(1)</script>"));
  });

  it("returns an empty string when payload injection is disabled", () => {
    const settings = createDefaultSettings();
    settings.security.injectPayloads = false;

    assert.equal(buildSecurityPayloadSection("hacky", settings), "");
  });
});
