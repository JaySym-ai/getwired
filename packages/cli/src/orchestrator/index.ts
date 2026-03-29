import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";
import { createConnection } from "node:net";
import { getBrowserSession } from "../browser/session.js";
import { getProvider } from "../providers/registry.js";
import { loadConfig, getBaselineDir, getReportDir, getNotesDir, getMemoryPath } from "../config/settings.js";
import { captureScreenshots, captureMultiplePages } from "../screenshot/capture.js";
import { compareScreenshots, imageToBase64 } from "../screenshot/compare.js";
import type {
  TestContext,
  TestExecutionSummary,
  TestReport,
  TestFinding,
  TestPersona,
  TestingProvider,
} from "../providers/types.js";
import type { GetwiredSettings } from "../config/settings.js";

export type TestPhase =
  | "initializing"
  | "scanning"
  | "planning"
  | "capturing-baseline"
  | "testing"
  | "capturing-current"
  | "comparing"
  | "analyzing"
  | "breaking"
  | "reporting"
  | "done"
  | "error";

export interface TestStep {
  name: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  duration?: number;
  details?: string;
}

export interface OrchestratorCallbacks {
  onPhaseChange: (phase: TestPhase, message: string) => void;
  onStepUpdate: (steps: TestStep[]) => void;
  onFinding: (finding: TestFinding) => void;
  onLog: (message: string) => void;
  onProviderOutput?: (text: string) => void;
}

// ─── Interaction action types for Playwright execution ───
interface TestAction {
  type: "navigate" | "click" | "fill" | "select" | "scroll" | "wait" | "screenshot" | "assert" | "keyboard";
  selector?: string;
  value?: string;
  url?: string;
  key?: string;
  description: string;
}

interface InteractionScenario {
  name: string;
  category: "happy-path" | "edge-case" | "abuse" | "boundary" | "error-recovery";
  actions: TestAction[];
}

interface BrowserExecutionStats {
  browserSessions: number;
  navigations: number;
  screenshots: number;
}

interface ScenarioExecutionResult extends BrowserExecutionStats {
  findings: TestFinding[];
  executedScenarios: number;
  error?: string;
}

interface AccessibilityExecutionResult extends BrowserExecutionStats {
  findings: TestFinding[];
  completed: boolean;
  error?: string;
}

// ─── Main test session ──────────────────────────────────
export async function runTestSession(
  projectPath: string,
  options: {
    url?: string;
    commitId?: string;
    prId?: string;
    scope?: string;
    persona?: TestPersona;
  },
  callbacks: OrchestratorCallbacks,
): Promise<TestReport> {
  const startTime = Date.now();
  const settings = await loadConfig(projectPath);
  const provider = getProvider(settings.provider);
  const browserSession = getBrowserSession(settings.testing.showBrowser);
  const persona = options.persona ?? "standard";
  const personaProfile = getPersonaProfile(persona);
  const findings: TestFinding[] = [];
  const execution: TestExecutionSummary = {
    browserSessions: 0,
    navigations: 0,
    screenshots: 0,
    scenariosPlanned: 0,
    scenariosExecuted: 0,
    evidenceMet: false,
  };

  const runId = generateId();
  const memory = await loadMemory(projectPath);
  const memoryUrl = parseMemoryUrl(memory);
  const resolvedUrl = options.url ?? settings.project.url ?? memoryUrl ?? await detectProjectUrl(projectPath);
  const context: TestContext = {
    projectPath,
    url: resolvedUrl,
    commitId: options.commitId,
    prId: options.prId,
    scope: options.scope,
    persona,
    deviceProfile: settings.testing.deviceProfile,
    baselineDir: getBaselineDir(projectPath),
    reportDir: join(getReportDir(projectPath), runId),
  };

  await mkdir(context.reportDir, { recursive: true });

  const steps: TestStep[] = personaProfile.stepNames.map((name) => ({ name, status: "pending" }));

  callbacks.onStepUpdate(steps);

  const out = (text: string) => callbacks.onProviderOutput?.(text);
  const recordFindings = (newFindings: TestFinding[]) => {
    for (const finding of newFindings) {
      findings.push(finding);
      callbacks.onFinding(finding);
    }
  };

  async function streamAnalyze(
    ctx: TestContext,
    messages: { role: "user" | "assistant" | "system"; content: string }[],
  ): Promise<string> {
    let full = "";
    for await (const chunk of provider.stream(ctx, messages)) {
      if (chunk.type === "text" && chunk.content) {
        out(chunk.content);
        full += chunk.content;
      } else if (chunk.type === "tool_call" && chunk.toolCall) {
        out(`\n[tool: ${chunk.toolCall.name}(${JSON.stringify(chunk.toolCall.args).slice(0, 80)})]\n`);
      }
    }
    out("\n");
    return full;
  }

  if (!context.url) {
    throw new Error(
      "No dev server detected. Start your dev server first, or provide a URL when starting a test.",
    );
  }

  try {
    // ── Step 1: Scan project ───────────────────────────
    callbacks.onPhaseChange("scanning", "Scanning project structure...");
    await updateStep(steps, 0, "running", callbacks);
    const projectInfo = await scanProject(projectPath, context);
    await updateStep(steps, 0, "passed", callbacks, Date.now() - startTime);

    // ── Step 2: Load notes & memory ────────────────────
    callbacks.onPhaseChange("scanning", "Loading project context...");
    await updateStep(steps, 1, "running", callbacks);
    const notes = await loadProjectNotes(projectPath);
    if (memory) {
      out(`> Loaded memory from previous test sessions\n`);
      if (memoryUrl && context.url === memoryUrl) {
        out(`> Using remembered URL: ${memoryUrl}\n`);
      }
    }
    await updateStep(steps, 1, "passed", callbacks);

    // ── Step 3: Reconnaissance — AI explores like a human would ──
    callbacks.onPhaseChange("planning", personaProfile.phaseMessages.planning);
    await updateStep(steps, 2, "running", callbacks);
    out(`> ${settings.provider}: ${personaProfile.outputMessages.planning}\n\n`);

    let pageMap = "";
    out(`> Crawling visible links and forms...\n`);
    pageMap = await crawlSiteMap(context.url, out, settings.testing.showBrowser);

    const testPlan = await streamAnalyze(context, [
      { role: "system", content: buildSystemPrompt(persona, memory) },
      { role: "user", content: buildReconPrompt(context, projectInfo, notes, pageMap) },
    ]);
    callbacks.onLog(`Test plan generated with ${countPlanSteps(testPlan)} items`);
    await updateStep(steps, 2, "passed", callbacks);

    // ── Step 4: First impression screenshots ───────────
    let captures: Array<{ path: string; url: string; device: "desktop" | "mobile" }> = [];

    callbacks.onPhaseChange("capturing-current", "Taking first-impression screenshots...");
    await updateStep(
      steps,
      3,
      "running",
      callbacks,
      undefined,
      `Opening ${browserSession.label} for first-impression captures`,
    );
    out(`> Opening ${browserSession.label} — first thing a human sees...\n`);

    const pages = settings.project.pages.length > 0
      ? settings.project.pages
      : [context.url];

    try {
      captures = await captureMultiplePages(pages, {
        outputDir: join(context.reportDir, "screenshots"),
        deviceProfile: settings.testing.deviceProfile,
        viewports: settings.testing.viewports,
        fullPage: settings.testing.screenshotFullPage,
        delay: settings.testing.screenshotDelay,
        showBrowser: settings.testing.showBrowser,
      });
      execution.browserSessions += pages.length;
      execution.navigations += captures.length;
      execution.screenshots += captures.length;
      for (const cap of captures) {
        out(`  📸 ${cap.device}: ${toProjectRelativePath(projectPath, cap.path)}\n`);
      }
      await updateStep(
        steps,
        3,
        captures.length > 0 ? "passed" : "failed",
        callbacks,
        undefined,
        captures.length > 0
          ? `Saved ${captures.length} screenshot${captures.length === 1 ? "" : "s"} to ${toProjectRelativePath(projectPath, join(context.reportDir, "screenshots"))}`
          : "Playwright ran but did not save any screenshots",
      );
    } catch (err) {
      out(`\n! Screenshot failed: ${String(err).slice(0, 100)}\n`);
      await updateStep(steps, 3, "failed", callbacks, undefined, "Screenshot capture failed");
    }

    // ── Step 5: Compare with baselines ──────────────
    callbacks.onPhaseChange("comparing", "Comparing with baselines...");
    await updateStep(steps, 4, "running", callbacks);
    if (captures.length > 0) {
      out(`\n> Pixel-diffing against baselines...\n`);
      const regressionFindings = await compareWithBaselines(captures, context, settings, provider, callbacks);
      recordFindings(regressionFindings);
    }
    await updateStep(
      steps,
      4,
      captures.length > 0 ? "passed" : "failed",
      callbacks,
      undefined,
      captures.length > 0 ? undefined : "Cannot compare baselines without current screenshots",
    );

    // ── Step 6: Generate & execute ALL test scenarios in one pass ──
    callbacks.onPhaseChange("testing", personaProfile.phaseMessages.scenarios);
    await updateStep(steps, 5, "running", callbacks, undefined, `Using ${browserSession.label}`);
    out(`\n> ${settings.provider}: ${personaProfile.outputMessages.scenarios}\n\n`);

    const allScenariosResult = await streamAnalyze(context, [
      { role: "system", content: buildSystemPrompt(persona, memory) },
      { role: "user", content: buildAllScenariosPrompt(context, testPlan, pageMap) },
    ]);

    const allScenarios = parseScenarios(allScenariosResult);
    execution.scenariosPlanned += allScenarios.length;
    let scenarioExecution: ScenarioExecutionResult | null = null;
    if (allScenarios.length > 0) {
      out(`\n> Executing ${allScenarios.length} scenarios in browser...\n`);
      scenarioExecution = await executeScenarios(
        allScenarios, context, settings, out,
      );
      execution.browserSessions += scenarioExecution.browserSessions;
      execution.navigations += scenarioExecution.navigations;
      execution.screenshots += scenarioExecution.screenshots;
      execution.scenariosExecuted += scenarioExecution.executedScenarios;
      recordFindings(scenarioExecution.findings);
    }
    await updateStep(
      steps,
      5,
      scenarioExecution && scenarioExecution.executedScenarios > 0 && !scenarioExecution.error ? "passed" : "failed",
      callbacks,
      undefined,
      scenarioExecution && scenarioExecution.executedScenarios > 0 && !scenarioExecution.error
        ? `Executed ${scenarioExecution.executedScenarios} scenario${scenarioExecution.executedScenarios === 1 ? "" : "s"} with ${scenarioExecution.navigations} navigations and ${scenarioExecution.screenshots} screenshots`
        : allScenarios.length === 0
          ? "Provider returned no executable browser scenarios"
          : scenarioExecution?.error ?? "Playwright did not complete any scenario",
    );

    // ── Step 7: Accessibility & keyboard-only ────────────
    callbacks.onPhaseChange("testing", personaProfile.phaseMessages.accessibility);
    await updateStep(steps, 6, "running", callbacks, undefined, `Using ${browserSession.label}`);

    out(`\n> Running real keyboard-only navigation test...\n`);
    const a11yResult = await testAccessibility(context, settings, out);
    execution.browserSessions += a11yResult.browserSessions;
    execution.navigations += a11yResult.navigations;
    execution.screenshots += a11yResult.screenshots;
    recordFindings(a11yResult.findings);

    out(`\n> ${settings.provider}: ${personaProfile.outputMessages.accessibility}\n\n`);
    const a11yAiResult = await streamAnalyze(context, [
      { role: "system", content: buildSystemPrompt(persona, memory) },
      { role: "user", content: buildAccessibilityPrompt(context, pageMap) },
    ]);
    recordFindings(parseFindings(a11yAiResult));

    await updateStep(
      steps,
      6,
      a11yResult.completed && !a11yResult.error ? "passed" : "failed",
      callbacks,
      undefined,
      a11yResult.completed && !a11yResult.error
        ? `Verified keyboard navigation with ${a11yResult.navigations} navigation and ${a11yResult.screenshots} screenshot`
        : a11yResult.error ?? "Accessibility browser check did not complete",
    );

    // ── Step 8: Generate report ────────────────────────
    callbacks.onPhaseChange("reporting", "Generating report...");
    await updateStep(steps, 7, "running", callbacks);

    execution.evidenceMet = execution.navigations > 0 && execution.screenshots > 0;

    const failedSteps = steps.filter((step) => step.status === "failed");
    if (failedSteps.length > 0) {
      callbacks.onLog(`Steps incomplete: ${failedSteps.map((s) => s.name).join(", ")}`);
    }
    if (!execution.evidenceMet) {
      callbacks.onLog(`Low browser evidence: ${execution.navigations} navigations, ${execution.screenshots} screenshots`);
    }

    const report: TestReport = {
      id: runId,
      timestamp: new Date().toISOString(),
      provider: settings.provider,
      context,
      findings,
      execution,
      summary: {
        totalTests: steps.length,
        passed: steps.filter((s) => s.status === "passed").length,
        failed: findings.filter((f) => f.severity === "critical" || f.severity === "high").length,
        warnings: findings.filter((f) => f.severity === "medium" || f.severity === "low").length,
        duration: Date.now() - startTime,
      },
      notes: [notes],
    };

    await saveReport(context.reportDir, report);
    out(`\n> Report saved: ${report.id}.json\n`);
    out(`> Browser evidence: ${execution.navigations} navigation${execution.navigations === 1 ? "" : "s"}, ${execution.screenshots} screenshot${execution.screenshots === 1 ? "" : "s"}\n`);

    // ── Update memory ────────────────────────────────
    out(`> Updating app memory...\n`);
    try {
      const memoryUpdate = await streamAnalyze(context, [
        { role: "system", content: buildMemoryPrompt() },
        { role: "user", content: buildMemoryUpdateRequest(context, memory, report, projectInfo) },
      ]);
      const updatedMemory = extractMemoryContent(memoryUpdate);
      if (updatedMemory) {
        await saveMemory(projectPath, updatedMemory);
        out(`> Memory saved to .getwired/memory.md\n`);
      }
    } catch {
      out(`> Memory update skipped (non-critical)\n`);
    }

    await updateStep(steps, 7, "passed", callbacks);

    callbacks.onPhaseChange("done", "Testing complete!");
    return report;
  } catch (err) {
    out(`\n! Error: ${String(err)}\n`);
    callbacks.onPhaseChange("error", `Error: ${err}`);
    throw err;
  }
}

const BASE_SYSTEM_PROMPT = `You are GetWired — a senior QA engineer with 15 years of experience who tests web apps the way a skeptical, thorough human would. You don't just verify that things work; you actively try to make them fail.

Your testing personality:
- You click things a normal user wouldn't think to click
- You paste garbage into every input field you find
- You submit forms with missing fields, wrong formats, absurd values
- You hit the back button at the worst possible time
- You double-click submit buttons, mash Enter, rapid-fire actions
- You try URLs that shouldn't exist, parameters that don't belong
- You resize the browser mid-action to see what breaks
- You disable JavaScript mentally and ask "what if this didn't load?"
- You think "what would happen if the API returned an error right here?"
- You navigate away mid-form, return, and check if state is preserved
- You look for things that "technically work but feel broken"

You are NOT a scanner or automated tool. You are a person sitting at a computer, using the app, and reporting what feels wrong.

CRITICAL RULE: You are READ-ONLY. You must NEVER create, modify, delete, or write to any project file. Do not use file editing tools, do not create files, do not run commands that modify the filesystem. Your only job is to observe, test, and report findings. The only files GetWired writes are inside the .getwired/ folder — and that is handled by the tool itself, not by you.

When you return findings, use this JSON format:
[{ "id": "unique-id", "severity": "critical|high|medium|low|info", "category": "functional|ui-regression|accessibility|performance|security|console-error", "title": "Short description", "description": "Detailed explanation of what happened and why it matters", "steps": ["Step 1", "Step 2"], "url": "page where it happened", "device": "desktop|mobile" }]

When you return interaction scenarios, use this JSON format:
[{ "name": "Scenario name", "category": "happy-path|edge-case|abuse|boundary|error-recovery", "actions": [{ "type": "navigate|click|fill|select|scroll|wait|screenshot|keyboard", "selector": "CSS selector", "value": "text to type or URL", "url": "for navigate actions", "key": "for keyboard actions like Tab, Enter, Escape", "description": "What a human tester would say they're doing" }] }]`;

const PERSONA_PROMPT_APPENDIX: Record<TestPersona, string> = {
  standard: `Mode: Standard testing.
Keep a balanced QA mindset. Cover obvious flows first, then escalate into meaningful abuse and edge cases.`,
  hacky: `Mode: Hacky testing.
Behave like a curious, persistent tester with no privileged access. Stay inside what a browser user can do by navigating, clicking, typing, reloading, editing URLs, query params, hashes, form inputs, and normal browser actions. Focus on exposed admin paths, insecure object references, role leaks, missing guards, unprotected actions, confusing state transitions, and places where the app reveals too much or lets a normal visitor do too much.
Do not assume shell access, stolen credentials, direct database access, or hidden APIs that a browser user cannot reach.`,
  "old-man": `Mode: Old Man Test.
Simulate an older, non-technical user who is trying sincerely to use the app but is hesitant, literal, and easily confused. Move slower, prefer the obvious button, misread labels, distrust jargon, and notice anything unclear or intimidating. Report what felt easy, what was confusing, what wording was hard to understand, and what would make this person give up or call someone for help.`,
};

interface PersonaProfile {
  stepNames: string[];
  phaseMessages: {
    planning: string;
    scenarios: string;
    accessibility: string;
  };
  outputMessages: {
    planning: string;
    scenarios: string;
    accessibility: string;
  };
}

const PERSONA_PROFILES: Record<TestPersona, PersonaProfile> = {
  standard: {
    stepNames: [
      "Scan project structure",
      "Load project context & notes",
      "Reconnaissance & test planning",
      "First impression & screenshots",
      "Compare with baselines",
      "Execute test scenarios",
      "Accessibility & keyboard-only",
      "Generate report",
    ],
    phaseMessages: {
      planning: "Exploring the site like a human tester...",
      scenarios: "Running AI-planned test scenarios...",
      accessibility: "Testing accessibility like a real user...",
    },
    outputMessages: {
      planning: "exploring the site and planning test scenarios...",
      scenarios: "generating and executing all test scenarios...",
      accessibility: "deep accessibility analysis...",
    },
  },
  hacky: {
    stepNames: [
      "Scan project structure",
      "Load project context & notes",
      "Reconnaissance & test planning",
      "First impression & screenshots",
      "Compare with baselines",
      "Execute test scenarios",
      "Accessibility & keyboard-only",
      "Generate report",
    ],
    phaseMessages: {
      planning: "Mapping the surface like a skeptical browser user...",
      scenarios: "Probing, tampering, and testing boundaries...",
      accessibility: "Checking if rough UX hides exploitable cracks...",
    },
    outputMessages: {
      planning: "mapping routes, forms, and weak spots...",
      scenarios: "probing flows, trying bypasses, and pushing boundaries...",
      accessibility: "checking whether rough UX hides risky behavior...",
    },
  },
  "old-man": {
    stepNames: [
      "Scan project structure",
      "Load project context & notes",
      "First-time user orientation",
      "First impression & screenshots",
      "Compare with baselines",
      "Execute test scenarios",
      "Accessibility & readability",
      "Generate report",
    ],
    phaseMessages: {
      planning: "Approaching the site like a hesitant first-time user...",
      scenarios: "Trying tasks, getting confused, and recovering...",
      accessibility: "Checking readability and comfort for a low-tech user...",
    },
    outputMessages: {
      planning: "looking around carefully and trying to understand the site...",
      scenarios: "trying tasks slowly, getting confused, and testing clarity...",
      accessibility: "checking readability, clarity, and comfort...",
    },
  },
};

function buildSystemPrompt(persona: TestPersona, memory?: string): string {
  return `${BASE_SYSTEM_PROMPT}

${PERSONA_PROMPT_APPENDIX[persona]}${memory ? `

── App Memory (from previous test sessions) ──
This is what you already know about this app from prior testing. Use this to:
- **Prioritize Key Areas** listed at the top — these are ranked by importance and fragility
- **Regression-check known bugs** — verify if they're fixed or still present
- **Skip re-learning** — you already know the app structure, pages, forms, and navigation
- **Hit fragile areas harder** — they broke before, they'll break again
- **Use remembered selectors and timing tips** — don't waste time guessing

${memory}` : ""}`;
}

function getPersonaProfile(persona: TestPersona): PersonaProfile {
  return PERSONA_PROFILES[persona];
}

// ─── Prompt builders ───────────────────────────────────────

function buildReconPrompt(context: TestContext, projectInfo: string, notes: string, pageMap: string): string {
  return `You are about to test this website. Before writing any test scenarios, analyze what's actually here and create a focused test strategy.

URL: ${context.url ?? "not provided"}
Device: ${context.deviceProfile}
Persona: ${getPersonaLabel(context.persona)}
Scope: ${context.scope ?? "full — test everything you can find"}
${context.commitId ? `Changes since commit: ${context.commitId}` : ""}
${context.prId ? `Testing PR #${context.prId}` : ""}

Project info:
${projectInfo}

${notes ? `Previous tester notes:\n${notes}` : ""}

${pageMap ? `I crawled the site and found these pages, links, and forms:\n${pageMap}` : ""}

Persona guidance:
${getPersonaPromptGuidance(context.persona, "recon")}

Based on what you can see in the site map above, answer these questions in plain text (NOT JSON):

1. **What's actually here?** — List the real pages, forms, interactive elements, and flows you can see. Don't speculate about things that might exist.
2. **What are the highest-value test targets?** — Which features are most likely to have bugs? Which flows matter most to users? Rank by risk and importance.
3. **What testing angles make sense for THIS specific site?** — Based on what exists (not a generic checklist), which categories of testing apply? Skip categories that have no targets on this site.
4. **What should we NOT waste time on?** — If the site has no forms, say so. If there's only one page, say so. If there are no auth flows, say so.
5. **How many scenarios do we need?** — A simple landing page needs 3-5. A complex app with forms, auth, and multiple pages might need 10-15. Be honest about the site's complexity.

Return your analysis as plain text with clear sections. Do NOT return JSON. The next step will use your analysis to generate specific test scenarios.`;
}

function buildAllScenariosPrompt(context: TestContext, testPlan: string, pageMap: string): string {
  const persona = context.persona ?? "standard";

  const baseInfo = `URL: ${context.url}
Device: ${context.deviceProfile}
Persona: ${getPersonaLabel(context.persona)}

${pageMap ? `Site map (actual elements on the page):\n${pageMap}\n` : ""}

Your earlier analysis of this site:
${testPlan.slice(0, 4000)}`;

  const personaFocus = persona === "old-man"
    ? `You are testing as an older, low-tech user. Focus on:
- Core tasks: try the most obvious actions slowly, favoring big buttons and plain wording
- Confusion: where labels are ambiguous, icons lack text, success/error states are unclear
- Recovery: what happens when you click the wrong thing, hit back, or get lost
- Trust: slow feedback, scary-sounding actions, tiny text, jargon`
    : persona === "hacky"
    ? `You are testing as a skeptical but unprivileged browser user. Focus on:
- Probing: try routes that shouldn't be public, manipulate URL params and IDs
- Tampering: submit forms with malicious or malformed input
- State abuse: refresh mid-action, resubmit, back/forward to find stale state
- Information leaks: error messages, disabled controls, hidden elements that reveal too much`
    : `You are a thorough QA tester. Focus on:
- Happy paths: the core flows real users complete
- Abuse: what breaks when you submit garbage, navigate to bad URLs, or spam actions
- Edge cases: boundary values, empty/overflow states, timing, responsive breakpoints
- Error recovery: what happens when things go wrong and the user tries to recover`;

  return `Now generate the actual Playwright test scenarios for this site. Use your earlier analysis — you already identified what's here and what's worth testing.

${baseInfo}

${personaFocus}

CRITICAL — read your analysis above and follow it:
- Your analysis already identified what's on this site and what to skip. FOLLOW THAT. If you said "no forms exist," do not generate form-testing scenarios. If you said "simple landing page," generate 3-5 scenarios, not 15.
- Every scenario must target a SPECIFIC element, page, or flow from the site map. Reference actual links, buttons, forms, and selectors you can see above.
- Each scenario must test something genuinely different. If two scenarios would click the same button and fill the same form, merge them or drop one.
- Order scenarios by how likely they are to find real bugs. Happy paths first (most likely to catch regressions), then targeted abuse of specific features.

Return as a JSON array of interaction scenarios:
[{ "name": "...", "category": "happy-path|edge-case|abuse|boundary|error-recovery", "actions": [{ "type": "navigate|click|fill|select|scroll|wait|screenshot|keyboard|assert", "selector": "CSS selector", "value": "...", "url": "...", "key": "...", "description": "What you're doing and why" }] }]

Use 3-8 actions per scenario. Use CSS selectors from the site map (prefer visible text, roles, placeholders over fragile IDs). Start each scenario with a navigate action.`;
}

function buildAccessibilityPrompt(context: TestContext, pageMap: string): string {
  return `Test this site's accessibility as if you personally depend on assistive technology.

URL: ${context.url}
Device: ${context.deviceProfile}
Persona: ${getPersonaLabel(context.persona)}

${pageMap ? `Site map:\n${pageMap}\n` : ""}

Persona guidance:
${getPersonaPromptGuidance(context.persona, "accessibility")}

Check these things that real users with disabilities encounter:

1. **Keyboard navigation** — Can I complete every flow without a mouse? Are there keyboard traps? Is focus visible?
2. **Screen reader** — Do images have alt text? Are form labels associated? Are dynamic changes announced?
3. **Visual** — Is contrast ratio at least 4.5:1 for text? Can I zoom to 200% without breaking layout? Are colors the only way information is conveyed?
4. **Motor** — Are click/touch targets at least 44x44px? Are there hover-only interactions with no alternative?
5. **Cognitive** — Are error messages clear? Is language simple? Are timeouts reasonable?

Don't give generic advice. Look at what's actually on this site and report specific failures.

Return findings as a JSON array with severity, category "accessibility", and specific steps to reproduce.`;
}

// ─── Memory prompts ──────────────────────────────────────

function buildMemoryPrompt(): string {
  return `You are a testing memory system. Your job is to maintain a concise, structured markdown file that captures everything important about a web app across test sessions.

CRITICAL: You are READ-ONLY. Do NOT use any file editing tools. Do NOT create, modify, or delete any files. Just return the memory content as text in your response.

Write in present tense. Be specific and factual. This memory will be read by an AI tester in future sessions to avoid re-learning the app from scratch.

The memory file MUST always start with a header block in exactly this format:

\`\`\`
# App Name
url: https://the-app-url.com
last_tested: YYYY-MM-DD

## Key Areas
- area 1: short description
- area 2: short description
\`\`\`

The url field is critical — it is used to automatically connect to the app in future sessions without the user having to type it.

The Key Areas section lists the most important parts of the app to focus testing on, in priority order. Update this based on what you learn — areas that break often should be higher.

Return ONLY the updated markdown content between \`\`\`memory and \`\`\` fences. No other text.`;
}

function buildMemoryUpdateRequest(
  context: TestContext,
  existingMemory: string,
  report: TestReport,
  projectInfo: string,
): string {
  const findingSummary = report.findings
    .map((f) => `- [${f.severity}] ${f.title}: ${f.description.slice(0, 150)}`)
    .join("\n");

  return `Update the app memory based on this test session.

${existingMemory ? `## Current Memory\n${existingMemory}\n` : "## No existing memory — create it from scratch.\n"}

## This Session
- URL: ${context.url}
- Date: ${new Date().toISOString().split("T")[0]}
- Persona: ${context.persona ?? "standard"}
- Device: ${context.deviceProfile}
- Tests: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings
- Duration: ${Math.round(report.summary.duration / 1000)}s

## Project Info
${projectInfo}

## Findings This Session
${findingSummary || "No findings."}

## Required structure
The memory MUST start with this header (fill in real values):

\`\`\`
# App Name
url: ${context.url}
last_tested: ${new Date().toISOString().split("T")[0]}

## Key Areas
- (list the most important areas to test, ranked by how often they break or how critical they are)
\`\`\`

Then include these sections as needed:
- **App structure**: What pages exist, main navigation, key features, routes discovered
- **Tech stack**: Framework, notable libraries, API patterns
- **Known bugs**: Issues found that are still present (remove if fixed in a later session)
- **Fixed bugs**: Issues from previous sessions that are no longer reproducible — note the date fixed
- **Fragile areas**: Parts of the app that tend to break or behave inconsistently
- **Forms & inputs**: What forms exist, validation behavior, edge cases observed
- **Auth & permissions**: Login flows, protected routes, role differences if any
- **Performance notes**: Slow pages, heavy loads, timeout-prone areas
- **Accessibility issues**: Persistent a11y problems
- **Testing tips**: Selectors that work reliably, timing quirks, workarounds

Keep it under 200 lines. Merge new findings with existing knowledge — don't just append. Remove outdated info.`;
}

function extractMemoryContent(response: string): string | null {
  const match = response.match(/```memory\s*\n([\s\S]*?)```/);
  if (match) return match[1].trim();
  // Fallback: if the response is mostly markdown without fences, use it directly
  const lines = response.trim().split("\n");
  if (lines.length >= 3 && lines[0].startsWith("#")) {
    return response.trim();
  }
  return null;
}

function getPersonaLabel(persona: TestPersona | undefined): string {
  switch (persona ?? "standard") {
    case "hacky": return "Hacky Testing";
    case "old-man": return "Old Man Test";
    default: return "Standard Testing";
  }
}

function getPersonaPromptGuidance(
  persona: TestPersona | undefined,
  stage: "recon" | "happy" | "accessibility",
): string {
  switch (persona ?? "standard") {
    case "hacky":
      if (stage === "happy") {
        return `Treat "happy path" as "obvious path a curious user would try first." Prefer flows that reveal permissions, account boundaries, hidden state, unprotected actions, and route protection gaps.`;
      }
      if (stage === "accessibility") {
        return `Keep the accessibility check practical: highlight confusing or inaccessible UI that also increases the risk of mistaken actions, hidden warnings, or unsafe destructive behavior.`;
      }
      return `Think like a skeptical but unprivileged browser user. The goal is to find holes, exposed surfaces, and broken assumptions without leaving normal web navigation and form interaction.`;
    case "old-man":
      if (stage === "happy") {
        return `Pick the most obvious flows and move through them slowly. Favor the biggest buttons, the plainest wording, and common expectations. Note every place where the user has to stop and think.`;
      }
      if (stage === "accessibility") {
        return `Emphasize readability, contrast, text size, cognitive load, predictable navigation, obvious confirmation states, and whether this person can trust what they just did.`;
      }
      return `Simulate a sincere older person who is not comfortable with technology. They want to succeed, but they are literal, patient, confused by jargon, and easily thrown off by ambiguous UI.`;
    default:
      return `Use the normal skeptical QA mindset: balanced coverage of obvious flows, realistic mistakes, abuse cases, and edge conditions.`;
  }
}

// ─── Site crawler — discover what's on the page ────────────
async function crawlSiteMap(url: string, out: (text: string) => void, _showBrowser: boolean): Promise<string> {
  try {
    const { chromium } = await import("playwright");
    // Always headless — this is just data collection, no need to show the browser
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

    const siteInfo = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href]"))
        .map((a) => ({ text: a.textContent?.trim().slice(0, 50), href: (a as HTMLAnchorElement).href }))
        .filter((l) => l.text && l.href && !l.href.startsWith("javascript:"))
        .slice(0, 50);

      const forms = Array.from(document.querySelectorAll("form")).map((form) => {
        const inputs = Array.from(form.querySelectorAll("input, textarea, select")).map((el) => ({
          tag: el.tagName.toLowerCase(),
          type: (el as HTMLInputElement).type || "text",
          name: (el as HTMLInputElement).name || (el as HTMLInputElement).placeholder || "",
          required: (el as HTMLInputElement).required,
          placeholder: (el as HTMLInputElement).placeholder || "",
        }));
        const buttons = Array.from(form.querySelectorAll("button, input[type=submit]"))
          .map((b) => b.textContent?.trim() || (b as HTMLInputElement).value || "Submit");
        return { action: form.action, method: form.method, inputs, buttons };
      });

      const buttons = Array.from(document.querySelectorAll("button:not(form button)"))
        .map((b) => ({ text: b.textContent?.trim().slice(0, 50), disabled: (b as HTMLButtonElement).disabled }))
        .filter((b) => b.text)
        .slice(0, 30);

      const inputs = Array.from(document.querySelectorAll("input:not(form input), textarea:not(form textarea)"))
        .map((el) => ({
          type: (el as HTMLInputElement).type || "text",
          name: (el as HTMLInputElement).name || (el as HTMLInputElement).placeholder || "",
          placeholder: (el as HTMLInputElement).placeholder || "",
        }))
        .slice(0, 20);

      const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
        .map((h) => ({ level: h.tagName, text: h.textContent?.trim().slice(0, 80) }))
        .slice(0, 20);

      const images = Array.from(document.querySelectorAll("img"))
        .map((img) => ({ src: (img as HTMLImageElement).src?.slice(0, 80), alt: (img as HTMLImageElement).alt }))
        .slice(0, 20);

      return { title: document.title, links, forms, buttons, inputs, headings, images };
    });

    await browser.close();

    const lines: string[] = [];
    lines.push(`Page title: ${siteInfo.title}`);

    if (siteInfo.headings.length > 0) {
      lines.push(`\nHeadings:`);
      for (const h of siteInfo.headings) lines.push(`  ${h.level}: ${h.text}`);
    }

    if (siteInfo.links.length > 0) {
      lines.push(`\nLinks (${siteInfo.links.length}):`);
      for (const l of siteInfo.links) lines.push(`  "${l.text}" -> ${l.href}`);
    }

    if (siteInfo.forms.length > 0) {
      lines.push(`\nForms (${siteInfo.forms.length}):`);
      for (const f of siteInfo.forms) {
        lines.push(`  Form: ${f.method.toUpperCase()} ${f.action}`);
        for (const inp of f.inputs) {
          lines.push(`    <${inp.tag} type="${inp.type}" name="${inp.name}" ${inp.required ? "REQUIRED" : ""} placeholder="${inp.placeholder}">`);
        }
        lines.push(`    Buttons: ${f.buttons.join(", ")}`);
      }
    }

    if (siteInfo.buttons.length > 0) {
      lines.push(`\nStandalone buttons (${siteInfo.buttons.length}):`);
      for (const b of siteInfo.buttons) lines.push(`  [${b.disabled ? "DISABLED" : "active"}] "${b.text}"`);
    }

    if (siteInfo.inputs.length > 0) {
      lines.push(`\nStandalone inputs (${siteInfo.inputs.length}):`);
      for (const inp of siteInfo.inputs) lines.push(`  <input type="${inp.type}" placeholder="${inp.placeholder}">`);
    }

    if (siteInfo.images.length > 0) {
      const noAlt = siteInfo.images.filter((i) => !i.alt);
      lines.push(`\nImages: ${siteInfo.images.length} total, ${noAlt.length} missing alt text`);
    }

    const result = lines.join("\n");
    out(`  Found: ${siteInfo.links.length} links, ${siteInfo.forms.length} forms, ${siteInfo.buttons.length} buttons\n`);
    return result;
  } catch (err) {
    out(`  ! Crawl failed: ${String(err).slice(0, 80)}\n`);
    return "";
  }
}

// ─── Execute interaction scenarios via Playwright ──────────
async function executeScenarios(
  scenarios: InteractionScenario[],
  context: TestContext,
  settings: GetwiredSettings,
  out: (text: string) => void,
): Promise<ScenarioExecutionResult> {
  const findings: TestFinding[] = [];
  const stats: ScenarioExecutionResult = {
    findings,
    browserSessions: 0,
    navigations: 0,
    screenshots: 0,
    executedScenarios: 0,
  };

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch(getBrowserSession(settings.testing.showBrowser).launchOptions);
    stats.browserSessions++;

    for (const scenario of scenarios) {
      out(`\n  ── ${scenario.category}: ${scenario.name} ──\n`);
      const page = await browser.newPage({
        viewport: settings.testing.viewports.desktop,
      });
      const consoleErrors: string[] = [];
      const networkErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => {
        consoleErrors.push(err.message);
      });
      page.on("response", (res) => {
        if (res.status() >= 500) {
          networkErrors.push(`${res.status()} ${res.url()}`);
        }
      });

      let currentUrl = context.url ?? "";
      let stepFailed = false;
      let navigationOccurred = false;

      if (context.url) {
        await page.goto(context.url, { waitUntil: "domcontentloaded", timeout: 15_000 });
        currentUrl = page.url();
        stats.navigations++;
        navigationOccurred = true;
      }

      for (const action of scenario.actions) {
        if (stepFailed) break;
        out(`    ${action.description}\n`);

        try {
          switch (action.type) {
            case "navigate": {
              const target = action.url ?? action.value ?? context.url ?? "";
              // Resolve relative URLs
              const resolvedUrl = target.startsWith("http") ? target : new URL(target, currentUrl).href;
              await page.goto(resolvedUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });
              currentUrl = page.url();
              stats.navigations++;
              navigationOccurred = true;
              break;
            }
            case "click": {
              if (action.selector) {
                const el = page.locator(action.selector).first();
                await el.click({ timeout: 5_000 }).catch(async () => {
                  // Try by text content as fallback
                  if (action.value) {
                    await page.getByText(action.value, { exact: false }).first().click({ timeout: 5_000 });
                  }
                });
              }
              break;
            }
            case "fill": {
              if (action.selector) {
                const selector = action.selector;
                const el = page.locator(selector).first();
                await el.fill(action.value ?? "", { timeout: 5_000 }).catch(async () => {
                  // Try by placeholder as fallback
                  if (action.value !== undefined) {
                    const byPlaceholder = page.getByPlaceholder(selector.replace(/[[\]"']/g, "")).first();
                    await byPlaceholder.fill(action.value, { timeout: 3_000 });
                  }
                });
              }
              break;
            }
            case "select": {
              if (action.selector && action.value) {
                await page.locator(action.selector).first().selectOption(action.value, { timeout: 5_000 });
              }
              break;
            }
            case "keyboard": {
              if (action.key) {
                await page.keyboard.press(action.key);
              }
              break;
            }
            case "scroll": {
              const distance = parseInt(action.value ?? "500", 10);
              await page.evaluate((d) => window.scrollBy(0, d), distance);
              break;
            }
            case "wait": {
              const ms = parseInt(action.value ?? "1000", 10);
              await page.waitForTimeout(Math.min(ms, 5000));
              break;
            }
            case "screenshot": {
              const screenshotPath = join(
                context.reportDir, "screenshots",
                `${scenario.name.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 40)}-${Date.now()}.png`,
              );
              await mkdir(join(context.reportDir, "screenshots"), { recursive: true });
              await page.screenshot({ path: screenshotPath, fullPage: false });
              stats.screenshots++;
              out(`      [screenshot saved: ${toProjectRelativePath(context.projectPath, screenshotPath)}]\n`);
              break;
            }
            case "assert": {
              // Check if something expected is visible or absent
              if (action.selector) {
                const visible = await page.locator(action.selector).first().isVisible({ timeout: 3_000 }).catch(() => false);
                if (!visible && action.value === "visible") {
                  findings.push({
                    id: `assert-${generateId()}`,
                    severity: "medium",
                    category: "functional",
                    title: `Expected element not visible: ${action.selector}`,
                    description: `During "${scenario.name}": ${action.description}`,
                    url: page.url(),
                    steps: scenario.actions.map((a) => a.description),
                  });
                }
              }
              break;
            }
          }
        } catch (err) {
          const errMsg = String(err).slice(0, 150);
          out(`      ! Action failed: ${errMsg}\n`);

          // A failed action during an abuse/edge-case test isn't necessarily a bug —
          // if the site properly blocks it, that's good. But if it's a crash or
          // unhandled error, it's a finding.
          if (scenario.category === "happy-path") {
            findings.push({
              id: `scenario-${generateId()}`,
              severity: "high",
              category: "functional",
              title: `Happy path broken: ${action.description}`,
              description: `During "${scenario.name}": ${errMsg}`,
              url: page.url(),
              device: "desktop",
              steps: scenario.actions.map((a) => a.description),
            });
            stepFailed = true;
          }
        }
      }

      // Check if any console errors or 500s happened during this scenario
      if (consoleErrors.length > 0) {
        findings.push({
          id: `console-${generateId()}`,
          severity: scenario.category === "abuse" ? "medium" : "high",
          category: "console-error",
          title: `Console errors during: ${scenario.name}`,
          description: consoleErrors.slice(0, 5).join("\n"),
          url: page.url(),
          steps: scenario.actions.map((a) => a.description),
        });
        out(`      ! ${consoleErrors.length} console error(s)\n`);
      }

      if (networkErrors.length > 0) {
        findings.push({
          id: `network-${generateId()}`,
          severity: "high",
          category: "functional",
          title: `Server errors (5xx) during: ${scenario.name}`,
          description: networkErrors.join("\n"),
          url: page.url(),
          steps: scenario.actions.map((a) => a.description),
        });
        out(`      ! ${networkErrors.length} server error(s)\n`);
      }

      // Take a final screenshot of the state after this scenario
      try {
        const finalPath = join(
          context.reportDir, "screenshots",
          `${scenario.category}-${scenario.name.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30)}-final.png`,
        );
        await mkdir(join(context.reportDir, "screenshots"), { recursive: true });
        await page.screenshot({ path: finalPath, fullPage: false });
        stats.screenshots++;
      } catch { /* page may have navigated away */ }

      if (navigationOccurred) {
        stats.executedScenarios++;
      }
      await page.close();
    }

    await browser.close();
  } catch (err) {
    const error = `Browser execution failed: ${String(err).slice(0, 120)}`;
    stats.error = error;
    out(`\n! ${error}\n`);
  }

  return stats;
}

// ─── Real accessibility testing via Playwright ─────────────
async function testAccessibility(
  context: TestContext,
  settings: GetwiredSettings,
  out: (text: string) => void,
): Promise<AccessibilityExecutionResult> {
  const findings: TestFinding[] = [];
  const result: AccessibilityExecutionResult = {
    findings,
    browserSessions: 0,
    navigations: 0,
    screenshots: 0,
    completed: false,
  };
  if (!context.url) return result;

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch(getBrowserSession(settings.testing.showBrowser).launchOptions);
    result.browserSessions++;
    const page = await browser.newPage({ viewport: settings.testing.viewports.desktop });
    await page.goto(context.url, { waitUntil: "networkidle", timeout: 30_000 });
    result.navigations++;

    // Tab through the entire page and check focus visibility
    out(`  Tabbing through the page...\n`);
    let tabCount = 0;
    let focusTraps = 0;
    let invisibleFocus = 0;
    const seenElements = new Set<string>();

    for (let i = 0; i < 50; i++) {
      await page.keyboard.press("Tab");
      tabCount++;

      const focusInfo = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;

        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        const outlineVisible = styles.outline !== "none" && styles.outline !== "" && styles.outlineWidth !== "0px";
        const boxShadowVisible = styles.boxShadow !== "none" && styles.boxShadow !== "";
        const bgChanged = styles.backgroundColor !== "rgba(0, 0, 0, 0)";

        return {
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 30) ?? "",
          visible: rect.width > 0 && rect.height > 0,
          focusIndicatorVisible: outlineVisible || boxShadowVisible || bgChanged,
          role: el.getAttribute("role"),
          ariaLabel: el.getAttribute("aria-label"),
        };
      });

      if (!focusInfo) continue;

      const key = `${focusInfo.tag}-${focusInfo.text}`;
      if (seenElements.has(key)) {
        focusTraps++;
        if (focusTraps > 3) {
          out(`    ! Focus trap detected — stuck in a loop\n`);
          findings.push({
            id: `a11y-focus-trap`,
            severity: "high",
            category: "accessibility",
            title: "Keyboard focus trap detected",
            description: `Tab key gets stuck cycling between the same elements, preventing keyboard users from navigating the full page.`,
            url: context.url,
          });
          break;
        }
      }
      seenElements.add(key);

      if (!focusInfo.focusIndicatorVisible) {
        invisibleFocus++;
      }
    }

    if (invisibleFocus > 3) {
      out(`    ! ${invisibleFocus} elements with invisible focus indicator\n`);
      findings.push({
        id: `a11y-focus-invisible`,
        severity: "medium",
        category: "accessibility",
        title: `${invisibleFocus} interactive elements have no visible focus indicator`,
        description: `Keyboard users can't see where they are on the page. ${invisibleFocus} elements received focus but had no visible outline, box-shadow, or background change.`,
        url: context.url,
      });
    }

    out(`  Tabbed through ${tabCount} elements, ${seenElements.size} unique\n`);

    // Check images for alt text
    const imgIssues = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("img"))
        .filter((img) => !img.alt && img.getBoundingClientRect().width > 1)
        .map((img) => (img as HTMLImageElement).src?.slice(0, 80))
        .slice(0, 10);
    });

    if (imgIssues.length > 0) {
      out(`    ! ${imgIssues.length} images missing alt text\n`);
      findings.push({
        id: `a11y-alt-text`,
        severity: "medium",
        category: "accessibility",
        title: `${imgIssues.length} images missing alt text`,
        description: `Screen reader users won't know what these images show:\n${imgIssues.join("\n")}`,
        url: context.url,
      });
    }

    // Check for form labels
    const unlabeledInputs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input, textarea, select"))
        .filter((el) => {
          const id = el.id;
          const hasLabel = id && document.querySelector(`label[for="${id}"]`);
          const hasAriaLabel = el.getAttribute("aria-label");
          const hasAriaLabelledBy = el.getAttribute("aria-labelledby");
          const wrappedInLabel = el.closest("label");
          const hasPlaceholder = (el as HTMLInputElement).placeholder;
          return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !wrappedInLabel && !hasPlaceholder;
        })
        .map((el) => `<${el.tagName.toLowerCase()} type="${(el as HTMLInputElement).type}" name="${(el as HTMLInputElement).name}">`)
        .slice(0, 10);
    });

    if (unlabeledInputs.length > 0) {
      out(`    ! ${unlabeledInputs.length} form inputs with no label\n`);
      findings.push({
        id: `a11y-labels`,
        severity: "medium",
        category: "accessibility",
        title: `${unlabeledInputs.length} form inputs without accessible labels`,
        description: `These inputs have no label, aria-label, or placeholder:\n${unlabeledInputs.join("\n")}`,
        url: context.url,
      });
    }

    // Check touch target sizes (mobile)
    if (context.deviceProfile !== "desktop") {
      const smallTargets = await page.evaluate(() => {
        const interactive = document.querySelectorAll("a, button, input, select, textarea, [role=button], [tabindex]");
        return Array.from(interactive)
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
          })
          .map((el) => ({
            tag: el.tagName,
            text: el.textContent?.trim().slice(0, 30),
            width: Math.round(el.getBoundingClientRect().width),
            height: Math.round(el.getBoundingClientRect().height),
          }))
          .slice(0, 10);
      });

      if (smallTargets.length > 0) {
        out(`    ! ${smallTargets.length} touch targets smaller than 44px\n`);
        findings.push({
          id: `a11y-touch-targets`,
          severity: "medium",
          category: "accessibility",
          title: `${smallTargets.length} touch targets too small for mobile`,
          description: `These elements are smaller than the 44x44px minimum:\n${smallTargets.map((t) => `${t.tag} "${t.text}" (${t.width}x${t.height}px)`).join("\n")}`,
          url: context.url,
          device: "mobile",
        });
      }
    }

    try {
      const screenshotPath = join(
        context.reportDir,
        "screenshots",
        `accessibility-${Date.now().toString(36)}.png`,
      );
      await mkdir(join(context.reportDir, "screenshots"), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: false });
      result.screenshots++;
      out(`  Accessibility screenshot: ${toProjectRelativePath(context.projectPath, screenshotPath)}\n`);
    } catch {
      out("  ! Accessibility screenshot failed\n");
    }

    result.completed = true;
    await browser.close();
  } catch (err) {
    const error = `Accessibility test failed: ${String(err).slice(0, 80)}`;
    result.error = error;
    out(`  ! ${error}\n`);
  }

  return result;
}

// ─── Helpers ───────────────────────────────────────────────

async function scanProject(projectPath: string, context: TestContext): Promise<string> {
  const info: string[] = [];

  const pkgPath = join(projectPath, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
    info.push(`Project: ${pkg.name ?? "unknown"}`);
    info.push(`Dependencies: ${Object.keys(pkg.dependencies ?? {}).join(", ")}`);
    info.push(`Dev deps: ${Object.keys(pkg.devDependencies ?? {}).join(", ")}`);
  }

  const frameworkFiles = [
    "next.config.js", "next.config.ts", "next.config.mjs",
    "vite.config.ts", "nuxt.config.ts", "svelte.config.js",
    "angular.json", "astro.config.mjs",
  ];
  for (const f of frameworkFiles) {
    if (existsSync(join(projectPath, f))) {
      info.push(`Framework config: ${f}`);
    }
  }

  if (context.commitId) {
    try {
      const diff = execSync(`git diff ${context.commitId}...HEAD --stat`, {
        cwd: projectPath, encoding: "utf-8",
      });
      info.push(`Changes since ${context.commitId}:\n${diff}`);
    } catch { /* not a git repo or invalid commit */ }
  }

  if (context.prId) {
    try {
      const prInfo = execSync(`gh pr view ${context.prId} --json title,body,files`, {
        cwd: projectPath, encoding: "utf-8",
      });
      info.push(`PR #${context.prId}:\n${prInfo}`);
    } catch { /* gh not available */ }
  }

  return info.join("\n");
}

async function loadProjectNotes(projectPath: string): Promise<string> {
  const notesDir = getNotesDir(projectPath);
  if (!existsSync(notesDir)) return "";

  const files = await readdir(notesDir);
  const notes: string[] = [];
  for (const file of files) {
    if (file.endsWith(".md") || file.endsWith(".txt")) {
      const content = await readFile(join(notesDir, file), "utf-8");
      notes.push(content);
    }
  }
  return notes.join("\n\n");
}

async function loadMemory(projectPath: string): Promise<string> {
  const memoryPath = getMemoryPath(projectPath);
  if (!existsSync(memoryPath)) return "";
  return await readFile(memoryPath, "utf-8");
}

async function saveMemory(projectPath: string, content: string): Promise<void> {
  const memoryPath = getMemoryPath(projectPath);
  await writeFile(memoryPath, content, "utf-8");
}

function parseMemoryUrl(memory: string): string | undefined {
  if (!memory) return undefined;
  // Match "url: http..." in the frontmatter-style header or anywhere in the first section
  const match = memory.match(/^url:\s*(https?:\/\/\S+)/im);
  return match?.[1];
}

async function compareWithBaselines(
  captures: Array<{ path: string; url: string; device: "desktop" | "mobile" }>,
  context: TestContext,
  settings: GetwiredSettings,
  provider: TestingProvider,
  callbacks: OrchestratorCallbacks,
): Promise<TestFinding[]> {
  const findings: TestFinding[] = [];

  for (const capture of captures) {
    const baselineDir = getBaselineDir(context.projectPath);
    if (!existsSync(baselineDir)) continue;

    const baselineFiles = await readdir(baselineDir);
    const matchingBaseline = baselineFiles.find(
      (f) => f.includes(capture.device) && capture.url.includes(f.split("-")[0]),
    );

    if (!matchingBaseline) {
      callbacks.onLog(`No baseline for ${capture.device} ${capture.url} — saving as new baseline`);
      continue;
    }

    const result = await compareScreenshots({
      baselinePath: join(baselineDir, matchingBaseline),
      currentPath: capture.path,
      outputDir: join(context.reportDir, "diffs"),
      threshold: settings.testing.diffThreshold,
    });

    if (result.isRegression) {
      callbacks.onLog(
        `UI change detected: ${(result.diffPercentage * 100).toFixed(1)}% pixels changed on ${capture.device}`,
      );

      const baselineB64 = await imageToBase64(result.baselinePath);
      const currentB64 = await imageToBase64(result.currentPath);
      const diffB64 = await imageToBase64(result.diffPath);

      const aiFindings = await provider.evaluateRegression(
        baselineB64, currentB64, diffB64, capture.url, capture.device,
      );

      findings.push(
        ...aiFindings.map((f) => ({
          ...f,
          screenshotPath: capture.path,
          diffScreenshotPath: result.diffPath,
        })),
      );
    }
  }

  return findings;
}

function parseScenarios(content: string): InteractionScenario[] {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (s) => s.name && Array.isArray(s.actions) && s.actions.length > 0,
        );
      }
    }
    return [];
  } catch {
    return [];
  }
}

function parseFindings(content: string): TestFinding[] {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    return [];
  }
}

function countPlanSteps(plan: string): number {
  // Plan is now plain text — count numbered items, bullet points, or section headers
  const numbered = plan.split("\n").filter((l) => l.trim().match(/^\d+\./)).length;
  const bulleted = plan.split("\n").filter((l) => l.trim().match(/^[-*]\s/)).length;
  return numbered || bulleted || 1;
}


async function updateStep(
  steps: TestStep[],
  index: number,
  status: TestStep["status"],
  callbacks: OrchestratorCallbacks,
  duration?: number,
  details?: string,
) {
  steps[index].status = status;
  if (duration !== undefined) steps[index].duration = duration;
  if (details !== undefined) steps[index].details = details;
  callbacks.onStepUpdate([...steps]);
}

function toProjectRelativePath(projectPath: string, targetPath: string): string {
  const relativePath = relative(projectPath, targetPath);
  return relativePath && !relativePath.startsWith("..") ? relativePath : targetPath;
}

function generateId(): string {
  return `gw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function saveReport(reportDir: string, report: TestReport): Promise<string> {
  await mkdir(reportDir, { recursive: true });
  const filePath = join(reportDir, `${report.id}.json`);
  await writeFile(filePath, JSON.stringify(report, null, 2));
  return filePath;
}

// ─── Auto-detect dev server URL ────────────────────────
interface FrameworkHint {
  files: string[];
  defaultPort: number;
}

const FRAMEWORK_HINTS: FrameworkHint[] = [
  { files: ["next.config.js", "next.config.ts", "next.config.mjs"], defaultPort: 3000 },
  { files: ["vite.config.ts", "vite.config.js", "vite.config.mjs"], defaultPort: 5173 },
  { files: ["nuxt.config.ts", "nuxt.config.js"], defaultPort: 3000 },
  { files: ["svelte.config.js"], defaultPort: 5173 },
  { files: ["astro.config.mjs", "astro.config.ts"], defaultPort: 4321 },
  { files: ["angular.json"], defaultPort: 4200 },
  { files: ["gatsby-config.js", "gatsby-config.ts"], defaultPort: 8000 },
  { files: ["remix.config.js", "remix.config.ts"], defaultPort: 3000 },
];

const COMMON_PORTS = [3000, 3001, 5173, 5174, 4200, 4321, 8000, 8080, 8888];

function isPortOpen(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host, timeout: 300 });
    socket.on("connect", () => { socket.destroy(); resolve(true); });
    socket.on("error", () => { resolve(false); });
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
  });
}

async function detectProjectUrl(projectPath: string): Promise<string | undefined> {
  // 1. Detect framework to prioritize its default port
  let priorityPort: number | undefined;
  for (const hint of FRAMEWORK_HINTS) {
    for (const file of hint.files) {
      if (existsSync(join(projectPath, file))) {
        priorityPort = hint.defaultPort;
        break;
      }
    }
    if (priorityPort) break;
  }

  // Also check for monorepo — look inside common app directories
  if (!priorityPort) {
    const appDirs = ["apps/web", "apps/frontend", "app", "web", "frontend", "client"];
    for (const dir of appDirs) {
      const dirPath = join(projectPath, dir);
      if (!existsSync(dirPath)) continue;
      for (const hint of FRAMEWORK_HINTS) {
        for (const file of hint.files) {
          if (existsSync(join(dirPath, file))) {
            priorityPort = hint.defaultPort;
            break;
          }
        }
        if (priorityPort) break;
      }
      if (priorityPort) break;
    }
  }

  // 2. Check priority port first, then all common ports
  const portsToCheck = priorityPort
    ? [priorityPort, ...COMMON_PORTS.filter((p) => p !== priorityPort)]
    : COMMON_PORTS;

  for (const port of portsToCheck) {
    if (await isPortOpen(port)) {
      return `http://localhost:${port}`;
    }
  }

  // 3. Try to parse port from package.json scripts
  try {
    const pkgPath = join(projectPath, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
      const devScript = pkg.scripts?.dev ?? pkg.scripts?.start ?? "";
      const portMatch = devScript.match(/(?:--port|-p)\s+(\d+)/);
      if (portMatch) {
        const customPort = parseInt(portMatch[1], 10);
        if (await isPortOpen(customPort)) {
          return `http://localhost:${customPort}`;
        }
      }
    }
  } catch { /* ignore parse errors */ }

  return undefined;
}
