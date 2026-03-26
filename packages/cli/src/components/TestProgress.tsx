import React, { useState, useEffect } from "react";
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

export function TestProgress({ steps, currentStep }: TestProgressProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text color="green" bold>
          ┌─ Test Progress ─────────────────────────────────
        </Text>
      </Box>

      {steps.map((step, i) => (
        <Box key={i} gap={1} paddingLeft={1}>
          <Text color={STATUS_COLOR[step.status]}>
            {STATUS_ICON[step.status]}
          </Text>
          <Text
            color={STATUS_COLOR[step.status]}
            bold={step.status === "running"}
          >
            {step.name}
            {step.status === "running" ? dots : ""}
          </Text>
          {step.duration !== undefined && (
            <Text color="green" dimColor>
              ({step.duration}ms)
            </Text>
          )}
        </Box>
      ))}

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
