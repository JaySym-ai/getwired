export type NativePlatform = "android" | "ios";

export interface EmulatorDevice {
  id: string;
  name: string;
  platform: NativePlatform;
  state: "booted" | "shutdown" | "unknown";
}

export interface PrerequisiteIssue {
  check: string;
  passed: boolean;
  hint?: string;
  autoFixable?: boolean;
}

export interface PrerequisiteCheck {
  platform: NativePlatform;
  available: boolean;
  canProceed?: boolean;
  issues: PrerequisiteIssue[];
  devices: EmulatorDevice[];
}
