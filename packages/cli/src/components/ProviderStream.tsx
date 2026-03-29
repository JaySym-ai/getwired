import React, { useState, useEffect, useRef } from "react";
import { Box, Text } from "ink";

interface ProviderStreamProps {
  output: string;
  providerName?: string;
  maxLines?: number;
  isStreaming?: boolean;
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ${secs % 60}s`;
}

export function ProviderStream({
  output,
  providerName,
  maxLines = 10,
  isStreaming = true,
}: ProviderStreamProps) {
  const [tick, setTick] = useState(0);
  const lastOutputLen = useRef(output.length);
  const lastChangeTime = useRef(Date.now());

  // Single timer drives both cursor blink and spinner
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 120);
    return () => clearInterval(timer);
  }, []);

  // Track when output last changed
  useEffect(() => {
    if (output.length !== lastOutputLen.current) {
      lastOutputLen.current = output.length;
      lastChangeTime.current = Date.now();
    }
  }, [output]);

  const cursorVisible = tick % 8 < 4;
  const spinnerFrame = SPINNER_FRAMES[tick % SPINNER_FRAMES.length];
  const silentFor = Date.now() - lastChangeTime.current;

  // Split output into lines and take the last N
  const allLines = output.split("\n");
  const visible = allLines.slice(-maxLines);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="green"
      paddingX={1}
      paddingY={0}
      width="100%"
      height="100%"
      flexGrow={0}
      flexShrink={0}
      overflowY="hidden"
    >
      {/* Header */}
      <Box gap={1} marginBottom={0}>
        <Text color="greenBright" bold>
          {providerName ?? "Provider"} Output
        </Text>
        {isStreaming && (
          <Text color="green">
            {spinnerFrame} LIVE
          </Text>
        )}
      </Box>

      {/* Output lines */}
      <Box flexDirection="column" flexGrow={1}>
        {visible.length === 0 && (
          <Text color="green" dimColor>
            Waiting for provider response...
          </Text>
        )}
        {visible.map((line, i) => {
          const isCommand = line.startsWith("> ");
          const isError = line.startsWith("  !") || line.startsWith("!");
          const isTool = line.startsWith("[tool:");
          const isLastLine = i === visible.length - 1;

          return (
            <Text
              key={i}
              color={
                isCommand ? "greenBright" :
                isError ? "redBright" :
                isTool ? "cyan" :
                "green"
              }
              bold={isCommand}
              dimColor={!isCommand && !isError && !isTool}
              wrap="truncate"
            >
              {line}
              {isLastLine && isStreaming ? (
                <Text color={cursorVisible ? "greenBright" : "gray"}>█</Text>
              ) : null}
            </Text>
          );
        })}

        {/* Activity indicator — always rendered to keep height stable */}
        <Box marginTop={1}>
          <Text color="green" dimColor>
            {isStreaming && silentFor > 3000
              ? `${spinnerFrame} working... ${formatElapsed(silentFor).padEnd(6)}`
              : " "}
          </Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box>
        <Text color="green" dimColor>
          {"─".repeat(30)}
        </Text>
      </Box>
      <Box gap={1}>
        <Text color="green" dimColor>
          {allLines.length} lines
        </Text>
        {allLines.length > maxLines && (
          <Text color="green" dimColor>
            (showing last {maxLines})
          </Text>
        )}
      </Box>
    </Box>
  );
}
