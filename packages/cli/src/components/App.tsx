import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { Header } from "./Header.js";
import { StatusBar } from "./StatusBar.js";
import { MenuItem } from "./MenuItem.js";
import { TextInput } from "./TextInput.js";
import { TestProgress } from "./TestProgress.js";
import { initConfig, configExists, loadConfig, saveConfig, getReportDir, getNotesDir, getMemoryPath } from "../config/settings.js";
import { getRegressionContext } from "../git/context.js";
import { getAvailableProviders } from "../providers/registry.js";
import { getLocalAppUrlError, isLocalAppUrl, runTestSession } from "../orchestrator/index.js";
import { ProviderStream } from "./ProviderStream.js";
import { readFile, readdir, rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { GetwiredSettings } from "../config/settings.js";
import type { DeviceProfile, TestFinding, TestPersona, TestReport } from "../providers/types.js";
import type { TestStep, TestPhase } from "../orchestrator/index.js";

// ─── View types ──────────────────────────────────────────
type View =
  | "init-provider"
  | "init-scanning"
  | "dashboard"
  | "test-mode"
  | "test-url"
  | "test-running"
  | "regression-input"
  | "regression-custom-input"
  | "regression-running"
  | "reports-list"
  | "report-detail"
  | "notes"
  | "settings"
  | "confirm-clear";

interface AppProps {
  mode: "init" | "dashboard";
  initProvider?: string;
}

// ─── Main App (router) ──────────────────────────────────
export function App({ mode, initProvider }: AppProps) {
  const { exit } = useApp();

  // State
  const [view, setView] = useState<View>(
    mode === "init"
      ? configExists(process.cwd()) ? "dashboard" : "init-provider"
      : configExists(process.cwd()) ? "dashboard" : "init-provider",
  );
  const [settings, setSettings] = useState<GetwiredSettings | null>(null);

  // Dashboard
  const [menuIndex, setMenuIndex] = useState(0);

  // Init
  const [providerIndex, setProviderIndex] = useState(0);

  // Test runner
  const [testUrl, setTestUrl] = useState("");
  const [testPhase, setTestPhase] = useState<TestPhase>("initializing");
  const [testPhaseMsg, setTestPhaseMsg] = useState("Starting...");
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [testFindings, setTestFindings] = useState<TestFinding[]>([]);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [providerOutput, setProviderOutput] = useState("");

  // ─── Smooth streaming buffer ───────────────────────
  // Accumulate provider output in a ref and flush to state on a fixed interval
  // so the UI updates smoothly instead of in large bursts.
  const providerOutputRef = useRef("");
  const streamFlushTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const appendProviderOutput = useCallback((text: string) => {
    providerOutputRef.current += text;
  }, []);

  useEffect(() => {
    streamFlushTimer.current = setInterval(() => {
      const buffered = providerOutputRef.current;
      setProviderOutput((prev) => {
        if (buffered.length > prev.length) return buffered;
        return prev;
      });
    }, 80);
    return () => {
      if (streamFlushTimer.current) clearInterval(streamFlushTimer.current);
    };
  }, []);
  const [testModeIndex, setTestModeIndex] = useState(0);
  const [selectedTestPersona, setSelectedTestPersona] = useState<TestPersona>("standard");
  const [activeTestPersona, setActiveTestPersona] = useState<TestPersona>("standard");

  // Regression
  const [regressionTargetIndex, setRegressionTargetIndex] = useState(0);
  const [regressionInputMode, setRegressionInputMode] = useState<"pr" | "custom">("custom");
  const [regressionError, setRegressionError] = useState<string | null>(null);
  const [regressionContext, setRegressionContext] = useState(() => getRegressionContext(process.cwd()));

  // Reports
  const [reportFiles, setReportFiles] = useState<string[]>([]);
  const [reportIndex, setReportIndex] = useState(0);
  const [activeReport, setActiveReport] = useState<TestReport | null>(null);
  const [confirmClearReports, setConfirmClearReports] = useState(false);

  // Notes
  const [noteFiles, setNoteFiles] = useState<string[]>([]);
  const [noteIndex, setNoteIndex] = useState(0);
  const [noteContent, setNoteContent] = useState<string | null>(null);

  // Settings
  const [settingIndex, setSettingIndex] = useState(0);
  const [settingEditing, setSettingEditing] = useState<string | null>(null);
  const [settingEditIndex, setSettingEditIndex] = useState(0);
  const [settingSaved, setSettingSaved] = useState(false);

  const providers = getAvailableProviders();
  const selectedInitProvider = providers[providerIndex];
  const selectedSettingsProvider = providers[settingEditIndex];
  const regressionTargets = getRegressionTargets(regressionContext);

  // ─── Load config on mount ───────────────────────────
  useEffect(() => {
    if (configExists(process.cwd())) {
      loadConfig(process.cwd()).then(setSettings);
    }
    setRegressionContext(getRegressionContext(process.cwd()));
  }, []);

  // Auto-init if provider flag given
  useEffect(() => {
    if (initProvider) {
      doInit(initProvider);
    }
  }, []);

  // ─── Navigation helpers ─────────────────────────────
  function goToDashboard() {
    loadConfig(process.cwd()).then(setSettings);
    setView("dashboard");
  }

  function resetTestState() {
    setTestPhase("initializing");
    setTestPhaseMsg("Starting...");
    setTestSteps([]);
    setTestFindings([]);
    setTestLogs([]);
    setTestReport(null);
    setTestError(null);
    providerOutputRef.current = "";
    setProviderOutput("");
  }

  // ─── Init logic ─────────────────────────────────────
  async function doInit(providerName: string) {
    setView("init-scanning");
    try {
      const dirName = process.cwd().split("/").pop() ?? "project";
      const config = await initConfig(process.cwd(), dirName);
      config.provider = providerName;
      await saveConfig(process.cwd(), config);
      setSettings(config);
      // Short delay then forward to dashboard
      setTimeout(() => setView("dashboard"), 1200);
    } catch (err) {
      setTestError(String(err));
    }
  }

  // ─── Run test ───────────────────────────────────────
  function startTest(
    url: string,
    commitId?: string,
    prId?: string,
    nextView: Extract<View, "test-running" | "regression-running"> = "test-running",
    persona: TestPersona = "standard",
  ) {
    resetTestState();
    setTestUrl(url);
    setActiveTestPersona(persona);
    setView(nextView);

    runTestSession(
      process.cwd(),
      { url: url || undefined, commitId, prId, persona },
      {
        onPhaseChange: (p, msg) => { setTestPhase(p); setTestPhaseMsg(msg); },
        onStepUpdate: (s) => setTestSteps([...s]),
        onFinding: (f) => setTestFindings((prev) => [...prev, f]),
        onLog: (msg) => setTestLogs((prev) => [...prev, msg].slice(-10)),
        onProviderOutput: appendProviderOutput,
      },
    )
      .then((r) => setTestReport(r))
      .catch((err) => setTestError(String(err)));
  }

  function startScopedTest(url: string, scope: string | undefined, persona: TestPersona) {
    resetTestState();
    setTestUrl(url);
    setActiveTestPersona(persona);
    setView("test-running");

    runTestSession(
      process.cwd(),
      { url: url || undefined, scope, persona },
      {
        onPhaseChange: (p, msg) => { setTestPhase(p); setTestPhaseMsg(msg); },
        onStepUpdate: (s) => setTestSteps([...s]),
        onFinding: (f) => setTestFindings((prev) => [...prev, f]),
        onLog: (msg) => setTestLogs((prev) => [...prev, msg].slice(-10)),
        onProviderOutput: appendProviderOutput,
      },
    )
      .then((r) => setTestReport(r))
      .catch((err) => setTestError(String(err)));
  }

  function getConfiguredLocalUrl(): string {
    const savedUrl = settings?.project.url?.trim();
    return savedUrl && isLocalAppUrl(savedUrl) ? savedUrl : "";
  }

  // ─── Load reports ───────────────────────────────────
  async function loadReportsList() {
    try {
      const dir = getReportDir(process.cwd());
      const entries = await readdir(dir, { withFileTypes: true });
      const jsonFiles: string[] = [];
      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Reports are stored as <dir>/<dir>.json inside subdirectories
          const jsonPath = join(dir, entry.name, `${entry.name}.json`);
          if (existsSync(jsonPath)) {
            jsonFiles.push(entry.name);
          }
        } else if (entry.name.endsWith(".json")) {
          // Also support flat JSON files directly in reports dir
          jsonFiles.push(entry.name);
        }
      }
      setReportFiles(jsonFiles.sort().reverse());
      setReportIndex(0);
      setActiveReport(null);
    } catch {
      setReportFiles([]);
    }
    setView("reports-list");
  }

  async function loadReportDetail(filename: string) {
    const dir = getReportDir(process.cwd());
    const resolvedDir = resolve(dir);
    // Try subdirectory format first: reports/<id>/<id>.json
    const subDirPath = resolve(dir, filename, `${filename}.json`);
    const flatPath = resolve(dir, filename.endsWith(".json") ? filename : `${filename}.json`);

    // Prevent path traversal — resolved path must stay within reports dir
    if (!subDirPath.startsWith(resolvedDir + "/") || !flatPath.startsWith(resolvedDir + "/")) {
      return;
    }

    const filePath = existsSync(subDirPath) ? subDirPath : flatPath;
    const raw = await readFile(filePath, "utf-8");
    setActiveReport(JSON.parse(raw));
    setView("report-detail");
  }

  async function clearAllReports() {
    const dir = getReportDir(process.cwd());
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    setReportFiles([]);
    setReportIndex(0);
    setConfirmClearReports(false);
  }

  // ─── Load notes (memory.md) ─────────────────────────
  async function loadNotes() {
    try {
      const memoryPath = getMemoryPath(process.cwd());
      if (existsSync(memoryPath)) {
        const content = await readFile(memoryPath, "utf-8");
        setNoteContent(content);
      } else {
        setNoteContent(null);
      }
    } catch {
      setNoteContent(null);
    }
    setView("notes");
  }

  // Disable input during test runs to avoid unnecessary re-renders
  const isRunning = view === "test-running" || view === "regression-running";
  const inputActive = !isRunning || !!testReport || !!testError;

  // ─── Input handler ──────────────────────────────────
  useInput((input, key) => {
    // Global quit
    if (key.ctrl && input === "c") { exit(); return; }

    switch (view) {
      // ── Init: provider select ──
      case "init-provider":
        if (key.upArrow) setProviderIndex((p) => Math.max(0, p - 1));
        if (key.downArrow) setProviderIndex((p) => Math.min(providers.length - 1, p + 1));
        if (key.return) doInit(providers[providerIndex].name);
        if (input === "q") exit();
        break;

      // ── Dashboard ──
      case "dashboard":
        if (input === "q") { exit(); return; }
        if (key.upArrow) setMenuIndex((p) => Math.max(0, p - 1));
        if (key.downArrow) setMenuIndex((p) => Math.min(MENU_ITEMS.length - 1, p + 1));
        if (key.return || input === MENU_ITEMS[menuIndex]?.hotkey) {
          handleMenuSelect(MENU_ITEMS[menuIndex].action);
        }
        // Hotkeys
        for (const item of MENU_ITEMS) {
          if (input === item.hotkey) handleMenuSelect(item.action);
        }
        break;

      // ── Test URL input ──
      // Handled by TextInput component

      case "test-mode":
        if (key.escape || input === "b") { setView("dashboard"); return; }
        if (key.upArrow) setTestModeIndex((p) => Math.max(0, p - 1));
        if (key.downArrow) setTestModeIndex((p) => Math.min(TEST_PERSONAS.length - 1, p + 1));
        if (key.return) {
          setSelectedTestPersona(TEST_PERSONAS[testModeIndex].id);
          setView("test-url");
        }
        break;

      // ── Test running ──
      case "test-running":
      case "regression-running":
        if (testReport || testError) {
          if (key.return || key.escape || input === "b") goToDashboard();
        }
        break;

      // ── Regression mode select ──
      case "regression-input":
        if (key.escape || input === "b") { setView("dashboard"); return; }
        if (key.upArrow) {
          setRegressionTargetIndex((p) => Math.max(0, p - 1));
          setRegressionError(null);
        }
        if (key.downArrow) {
          setRegressionTargetIndex((p) => Math.min(regressionTargets.length - 1, p + 1));
          setRegressionError(null);
        }
        if (key.return) {
          const selectedTarget = regressionTargets[regressionTargetIndex];
          if (!selectedTarget) break;
          setRegressionError(null);
          if (selectedTarget.kind === "commit" && selectedTarget.value) {
            startTest(getConfiguredLocalUrl(), selectedTarget.value, undefined, "regression-running");
          } else {
            setRegressionInputMode(selectedTarget.kind === "pr" ? "pr" : "custom");
            setView("regression-custom-input");
          }
        }
        break;

      case "regression-custom-input":
        if (key.escape || input === "b") {
          setRegressionError(null);
          setView("regression-input");
        }
        break;

      // ── Reports list ──
      case "reports-list":
        if (confirmClearReports) {
          if (input === "y") { clearAllReports(); return; }
          setConfirmClearReports(false);
          return;
        }
        if (key.escape || input === "b") { setView("dashboard"); return; }
        if (input === "q") { exit(); return; }
        if (input === "c" && reportFiles.length > 0) { setConfirmClearReports(true); return; }
        if (key.upArrow) setReportIndex((p) => Math.max(0, p - 1));
        if (key.downArrow) setReportIndex((p) => Math.min(reportFiles.length - 1, p + 1));
        if (key.return && reportFiles[reportIndex]) loadReportDetail(reportFiles[reportIndex]);
        break;

      // ── Report detail ──
      case "report-detail":
        if (key.escape || input === "b") setView("reports-list");
        if (input === "q") exit();
        break;

      // ── Notes (Memory) ──
      case "notes":
        if (key.escape || input === "b") { setView("dashboard"); return; }
        if (input === "q") { exit(); return; }
        break;

      // ── Settings ──
      case "settings":
        if (settingSaved) setSettingSaved(false);
        if (input === "q" && !settingEditing) { setView("dashboard"); return; }
        if (key.escape) {
          if (settingEditing) { setSettingEditing(null); return; }
          setView("dashboard");
          return;
        }
        if (!settingEditing) {
          if (key.upArrow) setSettingIndex((p) => Math.max(0, p - 1));
          if (key.downArrow) setSettingIndex((p) => Math.min(SETTINGS_SECTIONS.length - 1, p + 1));
          if (key.return) {
            const sectionKey = SETTINGS_SECTIONS[settingIndex].key;
            setSettingEditing(sectionKey);
            setSettingEditIndex(getCurrentSettingIndex(sectionKey));
          }
        } else {
          handleSettingEdit(settingEditing, input, key);
        }
        break;

      // ── Confirm clear reports ──
      case "confirm-clear":
        if (input === "y") { clearAllReports(); setView("dashboard"); return; }
        if (input === "n" || key.escape || input === "q") { setConfirmClearReports(false); setView("dashboard"); return; }
        break;
    }
  }, { isActive: inputActive });

  function handleMenuSelect(action: string) {
    switch (action) {
      case "test":
        setTestUrl("");
        setTestModeIndex(0);
        setSelectedTestPersona("standard");
        setView("test-mode");
        break;
      case "regression":
        setRegressionTargetIndex(0);
        setRegressionInputMode("custom");
        setRegressionError(null);
        setRegressionContext(getRegressionContext(process.cwd()));
        setView("regression-input");
        break;
      case "reports": loadReportsList(); break;
      case "notes": loadNotes(); break;
      case "settings": setSettingEditing(null); setView("settings"); break;
      case "clear-reports": setConfirmClearReports(true); setView("confirm-clear"); break;
    }
  }

  function getCurrentSettingIndex(section: string): number {
    if (!settings) return 0;
    if (section === "provider") {
      const idx = providers.findIndex((p) => p.name === settings.provider);
      return idx >= 0 ? idx : 0;
    }
    if (section === "device") {
      const profiles: DeviceProfile[] = ["desktop", "mobile", "both"];
      const idx = profiles.indexOf(settings.testing.deviceProfile);
      return idx >= 0 ? idx : 0;
    }
    if (section === "reporting") {
      const formats = ["json", "html", "markdown"];
      const idx = formats.indexOf(settings.reporting.outputFormat);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  }

  async function handleSettingEdit(section: string, input: string, key: any) {
    if (!settings) return;

    const getMaxIndex = () => {
      if (section === "provider") return providers.length - 1;
      if (section === "device") return 2;
      if (section === "screenshot") return 9;
      if (section === "reporting") return 2;
      return 0;
    };

    if (key.upArrow) { setSettingEditIndex((p) => Math.max(0, p - 1)); return; }
    if (key.downArrow) { setSettingEditIndex((p) => Math.min(getMaxIndex(), p + 1)); return; }

    if (key.return) {
      let updated = { ...settings };
      if (section === "provider") {
        updated.provider = providers[settingEditIndex].name;
      } else if (section === "device") {
        const profiles: DeviceProfile[] = ["desktop", "mobile", "both"];
        updated = { ...updated, testing: { ...updated.testing, deviceProfile: profiles[settingEditIndex] } };
      } else if (section === "screenshot") {
        const t = { ...updated.testing };
        switch (settingEditIndex) {
          case 0: t.screenshotFullPage = true; break;
          case 1: t.screenshotFullPage = false; break;
          case 2: t.screenshotDelay = 500; break;
          case 3: t.screenshotDelay = 1000; break;
          case 4: t.screenshotDelay = 2000; break;
          case 5: t.diffThreshold = 0.01; break;
          case 6: t.diffThreshold = 0.05; break;
          case 7: t.diffThreshold = 0.10; break;
          case 8: t.showBrowser = true; break;
          case 9: t.showBrowser = false; break;
        }
        updated.testing = t;
      } else if (section === "reporting") {
        const formats = ["json", "html", "markdown"] as const;
        updated = { ...updated, reporting: { ...updated.reporting, outputFormat: formats[settingEditIndex] } };
      }
      setSettings(updated);
      try {
        await saveConfig(process.cwd(), updated);
      } catch {
        // Config save failed — settings still updated in memory
      }
      setSettingSaved(true);
      setSettingEditing(null);
    }
  }

  // ─── Status map for test phases ─────────────────────
  const statusMap: Record<TestPhase, "idle" | "testing" | "analyzing" | "reporting" | "error"> = {
    initializing: "testing", scanning: "testing", planning: "analyzing",
    "capturing-baseline": "testing", testing: "testing", "capturing-current": "testing",
    comparing: "analyzing", analyzing: "analyzing", breaking: "testing",
    reporting: "reporting", done: "idle", error: "error",
  };

  // ─── RENDER ─────────────────────────────────────────
  return (
    <Box flexDirection="column">
      {/* ── Init: Provider Select ── */}
      {view === "init-provider" && (
        <>
          <Header subtitle="Project Setup" />
          <Box flexDirection="column" paddingX={2}>
            <Text color="greenBright" bold>◆ Select your AI provider:</Text>
            <Box flexDirection="column" marginY={1}>
              {providers.map((p, i) => (
                <Box key={p.name} gap={1}>
                  <Text color={i === providerIndex ? "greenBright" : "green"}>
                    {i === providerIndex ? " ▸ " : "   "}
                  </Text>
                  <Text color={i === providerIndex ? "greenBright" : "green"} bold={i === providerIndex}>
                    {p.displayName}
                  </Text>
                  {p.recommendedReason && <Text color="greenBright">(recommended)</Text>}
                  <Text color="green" dimColor>({p.authType})</Text>
                </Box>
              ))}
            </Box>
            {selectedInitProvider?.recommendedReason && (
              <Text color="greenBright" bold>
                {"  "}Recommended: {selectedInitProvider.displayName} {selectedInitProvider.recommendedReason.replace(/^Recommended because /, "because ")}
              </Text>
            )}
            <Text color="green" dimColor italic>
              {"  "}{selectedInitProvider?.authInstructions}
            </Text>
            <Box marginTop={1} gap={2}>
              <Text color="green" dimColor>[↑↓] Navigate</Text>
              <Text color="green" dimColor>[Enter] Select</Text>
              <Text color="green" dimColor>[q] Quit</Text>
            </Box>
          </Box>
        </>
      )}

      {/* ── Init: Scanning ── */}
      {view === "init-scanning" && (
        <>
          <Header subtitle="Project Setup" />
          <Box flexDirection="column" paddingX={2} gap={1}>
            <Text color="greenBright" bold>◆ Initializing GetWired...</Text>
            <Text color="green">  ✔ Creating .getwired/ directory</Text>
            <Text color="green">  ✔ Setting up baselines, reports & notes</Text>
            <Text color="green">  ✔ Writing config.json</Text>
            <Text color="greenBright" dimColor>  Launching dashboard...</Text>
          </Box>
        </>
      )}

      {/* ── Dashboard ── */}
      {view === "dashboard" && (
        <>
          <Header />
          <StatusBar
            status="idle"
            message={settings ? `Provider: ${settings.provider}` : "Ready"}
            projectName={settings?.project.name}
          />
          <Box paddingX={2} marginTop={1}>
            <Text color="yellow" bold>
              ⚠  WARNING: Do not use this tool in production environments.
            </Text>
          </Box>
          <Box paddingX={2}>
            <Text color="yellow" dimColor>
              This tool could generate synthetic data! Never use it in production.
            </Text>
          </Box>
          <Box paddingX={2}>
            <Text color="yellow" dimColor>
              Synthetic data in production can negatively impact user experience.
            </Text>
          </Box>
          <Box flexDirection="column" marginY={1} paddingX={1}>
            <Text color="green" bold>
              ┌─ Dashboard ─────────────────────────────────────
            </Text>
            <Box flexDirection="column" paddingY={1}>
              {MENU_ITEMS.map((item, i) => (
                <MenuItem
                  key={item.hotkey}
                  label={item.label}
                  description={item.description}
                  hotkey={item.hotkey}
                  isSelected={i === menuIndex}
                />
              ))}
            </Box>
            <Text color="green" bold>
              └──────────────────────────────────────────────────
            </Text>
          </Box>
          {settings && (
            <Box paddingX={2}>
              <Text color="green" dimColor>
                Provider: {settings.provider} | Device: {settings.testing.deviceProfile} | Threshold: {(settings.testing.diffThreshold * 100).toFixed(0)}%
              </Text>
            </Box>
          )}
          <Box paddingX={2} marginTop={1} gap={2}>
            <Text color="green" dimColor>[↑↓] Navigate</Text>
            <Text color="green" dimColor>[Enter] Select</Text>
            <Text color="green" dimColor>[q] Quit</Text>
          </Box>
        </>
      )}

      {/* ── Test: Mode Select ── */}
      {view === "test-mode" && (
        <>
          <Header subtitle="Run Tests" />
          <Box flexDirection="column" paddingX={2} gap={1}>
            <Text color="greenBright" bold>◆ Choose the kind of test run:</Text>
            <Box flexDirection="column" marginY={1}>
              {TEST_PERSONAS.map((persona, i) => (
                <Box key={persona.id} gap={1}>
                  <Text color={i === testModeIndex ? "greenBright" : "green"}>
                    {i === testModeIndex ? " ▸ " : "   "}
                  </Text>
                  <Text color={i === testModeIndex ? "greenBright" : "green"} bold={i === testModeIndex}>
                    {persona.label}
                  </Text>
                  <Text color="green" dimColor>
                    — {persona.description}
                  </Text>
                </Box>
              ))}
            </Box>
            <Box marginTop={1} gap={2}>
              <Text color="green" dimColor>[↑↓] Select mode</Text>
              <Text color="green" dimColor>[Enter] Continue</Text>
              <Text color="green" dimColor>[Esc] Back</Text>
            </Box>
          </Box>
        </>
      )}

      {/* ── Test: What to test ── */}
      {view === "test-url" && (
        <>
          <Header subtitle={getTestPersonaLabel(selectedTestPersona)} />
          <Box flexDirection="column" paddingX={2} gap={1}>
            {getConfiguredLocalUrl() && (
              <Text color="green" dimColor>Target: {getConfiguredLocalUrl()}</Text>
            )}
            <Text color="greenBright" bold>{getTestPersonaPrompt(selectedTestPersona)}</Text>
            <Text color="green" dimColor>{getTestPersonaDescription(selectedTestPersona)}</Text>
            <TextInput
              label="Scope ▸ "
              placeholder="e.g. login flow, checkout, forms, or http://localhost:3000"
              onSubmit={(scope) => {
                const trimmed = scope.trim();
                const isUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://");
                if (isUrl && !isLocalAppUrl(trimmed)) {
                  resetTestState();
                  setTestUrl(trimmed);
                  setActiveTestPersona(selectedTestPersona);
                  setTestPhase("error");
                  setTestError(getLocalAppUrlError("The test URL"));
                  setView("test-running");
                  return;
                }
                const url = isUrl ? trimmed : getConfiguredLocalUrl();
                const testScope = isUrl ? undefined : (trimmed || undefined);
                startScopedTest(url, testScope, selectedTestPersona);
              }}
              onCancel={() => setView("test-mode")}
            />
            <Box marginTop={1} gap={2}>
              <Text color="green" dimColor>[Enter] Start testing</Text>
              <Text color="green" dimColor>[Esc] Back to mode select</Text>
            </Box>
          </Box>
        </>
      )}

      {/* ── Regression: Mode + Input ── */}
      {view === "regression-input" && (
        <>
          <Header subtitle="Regression Check" />
          <Box flexDirection="column" paddingX={2} gap={1}>
            <Text color="greenBright" bold>◆ What do you want to test against?</Text>
            <Box flexDirection="column" marginY={1}>
              {regressionTargets.map((target, i) => (
                <Box key={target.label} gap={1}>
                  <Text color={i === regressionTargetIndex ? "greenBright" : "green"}>
                    {i === regressionTargetIndex ? " ▸ " : "   "}
                  </Text>
                  <Text color={i === regressionTargetIndex ? "greenBright" : "green"} bold={i === regressionTargetIndex}>
                    {target.label}
                  </Text>
                  <Text color="green" dimColor>— {target.description}</Text>
                </Box>
              ))}
            </Box>
            {regressionError && (
              <Text color="yellow">
                {regressionError}
              </Text>
            )}
            <Box marginTop={1} gap={2}>
              <Text color="green" dimColor>[↑↓] Select target</Text>
              <Text color="green" dimColor>[Enter] Continue</Text>
              <Text color="green" dimColor>[Esc] Back</Text>
            </Box>
          </Box>
        </>
      )}

      {view === "regression-custom-input" && (
        <>
          <Header subtitle="Regression Check" />
          <Box flexDirection="column" paddingX={2} gap={1}>
            <Text color="greenBright" bold>
              {regressionInputMode === "pr"
                ? "◆ Enter the pull request number to compare against:"
                : "◆ Enter a custom baseline target:"}
            </Text>
            <Text color="green" dimColor>
              {regressionInputMode === "pr"
                ? "Example: 42"
                : "Commit SHA, branch name, tag, or `#42` / `pr:42` for a pull request"}
            </Text>
            {regressionError && (
              <Text color="yellow">
                {regressionError}
              </Text>
            )}
            <TextInput
              label={regressionInputMode === "pr" ? "PR # ▸ " : "Custom ▸ "}
              placeholder={regressionInputMode === "pr" ? "42" : "abc1234, main, release-1.2, or #42"}
              onSubmit={(value) => {
                const trimmed = value.trim();
                if (!trimmed) {
                  setRegressionError("Enter a commit, branch, tag, or pull request number.");
                  return;
                }
                setRegressionError(null);
                const parsed = parseCustomRegressionInput(trimmed, regressionInputMode);
                if (parsed.prId) {
                  startTest(getConfiguredLocalUrl(), undefined, parsed.prId, "regression-running");
                } else {
                  startTest(getConfiguredLocalUrl(), parsed.commitId, undefined, "regression-running");
                }
              }}
              onCancel={() => setView("regression-input")}
            />
            <Box marginTop={1} gap={2}>
              <Text color="green" dimColor>[Enter] Run regression</Text>
              <Text color="green" dimColor>[Esc] Back to selector</Text>
            </Box>
          </Box>
        </>
      )}

      {/* ── Test/Regression Running (Split Pane) ── */}
      {(view === "test-running" || view === "regression-running") && (
        <>
          <Header subtitle={
            view === "regression-running" ? "Regression Check" :
            testUrl ? `${getTestPersonaLabel(activeTestPersona)} · ${testUrl}` : getTestPersonaLabel(activeTestPersona)
          } />
          <StatusBar status={statusMap[testPhase] ?? "testing"} message={testPhaseMsg} />

          {/* ── Split Pane: Left = Progress | Right = Agent Feed ── */}
          <Box flexDirection="row" marginY={1} minHeight={20} width="100%">
            {/* Left Panel: Progress + Findings */}
            <Box flexDirection="column" width="50%" flexGrow={0} flexShrink={0}>
              {testSteps.length > 0 && (
                <TestProgress steps={testSteps} currentStep={Math.max(0, testSteps.findIndex((s) => s.status === "running"))} />
              )}

              {testFindings.length > 0 && (
                <Box flexDirection="column" paddingX={1} marginTop={1}>
                  <Text color="greenBright" bold>── Findings ({testFindings.length}) ──</Text>
                  {testFindings.slice(-6).map((f, i) => (
                    <Box key={i} gap={1} paddingLeft={1}>
                      <Text color={f.severity === "critical" || f.severity === "high" ? "redBright" : "yellow"}>
                        {f.severity === "critical" || f.severity === "high" ? "✘" : "⚠"} [{f.severity}] {f.title.slice(0, 40)}
                      </Text>
                    </Box>
                  ))}
                </Box>
              )}

              {testReport && (
                <Box flexDirection="column" paddingX={1} marginTop={1}>
                  <Text color="greenBright" bold>✔ Testing Complete</Text>
                  <Text color="green">
                    {testReport.summary.passed} passed · {testReport.summary.failed} failed · {testReport.summary.warnings} warnings
                  </Text>
                  {testReport.execution && (
                    <Text color={testReport.execution.evidenceMet ? "green" : "redBright"} dimColor={!testReport.execution.evidenceMet}>
                      Browser evidence: {testReport.execution.navigations} navigations · {testReport.execution.screenshots} screenshots
                    </Text>
                  )}
                  <Text color="green" dimColor>
                    {testReport.summary.duration}ms · .getwired/reports/{testReport.id}/{testReport.id}.json
                  </Text>
                  {testReport.execution?.screenshots ? (
                    <Text color="green" dimColor>
                      Screenshots: .getwired/reports/{testReport.id}/screenshots/
                    </Text>
                  ) : (
                    <Text color="redBright" dimColor>
                      Screenshots: none captured
                    </Text>
                  )}
                </Box>
              )}

              {testError && (
                <Box flexDirection="column" paddingX={1} marginTop={1}>
                  <Text color="redBright">Error: {testError.slice(0, 120)}</Text>
                </Box>
              )}
            </Box>

            {/* Right Panel: Live Provider Output */}
            <Box width="50%" flexGrow={0} flexShrink={0}>
              <ProviderStream
                output={providerOutput}
                providerName={settings?.provider}
                isStreaming={!testReport && !testError && testPhase !== "done" && testPhase !== "error"}
              />
            </Box>
          </Box>

          {/* Bottom bar */}
          <Box paddingX={2} gap={2}>
            {(testReport || testError) ? (
              <Text color="green" dimColor>[Enter] Back to dashboard</Text>
            ) : (
              <Text color="green" dimColor>[Ctrl+C] Cancel</Text>
            )}
          </Box>
        </>
      )}

      {/* ── Reports List ── */}
      {view === "reports-list" && (
        <>
          <Header subtitle="Test Reports" />
          <Box flexDirection="column" paddingX={2}>
            <Text color="greenBright" bold>┌─ Reports ─────────────────────────────────────</Text>
            {reportFiles.length === 0 && (
              <Text color="green" dimColor>  No reports yet. Run a test first.</Text>
            )}
            {reportFiles.map((r, i) => (
              <Box key={r} gap={1}>
                <Text color={i === reportIndex ? "greenBright" : "green"}>
                  {i === reportIndex ? " ▸ " : "   "}
                </Text>
                <Text color={i === reportIndex ? "greenBright" : "green"} bold={i === reportIndex}>
                  {r.replace(".json", "")}
                </Text>
              </Box>
            ))}
            <Text color="greenBright" bold>└──────────────────────────────────────────────────</Text>
            {confirmClearReports ? (
              <Box marginTop={1}>
                <Text color="red" bold>Delete all reports? [y] Yes / [any key] Cancel</Text>
              </Box>
            ) : (
              <Box marginTop={1} gap={2}>
                <Text color="green" dimColor>[↑↓] Navigate</Text>
                <Text color="green" dimColor>[Enter] View</Text>
                {reportFiles.length > 0 && <Text color="green" dimColor>[c] Clear All</Text>}
                <Text color="green" dimColor>[b] Back</Text>
              </Box>
            )}
          </Box>
        </>
      )}

      {/* ── Report Detail ── */}
      {view === "report-detail" && activeReport && (
        <>
          <Header subtitle="Test Report" />
          <Box flexDirection="column" paddingX={2}>
            <Box borderStyle="single" borderColor="green" flexDirection="column" paddingX={2} paddingY={1}>
              <Box justifyContent="space-between" marginBottom={1}>
                <Text color="greenBright" bold>Report #{activeReport.id}</Text>
                <Text color="green" dimColor>{activeReport.timestamp.split("T")[0]}</Text>
              </Box>
              <Box gap={2} marginBottom={1}>
                <Text color="green" dimColor>Provider: {activeReport.provider}</Text>
                <Text color="green" dimColor>Device: {activeReport.context.deviceProfile}</Text>
                <Text color="green" dimColor>Duration: {activeReport.summary.duration}ms</Text>
              </Box>
              <Box flexDirection="column">
                <Box gap={1}><Text color="green">✔</Text><Text color="green">{activeReport.summary.passed} tests passed</Text></Box>
                <Box gap={1}><Text color="redBright">✘</Text><Text color="redBright">{activeReport.summary.failed} issues found</Text></Box>
                <Box gap={1}><Text color="yellow">⚠</Text><Text color="yellow">{activeReport.summary.warnings} warnings</Text></Box>
              </Box>
              {activeReport.steps && activeReport.steps.some((s) => s.status === "failed") && (
                <Box marginTop={1} flexDirection="column">
                  <Text color="redBright" bold>── Failed Steps ──────────────────────</Text>
                  {activeReport.steps.filter((s) => s.status === "failed").map((s, i) => (
                    <Box key={i} paddingLeft={1} flexDirection="column">
                      <Text color="redBright">✘ {s.name}</Text>
                      {s.details && <Text color="red" dimColor>  → {s.details}</Text>}
                    </Box>
                  ))}
                </Box>
              )}
              {activeReport.findings.length > 0 && (
                <Box marginTop={1} flexDirection="column">
                  <Text color="greenBright" bold>── Findings ──────────────────────────</Text>
                  {activeReport.findings.map((f, i) => (
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
              <Text color="green" dimColor>[b] Back to list</Text>
              <Text color="green" dimColor>[Esc] Dashboard</Text>
            </Box>
          </Box>
        </>
      )}

      {/* ── Notes (Memory) ── */}
      {view === "notes" && (
        <>
          <Header subtitle="Project Memory" />
          <Box flexDirection="column" paddingX={2}>
            {noteContent ? (
              <>
                <Box borderStyle="single" borderColor="green" flexDirection="column" paddingX={2} paddingY={1}>
                  <Text color="greenBright" bold>memory.md</Text>
                  <Box marginTop={1}>
                    <Text color="green">{noteContent}</Text>
                  </Box>
                </Box>
                <Box marginTop={1} flexDirection="column">
                  <Box gap={2}>
                    <Text color="green" dimColor>[b] Back</Text>
                  </Box>
                  <Box marginTop={1}>
                    <Text color="green" dimColor>
                      ✎ To edit, open .getwired/memory.md in your editor.
                    </Text>
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <Text color="greenBright" bold>┌─ Project Memory ──────────────────────────────</Text>
                <Box flexDirection="column" paddingY={1}>
                  <Text color="green" dimColor>  No memory yet.</Text>
                  <Text color="green" dimColor>  GetWired will automatically learn about your project</Text>
                  <Text color="green" dimColor>  as it tests — pages, structure, known bugs, etc.</Text>
                </Box>
                <Text color="greenBright" bold>└──────────────────────────────────────────────────</Text>
                <Box marginTop={1} gap={2}>
                  <Text color="green" dimColor>[b] Back</Text>
                </Box>
              </>
            )}
          </Box>
        </>
      )}

      {/* ── Settings ── */}
      {view === "settings" && settings && (
        <>
          <Header subtitle="Settings" />
          {settingSaved && (
            <Box paddingX={2}><Text color="greenBright" bold>✔ Settings saved!</Text></Box>
          )}
          <Box flexDirection="column" paddingX={2} marginY={1}>
            <Text color="greenBright" bold>┌─ Configuration ─────────────────────────────────</Text>
            {!settingEditing && SETTINGS_SECTIONS.map((s, i) => (
              <Box key={s.key} gap={1}>
                <Text color={i === settingIndex ? "greenBright" : "green"}>
                  {i === settingIndex ? " ▸ " : "   "}
                </Text>
                <Text color={i === settingIndex ? "greenBright" : "green"} bold={i === settingIndex}>
                  {s.label}
                </Text>
                <Text color="green" dimColor>— {s.description}</Text>
                <Text color="green" dimColor>[{getSettingValue(settings, s.key)}]</Text>
              </Box>
            ))}
            {settingEditing === "provider" && (
              <Box flexDirection="column" paddingLeft={2}>
                <Text color="greenBright" bold>Select AI Provider:</Text>
                {providers.map((p, i) => (
                  <Box key={p.name} gap={1}>
                    <Text color={i === settingEditIndex ? "greenBright" : "green"}>
                      {i === settingEditIndex ? " ▸ " : "   "}
                    </Text>
                    <Text color={i === settingEditIndex ? "greenBright" : "green"} bold={i === settingEditIndex}>
                      {p.displayName}
                    </Text>
                    {p.recommendedReason && <Text color="greenBright">(recommended)</Text>}
                    {p.name === settings.provider && <Text color="green" dimColor>(current)</Text>}
                  </Box>
                ))}
                {selectedSettingsProvider?.recommendedReason && (
                  <Text color="greenBright" bold>
                    Recommended: {selectedSettingsProvider.displayName} {selectedSettingsProvider.recommendedReason.replace(/^Recommended because /, "because ")}
                  </Text>
                )}
              </Box>
            )}
            {settingEditing === "device" && (
              <Box flexDirection="column" paddingLeft={2}>
                <Text color="greenBright" bold>Device Profile:</Text>
                {(["Desktop Only", "Mobile Only", "Both"] as const).map((label, i) => (
                  <Box key={label} gap={1}>
                    <Text color={i === settingEditIndex ? "greenBright" : "green"}>
                      {i === settingEditIndex ? " ▸ " : "   "}
                    </Text>
                    <Text color={i === settingEditIndex ? "greenBright" : "green"} bold={i === settingEditIndex}>
                      {label}
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
            {settingEditing === "screenshot" && (
              <Box flexDirection="column" paddingLeft={2}>
                <Text color="greenBright" bold>Screenshot Settings:</Text>
                {[
                  "Full page: ON",
                  "Full page: OFF",
                  "Delay: 500ms",
                  "Delay: 1000ms",
                  "Delay: 2000ms",
                  "Threshold: 1%",
                  "Threshold: 5%",
                  "Threshold: 10%",
                  "Show browser: ON",
                  "Show browser: OFF",
                ].map((opt, i) => (
                  <Box key={opt} gap={1}>
                    <Text color={i === settingEditIndex ? "greenBright" : "green"}>
                      {i === settingEditIndex ? " ▸ " : "   "}
                    </Text>
                    <Text color={i === settingEditIndex ? "greenBright" : "green"} bold={i === settingEditIndex}>
                      {opt}
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
            {settingEditing === "reporting" && (
              <Box flexDirection="column" paddingLeft={2}>
                <Text color="greenBright" bold>Report Format:</Text>
                {["JSON — Machine-readable", "HTML — Visual with screenshots", "Markdown — GitHub-friendly"].map((label, i) => (
                  <Box key={label} gap={1}>
                    <Text color={i === settingEditIndex ? "greenBright" : "green"}>
                      {i === settingEditIndex ? " ▸ " : "   "}
                    </Text>
                    <Text color={i === settingEditIndex ? "greenBright" : "green"} bold={i === settingEditIndex}>
                      {label}
                    </Text>
                  </Box>
                ))}
              </Box>
            )}
            <Text color="greenBright" bold>└──────────────────────────────────────────────────</Text>
          </Box>
          <Box paddingX={2} gap={2}>
            {settingEditing ? (
              <>
                <Text color="green" dimColor>[↑↓] Select</Text>
                <Text color="green" dimColor>[Enter] Confirm</Text>
                <Text color="green" dimColor>[Esc] Cancel</Text>
              </>
            ) : (
              <>
                <Text color="green" dimColor>[↑↓] Navigate</Text>
                <Text color="green" dimColor>[Enter] Edit</Text>
                <Text color="green" dimColor>[Esc] Back</Text>
              </>
            )}
          </Box>
        </>
      )}

      {view === "confirm-clear" && (
        <>
          <Header subtitle="Clear Reports" />
          <Box flexDirection="column" paddingLeft={2}>
            <Text color="yellow">Are you sure you want to delete all reports and screenshots?</Text>
            <Text color="yellow">This cannot be undone.</Text>
            <Box marginTop={1} gap={2}>
              <Text color="green">[y] Yes, delete all</Text>
              <Text color="red">[n] Cancel</Text>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}

// ─── Constants ────────────────────────────────────────────

const MENU_ITEMS = [
  { label: "Run Tests", description: "Tell me what to test — I'll try to break it", hotkey: "t", action: "test" },
  { label: "Regression Check", description: "Test against a commit or PR", hotkey: "r", action: "regression" },
  { label: "View Reports", description: "Browse past test reports", hotkey: "v", action: "reports" },
  { label: "Project Memory", description: "View learned project context", hotkey: "n", action: "notes" },
  { label: "Settings", description: "Configure provider, devices & more", hotkey: "s", action: "settings" },
  { label: "Clear Reports", description: "Delete all reports and screenshots", hotkey: "c", action: "clear-reports" },
];

const SETTINGS_SECTIONS = [
  { key: "provider", label: "AI Provider", description: "Which AI powers your tests" },
  { key: "device", label: "Device Profile", description: "Test desktop, mobile, or both" },
  { key: "screenshot", label: "Screenshot Settings", description: "Capture & comparison options" },
  { key: "reporting", label: "Report Output", description: "Report format and behavior" },
];

const TEST_PERSONAS: Array<{ id: TestPersona; label: string; description: string }> = [
  { id: "standard", label: "Standard Testing", description: "Balanced QA coverage across normal flows, breakage, and edge cases" },
  { id: "hacky", label: "Hacky Testing", description: "Probe routes, parameters, and unsafe assumptions like a skeptical browser user" },
  { id: "old-man", label: "Old Man Test", description: "Use the app like a hesitant older non-technical person and note confusion" },
];

interface RegressionTargetOption {
  kind: "commit" | "pr" | "custom";
  label: string;
  description: string;
  value?: string;
}

function getSettingValue(settings: GetwiredSettings, key: string): string {
  switch (key) {
    case "provider": return settings.provider;
    case "device": return settings.testing.deviceProfile;
    case "screenshot": return `fullPage:${settings.testing.screenshotFullPage} delay:${settings.testing.screenshotDelay}ms threshold:${(settings.testing.diffThreshold * 100).toFixed(0)}% browser:${settings.testing.showBrowser ? "visible" : "headless"}`;
    case "reporting": return settings.reporting.outputFormat;
    default: return "";
  }
}

function getTestPersonaLabel(persona: TestPersona): string {
  return TEST_PERSONAS.find((entry) => entry.id === persona)?.label ?? "Run Tests";
}

function getTestPersonaDescription(persona: TestPersona): string {
  return TEST_PERSONAS.find((entry) => entry.id === persona)?.description ?? "";
}

function getTestPersonaPrompt(persona: TestPersona): string {
  switch (persona) {
    case "hacky":
      return "◆ What should I probe or try to exploit? (leave blank to cover the whole app)";
    case "old-man":
      return "◆ What should I try to use as a confused first-time user? (leave blank for the main flows)";
    default:
      return "◆ What should I focus on? (leave blank for full test)";
  }
}

function getRegressionTargets(regressionContext: ReturnType<typeof getRegressionContext>): RegressionTargetOption[] {
  const targets: RegressionTargetOption[] = [];

  if (regressionContext.defaultCommitId && regressionContext.description) {
    targets.push({
      kind: "commit",
      label: regressionContext.source === "branch" ? "Suggested branch baseline" : "Latest commit baseline",
      description: regressionContext.description,
      value: regressionContext.defaultCommitId,
    });
  }

  targets.push({
    kind: "pr",
    label: "Pull Request #",
    description: "Compare against a specific pull request",
  });

  targets.push({
    kind: "custom",
    label: "Custom...",
    description: "Enter a commit SHA, branch name, tag, or pull request manually",
  });

  return targets;
}

function parseCustomRegressionInput(
  value: string,
  mode: "pr" | "custom",
): { commitId?: string; prId?: string } {
  if (mode === "pr") return { prId: value.replace(/^#/, "") };

  const prMatch = value.match(/^(?:pr:|#)(\d+)$/i);
  if (prMatch) return { prId: prMatch[1] };

  return { commitId: value };
}
