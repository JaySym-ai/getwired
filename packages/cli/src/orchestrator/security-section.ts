import { existsSync, readFileSync } from "node:fs";

import type { GetwiredSettings } from "../config/settings.js";
import type { TestPersona } from "../providers/types.js";
import { formatPayloadsForPrompt, getPayloads } from "../security/payloads.js";
import type { SecurityPayload } from "../security/payloads.js";

export function buildSecurityPayloadSection(persona: TestPersona, settings: GetwiredSettings): string {
  if (persona !== "hacky" || settings.security.injectPayloads === false) {
    return "";
  }

  let payloads = getPayloads(settings.security.enabledCategories);
  const customPayloadsPath = settings.security.customPayloadsPath?.trim();

  if (customPayloadsPath && existsSync(customPayloadsPath)) {
    const parsed = JSON.parse(readFileSync(customPayloadsPath, "utf-8")) as SecurityPayload[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      payloads = [...payloads, ...parsed];
    }
  }

  return `── Security Payload Reference ──
You MUST use these injection vectors when testing. For every form, input field, URL parameter, and header you discover, select payloads from the matching category below and inject them using "fill" actions. Do not just navigate to pages — actively submit payloads. Do not limit yourself to these — also try creative variations.

${formatPayloadsForPrompt(payloads)}`;
}