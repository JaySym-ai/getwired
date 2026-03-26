import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Header } from "./Header.js";
import { StatusBar } from "./StatusBar.js";
import { TestProgress } from "./TestProgress.js";

interface RunCommandProps {
  options: {
    url?: string;
    commit?: string;
    pr?: string;
    scope?: string;
  };
}

const DEMO_STEPS = [
  { name: "Discovering project structure", status: "passed" as const, duration: 320 },
  { name: "Loading project notes & context", status: "passed" as const, duration: 45 },
  { name: "Identifying test targets", status: "passed" as const, duration: 180 },
  { name: "Testing navigation flows", status: "running" as const },
  { name: "Testing form interactions", status: "pending" as const },
  { name: "Testing API responses", status: "pending" as const },
  { name: "Checking accessibility", status: "pending" as const },
  { name: "Generating report", status: "pending" as const },
];

export function RunCommand({ options }: RunCommandProps) {
  const [steps, setSteps] = useState(DEMO_STEPS);
  const currentStep = steps.findIndex((s) => s.status === "running");

  const mode = options.commit
    ? `Regression · commit ${options.commit.slice(0, 7)}`
    : options.pr
      ? `Regression · PR #${options.pr}`
      : options.url
        ? `Testing · ${options.url}`
        : "Full Test Suite";

  return (
    <Box flexDirection="column">
      <Header subtitle={mode} />

      <StatusBar
        status="testing"
        message={
          currentStep >= 0
            ? steps[currentStep].name
            : "Preparing..."
        }
      />

      <Box marginY={1}>
        <TestProgress steps={steps} currentStep={Math.max(0, currentStep)} />
      </Box>

      {options.scope && (
        <Box paddingX={2}>
          <Text color="green" dimColor>
            Scope: {options.scope}
          </Text>
        </Box>
      )}

      <Box paddingX={2} marginTop={1} gap={2}>
        <Text color="green" dimColor>
          [Ctrl+C] Cancel
        </Text>
        <Text color="green" dimColor>
          [p] Pause
        </Text>
      </Box>
    </Box>
  );
}
