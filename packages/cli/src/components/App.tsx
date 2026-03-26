import React, { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { Header } from "./Header.js";
import { StatusBar } from "./StatusBar.js";
import { MenuItem } from "./MenuItem.js";

interface AppProps {
  mode: "init" | "dashboard";
}

const MENU_ITEMS = [
  {
    label: "Run Tests",
    description: "Start a new test session",
    hotkey: "t",
  },
  {
    label: "Regression Check",
    description: "Test against a commit or PR",
    hotkey: "r",
  },
  {
    label: "View Reports",
    description: "Browse past test reports",
    hotkey: "v",
  },
  {
    label: "Project Notes",
    description: "View learned project context",
    hotkey: "n",
  },
  {
    label: "Settings",
    description: "Configure GetWired",
    hotkey: "s",
  },
];

export function App({ mode }: AppProps) {
  const { exit } = useApp();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (input === "q" || (key.ctrl && input === "c")) {
      exit();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(MENU_ITEMS.length - 1, prev + 1));
    }
  });

  if (mode === "init") {
    return <InitView />;
  }

  return (
    <Box flexDirection="column">
      <Header />

      <StatusBar status="idle" message="Ready" />

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
              isSelected={i === selectedIndex}
            />
          ))}
        </Box>
        <Text color="green" bold>
          └──────────────────────────────────────────────────
        </Text>
      </Box>

      <Box paddingX={2} gap={2}>
        <Text color="green" dimColor>
          [↑↓] Navigate
        </Text>
        <Text color="green" dimColor>
          [Enter] Select
        </Text>
        <Text color="green" dimColor>
          [q] Quit
        </Text>
      </Box>
    </Box>
  );
}

function InitView() {
  const [step, setStep] = useState(0);

  return (
    <Box flexDirection="column">
      <Header subtitle="Project Setup" />

      <Box flexDirection="column" paddingX={2} gap={1}>
        <Text color="greenBright" bold>
          ◆ Initializing GetWired...
        </Text>
        <Text color="green">
          {"  "}Scanning project structure...
        </Text>
        <Text color="green" dimColor>
          {"  "}This will create a .getwired/ directory to store project context.
        </Text>
      </Box>
    </Box>
  );
}
