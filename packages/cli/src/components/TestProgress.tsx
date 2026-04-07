import { useEffect, useState } from "react";
import { Box, Text } from "ink";

interface TestStep {
  name: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  duration?: number;
  details?: string;
}

interface TestProgressProps {
  steps: TestStep[];
  currentStep: number;
}

const STATUS_ICON: Record<TestStep["status"], string> = {
  pending: "○",
  running: "◉",
  passed: "✔",
  failed: "✘",
  skipped: "⊘",
};

const STATUS_COLOR: Record<TestStep["status"], string> = {
  pending: "gray",
  running: "greenBright",
  passed: "green",
  failed: "redBright",
  skipped: "yellow",
};

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function TestProgress({ steps, currentStep }: TestProgressProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 120);
    return () => clearInterval(timer);
  }, []);

  const spinnerFrame = SPINNER_FRAMES[tick % SPINNER_FRAMES.length];

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text color="green" bold>
          ┌─ Test Progress ─────────────────────────────────
        </Text>
      </Box>

      {steps.map((step, i) => {
        const isRunning = step.status === "running";

        return (
          <Box key={i} flexDirection="column" paddingLeft={1}>
            <Box gap={1}>
              <Text color={STATUS_COLOR[step.status]}>
                {isRunning ? spinnerFrame : STATUS_ICON[step.status]}
              </Text>
              <Text
                color={STATUS_COLOR[step.status]}
                bold={isRunning}
              >
                {step.name}
              </Text>
              {step.duration !== undefined && (
                <Text color="green" dimColor>
                  ({step.duration}ms)
                </Text>
              )}
            </Box>
            {step.details && (
              <Box paddingLeft={2}>
                <Text color="green" dimColor>
                  {step.details}
                </Text>
              </Box>
            )}
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text color="green" bold>
          └──────────────────────────────────────────────────
        </Text>
      </Box>

      <Box marginTop={1} gap={1}>
        <Text color="green" dimColor>
          Step {currentStep + 1}/{steps.length}
        </Text>
        <Text color="green">
          {steps.filter((s) => s.status === "passed").length} passed
        </Text>
        <Text color="redBright">
          {steps.filter((s) => s.status === "failed").length} failed
        </Text>
      </Box>
    </Box>
  );
}
