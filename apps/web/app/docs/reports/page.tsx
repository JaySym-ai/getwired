import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reports",
  description:
    "Understand GetWired test reports: output location, HTML report format, screenshots, bug descriptions, and regression comparison details.",
  alternates: { canonical: "https://getwired.dev/docs/reports" },
};

export default function Reports() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-emerald-400 tracking-wider">
        [REPORTS]
      </h1>
      <p className="mt-2 font-mono text-sm text-emerald-500/50">
        Where outputs are saved and how to read them.
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Report Location</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          All test reports are saved to the <code className="text-emerald-400">.getwired/reports/</code> directory
          in your project. Each report includes an HTML file you can open in your browser and a JSON file
          for programmatic access.
        </p>
        <div className="mt-4 rounded-lg border border-emerald-500/15 bg-black/40 p-5 font-mono text-xs text-emerald-500/60">
          <div className="text-emerald-400 mb-2">.getwired/reports/</div>
          <div className="ml-4">
            <div>2026-03-28-143022/</div>
            <div className="ml-4 text-emerald-500/40">
              <div>report.html</div>
              <div>report.json</div>
              <div>screenshots/</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Viewing Reports</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          Use the CLI to list and view reports, or open the HTML file directly:
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <div className="rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-sm text-green-400"
            style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}>
            <span className="text-emerald-600">$</span> getwired report
          </div>
          <div className="rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-sm text-green-400"
            style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}>
            <span className="text-emerald-600">$</span> getwired report --id latest
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">What&apos;s in a Report</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          Each report contains:
        </p>
        <ul className="mt-3 flex flex-col gap-2 ml-4">
          {[
            "Findings — bugs, broken layouts, vulnerabilities, and edge cases discovered",
            "Screenshots — before/after captures for visual regression",
            "Scenarios executed — what the AI tried and what happened",
            "Accessibility audit — keyboard navigation, focus indicators, ARIA issues",
            "Severity ratings — critical, warning, and info classifications",
          ].map((item) => (
            <li key={item} className="font-mono text-xs text-emerald-500/50 leading-relaxed">
              <span className="text-emerald-400 mr-2">&rarr;</span>{item}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 flex justify-between">
        <Link
          href="/docs/test-modes"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          &larr; Test Modes
        </Link>
        <Link
          href="/docs/mcp"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          Next: MCP &rarr;
        </Link>
      </div>
    </div>
  );
}
