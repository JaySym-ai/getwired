"use client";

import { useEffect, useState } from "react";

const demoLines = [
  { type: "cmd", text: "user@dev:~/my-project $ npx getwired test" },
  { type: "info", text: "🔌 Connected to default provider" },
  { type: "info", text: "🌐 Detected dev server at http://localhost:3000" },
  { type: "action", text: "→ Clicking random nav links like a lost user..." },
  { type: "action", text: '→ Typing "asdkjh" into the search bar...' },
  { type: "action", text: "→ Smashing the back button 5 times..." },
  { type: "action", text: "→ Submitting empty form with no fields filled..." },
  { type: "warn", text: "⚠ Found: Form submitted without validation error!" },
  { type: "action", text: '→ Entering "<script>alert(1)</script>" in name field...' },
  { type: "warn", text: "⚠ Found: XSS payload reflected in DOM!" },
  { type: "action", text: "→ Triple-clicking logo like a confused user..." },
  { type: "action", text: "→ Resizing window to 200x100 like a phone from 2007..." },
  { type: "warn", text: "⚠ Found: Layout completely broken at 200px width" },
  { type: "action", text: "→ Rage-clicking the submit button 47 times..." },
  { type: "warn", text: "⚠ Found: 47 duplicate requests sent to /api/submit!" },
  { type: "action", text: "→ Pasting a 50,000 character essay into the bio field..." },
  { type: "info", text: "📸 Taking screenshot for regression analysis..." },
  { type: "result", text: "✅ Test complete: 4 issues found, 0 regressions" },
  { type: "result", text: "📄 Report saved to ./getwired-report.html" },
];

const colorFor = (type: string) => {
  switch (type) {
    case "cmd":
      return "text-green-400";
    case "info":
      return "text-emerald-300/90";
    case "action":
      return "text-gray-400";
    case "warn":
      return "text-yellow-400";
    case "result":
      return "text-emerald-400 font-semibold";
    default:
      return "text-gray-400";
  }
};

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    if (visibleLines < demoLines.length) {
      const delay =
        demoLines[visibleLines]?.type === "cmd"
          ? 1200
          : visibleLines === 0
            ? 500
            : 600 + Math.random() * 400;
      const timer = setTimeout(() => setVisibleLines((v) => v + 1), delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setVisibleLines(0), 4000);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  return (
    <div
      className="w-full max-w-6xl rounded-lg border border-emerald-500/30 overflow-hidden"
      role="region"
      aria-label="Terminal demo showing GetWired AI testing in action"
      style={{
        boxShadow: "0 0 40px rgba(16, 185, 129, 0.15), 0 0 80px rgba(16, 185, 129, 0.05)",
      }}
    >
      {/* Terminal header */}
      <div className="bg-emerald-950/40 border-b border-emerald-500/20 px-4 py-3 flex items-center gap-3">
        <div className="flex gap-2" aria-hidden="true">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
        </div>
        <span className="font-mono text-xs text-emerald-400/60">getwired — ~/my-project</span>
      </div>
      {/* Terminal body */}
      <div
        className="bg-black/95 p-6 font-mono text-sm leading-relaxed relative overflow-hidden"
        style={{ height: 340 }}
      >
        <div className="absolute bottom-6 left-6 right-6">
          {demoLines.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              className={`${colorFor(line.type)} ${i === visibleLines - 1 ? "animate-pulse" : ""}`}
            >
              {line.text}
            </div>
          ))}
          {visibleLines < demoLines.length && (
            <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse mt-1" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}
