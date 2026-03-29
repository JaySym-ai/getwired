import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Getting Started",
  description:
    "Install GetWired with npx, initialize your project, configure your AI provider, and run your first AI-driven chaotic test in minutes.",
  alternates: { canonical: "https://getwired.dev/docs/getting-started" },
};

export default function GettingStarted() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-emerald-400 tracking-wider">
        [GETTING-STARTED]
      </h1>
      <p className="mt-2 font-mono text-sm text-emerald-500/50">
        Install, launch, first run.
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Installation</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          GetWired runs directly via npx — no global install needed. Just run it from your project folder:
        </p>
        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-black/80 p-4 font-mono text-sm text-green-400"
          style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}>
          <span className="text-emerald-600">$</span> npx getwired
        </div>
        <p className="mt-3 font-mono text-xs text-emerald-500/40">
          Or install globally if you prefer:
        </p>
        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-black/80 p-4 font-mono text-sm text-green-400"
          style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}>
          <span className="text-emerald-600">$</span> npm install -g getwired
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Initialize your project</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          On first run, GetWired will scan your project to detect your framework, dev server, and routes.
          You can also run init explicitly to choose your AI provider:
        </p>
        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-black/80 p-4 font-mono text-sm text-green-400"
          style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}>
          <span className="text-emerald-600">$</span> npx getwired init --provider claude-code
        </div>
        <p className="mt-3 font-mono text-xs text-emerald-500/40">
          This creates a <code className="text-emerald-400">.getwired/</code> directory in your project with your configuration and test notes.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Run your first test</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          Make sure your dev server is running, then tell GetWired to break things:
        </p>
        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-black/80 p-4 font-mono text-sm text-green-400"
          style={{ boxShadow: "0 0 20px rgba(16, 185, 129, 0.06)" }}>
          <div><span className="text-emerald-600">$</span> npm run dev</div>
          <div className="mt-1"><span className="text-emerald-600">$</span> npx getwired test</div>
        </div>
        <p className="mt-3 font-mono text-xs text-emerald-500/40">
          GetWired auto-detects your localhost dev server and begins AI-driven chaotic testing.
          Results are saved to <code className="text-emerald-400">.getwired/reports/</code>.
        </p>
      </section>

      <div className="mt-12 flex justify-end">
        <Link
          href="/docs/commands"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          Next: Commands &rarr;
        </Link>
      </div>
    </div>
  );
}
