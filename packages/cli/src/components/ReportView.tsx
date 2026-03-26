import React from "react";
import { Box, Text } from "ink";
import { Header } from "./Header.js";

interface ReportViewProps {
  reportId?: string;
}

export function ReportView({ reportId }: ReportViewProps) {
  return (
    <Box flexDirection="column">
      <Header subtitle="Test Report" />

      <Box flexDirection="column" paddingX={2}>
        <Box
          borderStyle="single"
          borderColor="green"
          flexDirection="column"
          paddingX={2}
          paddingY={1}
        >
          <Box justifyContent="space-between" marginBottom={1}>
            <Text color="greenBright" bold>
              Report #{reportId ?? "latest"}
            </Text>
            <Text color="green" dimColor>
              {new Date().toISOString().split("T")[0]}
            </Text>
          </Box>

          <Box flexDirection="column" gap={1}>
            <Box gap={1}>
              <Text color="green">✔</Text>
              <Text color="green">12 tests passed</Text>
            </Box>
            <Box gap={1}>
              <Text color="redBright">✘</Text>
              <Text color="redBright">2 tests failed</Text>
            </Box>
            <Box gap={1}>
              <Text color="yellow">⊘</Text>
              <Text color="yellow">1 test skipped</Text>
            </Box>
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text color="greenBright" bold>
              ── Findings ──────────────────────────
            </Text>
            <Box paddingLeft={1} flexDirection="column" marginTop={1}>
              <Text color="redBright">
                ✘ Login form: missing error state for invalid credentials
              </Text>
              <Text color="redBright">
                ✘ Checkout: price calculation off by 1 cent on tax rounding
              </Text>
            </Box>
          </Box>

          <Box marginTop={1} flexDirection="column">
            <Text color="greenBright" bold>
              ── Notes ─────────────────────────────
            </Text>
            <Box paddingLeft={1} marginTop={1}>
              <Text color="green" dimColor>
                Project uses React 19 with server components. Auth via Clerk.
                Testing focused on user-facing flows.
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box paddingX={2} marginTop={1} gap={2}>
        <Text color="green" dimColor>
          [e] Export
        </Text>
        <Text color="green" dimColor>
          [q] Quit
        </Text>
      </Box>
    </Box>
  );
}
