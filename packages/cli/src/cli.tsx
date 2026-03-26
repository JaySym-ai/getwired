import { program } from "commander";
import { render } from "ink";
import React from "react";
import { App } from "./components/App.js";
import { RunCommand } from "./components/RunCommand.js";
import { ReportView } from "./components/ReportView.js";

program
  .name("getwired")
  .description("AI-powered testing CLI that mimics a human tester")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize GetWired in the current project")
  .action(() => {
    render(<App mode="init" />);
  });

program
  .command("test")
  .description("Run tests on your project")
  .option("-u, --url <url>", "URL to test")
  .option("-c, --commit <id>", "Test against a specific commit for regression")
  .option("-p, --pr <id>", "Test against a specific pull request")
  .option("--scope <scope>", "Scope of testing (e.g. auth, checkout, navigation)")
  .action((options) => {
    render(<RunCommand options={options} />);
  });

program
  .command("report")
  .description("View the latest test report")
  .option("-i, --id <id>", "View a specific report by ID")
  .action((options) => {
    render(<ReportView reportId={options.id} />);
  });

program
  .command("dashboard", { isDefault: true })
  .description("Open the interactive dashboard")
  .action(() => {
    render(<App mode="dashboard" />);
  });

program.parse();
