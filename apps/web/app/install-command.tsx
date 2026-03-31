"use client";

import { useState } from "react";
import posthog from "posthog-js";

const defaultCommand = "npm install -g getwired";

export function InstallCommand({ command = defaultCommand }: { command?: string } = {}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(command);
    posthog.capture("command_copied", { command });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-4 rounded-lg border border-emerald-500/20 bg-black/60 px-6 py-3 font-mono text-sm text-emerald-300 backdrop-blur-sm transition hover:border-emerald-400/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-pointer"
      aria-label={copied ? "Copied install command to clipboard" : "Copy install command to clipboard"}
    >
      <span>
        <span className="text-emerald-500">$ </span>
        {command}
      </span>
      <span className="ml-2 text-emerald-600 transition group-hover:text-emerald-400" aria-hidden="true">
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
        )}
      </span>
      <span className="sr-only" aria-live="polite">{copied ? "Copied!" : ""}</span>
    </button>
  );
}
