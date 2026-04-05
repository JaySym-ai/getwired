import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Configuration",
  description:
    "Configure GetWired: .getwired directory structure, getwired.config.json settings, test notes, provider configuration, and project-level options.",
  alternates: { canonical: "https://getwired.dev/docs/configuration" },
};

export default function Configuration() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-emerald-400 tracking-wider">
        [CONFIGURATION]
      </h1>
      <p className="mt-2 font-mono text-sm text-emerald-500/50">
        Settings, notes, and project config.
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Config Directory</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          After running <code className="text-emerald-400">getwired init</code>, a <code className="text-emerald-400">.getwired/</code> directory
          is created in your project root. Run all GetWired commands from that same project folder:
        </p>
        <div className="mt-4 rounded-lg border border-emerald-500/15 bg-black/40 p-5 font-mono text-xs text-emerald-500/60">
          <div className="text-emerald-400 mb-2">.getwired/</div>
          <div className="ml-4 flex flex-col gap-0.5">
            <div>config.json <span className="text-emerald-500/30">— provider, local URL, device settings</span></div>
            <div>notes.md <span className="text-emerald-500/30">— testing notes for the AI</span></div>
            <div>baselines/ <span className="text-emerald-500/30">— baseline screenshots for regression</span></div>
            <div>reports/ <span className="text-emerald-500/30">— test reports</span></div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Settings</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          Configure GetWired via the interactive dashboard or by editing <code className="text-emerald-400">.getwired/config.json</code> directly:
        </p>
        <p className="mt-3 font-mono text-xs text-emerald-500/40 leading-relaxed">
          If you set a URL manually, it must point to your local app on <code className="text-emerald-400">localhost</code> or
          another loopback address. Remote deployed websites are rejected.
        </p>
        <div className="mt-4 rounded-lg border border-emerald-500/15 bg-black/40 p-5 font-mono text-xs">
          <pre className="text-emerald-500/60 leading-relaxed whitespace-pre">{`{
  "provider": "claude-code",
  "url": "http://localhost:3000",
  "device": "both",
  "scope": null,
  "screenshotsEnabled": true,
  "accessibilityAudit": true
}`}</pre>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Notes</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          The <code className="text-emerald-400">.getwired/notes.md</code> file lets you give the AI context about
          your app. Add known issues, areas to focus on, or things to skip. The AI reads these before every test run.
        </p>
        <div className="mt-4 rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-xs text-emerald-500/50 leading-relaxed">
          <div className="text-emerald-400"># Testing Notes</div>
          <div className="mt-1">- The /admin route requires auth, skip it for now</div>
          <div>- Focus on the checkout flow, we just rewrote it</div>
          <div>- Known issue: date picker is broken on Safari</div>
        </div>
      </section>

      <div className="mt-12 flex justify-between">
        <Link
          href="/docs/mcp"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          &larr; MCP
        </Link>
        <Link
          href="/docs/authentication"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          Next: Authentication &rarr;
        </Link>
      </div>
    </div>
  );
}
