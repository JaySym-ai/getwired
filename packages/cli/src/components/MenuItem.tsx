import React from "react";
import { Box, Text } from "ink";

interface MenuItemProps {
  label: string;
  description: string;
  hotkey: string;
  isSelected: boolean;
}

export function MenuItem({
  label,
  description,
  hotkey,
  isSelected,
}: MenuItemProps) {
  return (
    <Box gap={1}>
      <Text color={isSelected ? "greenBright" : "green"} bold={isSelected}>
        {isSelected ? " ▸ " : "   "}
      </Text>
      <Text
        color={isSelected ? "greenBright" : "green"}
        bold={isSelected}
        underline={isSelected}
      >
        [{hotkey}]
      </Text>
      <Text color={isSelected ? "greenBright" : "green"} bold={isSelected}>
        {label}
      </Text>
      <Text color="green" dimColor>
        — {description}
      </Text>
    </Box>
  );
}
