import { useState, useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";

interface ProviderStreamProps {
  output: string;
  providerName?: string;
  maxLines?: number;
  isStreaming?: boolean;
  reportId?: string;
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
  maxLines = 25,
  isStreaming = true,
  reportId,
}: ProviderStreamProps) {
  const [tick, setTick] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const lastOutputLen = useRef(output.length);
  const lastLineCount = useRef(output.split("\n").length);
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

  // Extract report folder ID from output if not passed as prop
  const extractedReportId = !reportId
    ? output.match(/Report folder: (gw-[a-z0-9-]+)/)?.[1]
    : undefined;

  // Split output into lines and take the current window
  const allLines = output.split("\n");
  const hasOverflow = allLines.length > maxLines;
  const maxScrollOffset = Math.max(0, allLines.length - maxLines);

  useEffect(() => {
    const nextLineCount = allLines.length;
    const lineDelta = nextLineCount - lastLineCount.current;
    lastLineCount.current = nextLineCount;

    setScrollOffset((prev) => {
      const nextOffset = lineDelta > 0 && prev > 0 ? prev + lineDelta : prev;
      return Math.min(maxScrollOffset, Math.max(0, nextOffset));
    });
  }, [allLines.length, maxScrollOffset]);

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setScrollOffset((prev) => Math.min(maxScrollOffset, prev + 1));
      return;
    }

    if (key.downArrow || input === "j") {
      setScrollOffset((prev) => Math.max(0, prev - 1));
      return;
    }

    if (key.pageUp || input === "u") {
      setScrollOffset((prev) => Math.min(maxScrollOffset, prev + maxLines));
      return;
    }

    if (key.pageDown || input === "d") {
      setScrollOffset((prev) => Math.max(0, prev - maxLines));
      return;
    }

    if (key.end || input === "G") {
      setScrollOffset(0);
    }
  }, { isActive: hasOverflow });

  const start = Math.max(0, allLines.length - maxLines - scrollOffset);
  const visible = allLines.slice(start, start + maxLines);

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
        {(reportId || extractedReportId) && (
          <Text color="gray">
            [{reportId || extractedReportId}]
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
              {isLastLine && isStreaming && scrollOffset === 0 ? (
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
        {hasOverflow && scrollOffset > 0 && (
          <Text color="green" dimColor>
            ↓ {scrollOffset} new lines · [↑↓] scroll · [G] latest
          </Text>
        )}
        {hasOverflow && scrollOffset === 0 && (
          <Text color="green" dimColor>
            (showing last {maxLines}) · [↑↓] scroll
          </Text>
        )}
      </Box>
    </Box>
  );
}
