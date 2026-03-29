import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Test Modes",
  description:
    "Learn about GetWired test modes: standard testing, regression testing, baseline snapshots, and scoped test runs for targeted QA.",
  alternates: { canonical: "https://getwired.dev/docs/test-modes" },
};

export default function TestModes() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-emerald-400 tracking-wider">
        [TEST-MODES]
      </h1>
      <p className="mt-2 font-mono text-sm text-emerald-500/50">
        Different ways to test your app.
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Standard Test</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          The default mode. GetWired explores your app like a chaotic human — clicking random links,
          submitting empty forms, entering XSS payloads, rage-clicking buttons, resizing windows to
          absurd dimensions. It reports everything it breaks.
        </p>
        <div className="mt-4 rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-sm text-green-400"
          style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}>
          $ getwired test
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Scoped Test</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          Focus testing on a specific area of your app. Useful when you know what you changed and
          want targeted chaos.
        </p>
        <div className="mt-4 rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-sm text-green-400"
          style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}>
          $ getwired test --scope checkout
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Regression Test</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          Compare the current state of your app against a previous baseline. GetWired takes screenshots
          and runs the same scenarios, then diffs the results to find regressions.
        </p>
        <div className="mt-4 rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-sm text-green-400"
          style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}>
          $ getwired test --commit HEAD~1
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">PR Test</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          Test against a specific pull request. GetWired checks out the PR branch, runs against it,
          and compares with the base branch to find issues introduced by the PR.
        </p>
        <div className="mt-4 rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-sm text-green-400"
          style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}>
          $ getwired test --pr 42
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Device Profiles</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          Test on desktop, mobile, or both. GetWired uses real browser profiles via agent-browser to simulate
          different devices and screen sizes.
        </p>
        <div className="mt-4 rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-sm text-green-400"
          style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}>
          $ getwired test --device mobile
        </div>
      </section>

      <div className="mt-12 flex justify-between">
        <Link
          href="/docs/providers"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          &larr; Providers
        </Link>
        <Link
          href="/docs/reports"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          Next: Reports &rarr;
        </Link>
      </div>
    </div>
  );
}
