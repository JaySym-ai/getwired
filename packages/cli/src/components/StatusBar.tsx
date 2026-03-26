import React from "react";
import { Box, Text } from "ink";

interface StatusBarProps {
  status: "idle" | "testing" | "analyzing" | "reporting" | "error";
  message?: string;
  projectName?: string;
}

const STATUS_COLORS: Record<StatusBarProps["status"], string> = {
  idle: "gray",
  testing: "greenBright",
  analyzing: "yellow",
  reporting: "cyan",
  error: "redBright",
};

const STATUS_LABELS: Record<StatusBarProps["status"], string> = {
  idle: "IDLE",
  testing: "TESTING",
  analyzing: "ANALYZING",
  reporting: "REPORT",
  error: "ERROR",
};

export function StatusBar({ status, message, projectName }: StatusBarProps) {
  const color = STATUS_COLORS[status];

  return (
    <Box
      borderStyle="single"
      borderColor="green"
      paddingX={1}
      justifyContent="space-between"
    >
      <Box gap={1}>
        <Text color={color} bold>
          ◆ {STATUS_LABELS[status]}
        </Text>
        {message && <Text color="green">{message}</Text>}
      </Box>
      {projectName && (
        <Text color="green" dimColor>
          {projectName}
        </Text>
      )}
    </Box>
  );
}
