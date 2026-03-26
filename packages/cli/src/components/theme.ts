import chalk from "chalk";

export const theme = {
  primary: chalk.green,
  primaryBold: chalk.greenBright.bold,
  secondary: chalk.hex("#10B981"),
  dim: chalk.green.dim,
  accent: chalk.hex("#34D399"),
  muted: chalk.gray,
  error: chalk.redBright,
  warning: chalk.yellowBright,
  success: chalk.greenBright,
  border: chalk.green.dim,
  title: chalk.greenBright.bold,
  subtitle: chalk.hex("#10B981").dim,
  url: chalk.hex("#34D399").underline,
  key: chalk.greenBright,
  value: chalk.white,
};

export const symbols = {
  bullet: "●",
  dash: "─",
  corner: {
    topLeft: "┌",
    topRight: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
  },
  vertical: "│",
  horizontal: "─",
  arrow: "▸",
  check: "✔",
  cross: "✘",
  dot: "·",
  ellipsis: "…",
  star: "★",
  pulse: "◆",
};
