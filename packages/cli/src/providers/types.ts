export interface ProviderMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface StreamChunk {
  type: "text" | "tool_call" | "done" | "error";
  content?: string;
  toolCall?: ToolCall;
  error?: string;
}

export type DeviceProfile = "desktop" | "mobile" | "both";
export type TestPersona = "standard" | "hacky" | "old-man";
export type NativePlatform = "android" | "ios";

export interface TestContext {
  projectPath: string;
  url?: string;
  commitId?: string;
  prId?: string;
  scope?: string;
  persona?: TestPersona;
  deviceProfile: DeviceProfile;
  baselineDir: string;
  reportDir: string;
}

export interface TestFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  category: "ui-regression" | "functional" | "accessibility" | "performance" | "seo" | "console-error";
  title: string;
  description: string;
  screenshotPath?: string;
  diffScreenshotPath?: string;
  url?: string;
  device?: "desktop" | "mobile";
  steps?: string[];
}

export interface TestExecutionSummary {
  browserSessions: number;
  navigations: number;
  screenshots: number;
  scenariosPlanned: number;
  scenariosExecuted: number;
  evidenceMet: boolean;
}

export interface TestStepSummary {
  name: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  duration?: number;
  details?: string;
}

export interface TestReport {
  id: string;
  timestamp: string;
  provider: string;
  context: TestContext;
  findings: TestFinding[];
  execution?: TestExecutionSummary;
  steps?: TestStepSummary[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
    duration: number;
  };
  notes: string[];
}

export interface ProviderConfig {
  name: string;
  displayName: string;
  authType: "api-key" | "oauth" | "subscription" | "subprocess";
  authInstructions: string;
  recommendedReason?: string;
}

export interface ProviderAuth {
  provider: string;
  apiKey?: string;
  token?: string;
  envVar?: string;
  validated: boolean;
}

export abstract class TestingProvider {
  abstract readonly config: ProviderConfig;

  abstract stream(context: TestContext, messages: ProviderMessage[]): AsyncGenerator<StreamChunk>;

  abstract evaluateRegression(
    baselineBase64: string,
    currentBase64: string,
    diffBase64: string,
    url: string,
    device: "desktop" | "mobile",
  ): Promise<TestFinding[]>;
}
