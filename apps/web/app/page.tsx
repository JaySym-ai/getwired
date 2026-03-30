import { TerminalDemo } from "./terminal-demo";
import { InstallCommand } from "./install-command";
import Image from "next/image";

function ProviderLogo({ name, src, alt }: { name: string; src: string; alt: string }) {
  return (
    <div className="flex items-center gap-2 rounded border border-emerald-500/10 bg-black/40 px-4 py-2 transition hover:border-emerald-500/30 hover:bg-emerald-950/30">
      <Image src={src} alt={alt} width={20} height={20} />
      <span className="font-mono text-xs text-emerald-500">{name}</span>
    </div>
  );
}

export default function Home() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center bg-black">
      {/* Top banner */}
      <div
        className="w-full border-b border-emerald-500/20 py-2 text-center"
        role="banner"
        style={{
          background: "linear-gradient(90deg, rgba(6,78,59,0.3) 0%, transparent 50%, rgba(6,78,59,0.3) 100%)",
          boxShadow: "0 0 24px rgba(16, 185, 129, 0.1)",
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-xs text-emerald-500">
            Community-driven · Built with{" "}
            <a
              href="https://pxllnk.co/intent-getwired"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition"
            >
              Intent
            </a>
            {" "}by{" "}
            <a
              href="https://www.reddit.com/r/AugmentCodeAI/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition"
            >
              Augment Code Community
            </a>
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Hero */}
      <header className="flex flex-col items-center px-4 pt-20 pb-16">
        <pre
          className="text-emerald-400 font-mono text-[8px] leading-tight sm:text-[10px] md:text-xs whitespace-pre select-none"
          aria-label="GetWired"
          role="img"
        >
{`  ██████╗ ███████╗████████╗██╗    ██╗██╗██████╗ ███████╗██████╗
 ██╔════╝ ██╔════╝╚══██╔══╝██║    ██║██║██╔══██╗██╔════╝██╔══██╗
 ██║  ███╗█████╗     ██║   ██║ █╗ ██║██║██████╔╝█████╗  ██║  ██║
 ██║   ██║██╔══╝     ██║   ██║███╗██║██║██╔══██╗██╔══╝  ██║  ██║
 ╚██████╔╝███████╗   ██║   ╚███╔███╔╝██║██║  ██║███████╗██████╔╝
  ╚═════╝ ╚══════╝   ╚═╝    ╚══╝╚══╝ ╚═╝╚═╝  ╚═╝╚══════╝╚═════╝`}
        </pre>
        <h1 className="mt-4 font-mono text-base tracking-wide text-emerald-300/70 md:text-lg">
          The CLI that tests your app like a crazy QA tester
        </h1>
        <p className="mt-3 max-w-xl text-center font-mono text-sm text-emerald-500 leading-relaxed">
          One command. AI opens your app in a browser, clicks everything,
          types garbage into every field, rage-refreshes, finds that one XSS
          you swore you fixed, and writes you a report. No test scripts.
          No config files. Just chaos with a purpose.
        </p>
      </header>

      {/* Install command */}
      <section className="w-full px-4 pb-10 flex flex-col items-center">
        <p className="mb-4 font-mono text-sm text-emerald-400">
          Let the chaos begin — break your app before your users do.
        </p>
        <InstallCommand />
      </section>

      {/* Supported AI Providers */}
      <section className="w-full border-t border-emerald-500/10 py-8 flex flex-col items-center">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-emerald-600">
          Supported AI Providers
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          <ProviderLogo name="Auggie" src="/logos/auggie.svg" alt="Auggie by Augment Code — AI testing provider" />
          <ProviderLogo name="Claude Code" src="/logos/claude-code.svg" alt="Claude Code by Anthropic — AI testing provider" />
          <ProviderLogo name="Codex" src="/logos/codex.svg" alt="Codex by OpenAI — AI testing provider" />
          <ProviderLogo name="OpenCode" src="/logos/opencode.svg" alt="OpenCode — AI testing provider" />
        </div>
      </section>

      {/* Interactive Terminal Demo */}
      <section
        className="w-full px-4 py-20 flex flex-col items-center border-t border-emerald-500/10"
        aria-label="Live demo of GetWired AI testing CLI"
      >
        <h2 className="sr-only">See GetWired in Action</h2>
        <p className="text-center text-sm text-gray-400 mb-6 max-w-2xl leading-relaxed">
          Recommended place to run it is in{" "}
          <a
            href="https://pxllnk.co/intent-getwired"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition"
          >
            Intent
          </a>
          . Also works in any terminal, IDE integrated terminal, or CI environment.
        </p>
        <TerminalDemo />
      </section>

      {/* How it works — SEO-rich content section */}
      <section className="w-full border-t border-emerald-500/10 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-mono text-lg font-bold text-emerald-400 tracking-wider text-center mb-10">
            How It Works (It&apos;s Stupidly Simple)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <article className="rounded-lg border border-emerald-500/15 bg-black/40 p-6">
              <h3 className="font-mono text-sm font-bold text-emerald-300">1. Point It at Your App</h3>
              <p className="mt-3 font-mono text-xs text-emerald-500 leading-relaxed">
                Run <code className="text-emerald-400">npx getwired init</code> in your project.
                It detects your framework and dev server. That&apos;s the entire setup.
                No YAML. No 200-line config. Just go.
              </p>
            </article>
            <article className="rounded-lg border border-emerald-500/15 bg-black/40 p-6">
              <h3 className="font-mono text-sm font-bold text-emerald-300">2. AI Goes Full Gremlin</h3>
              <p className="mt-3 font-mono text-xs text-emerald-500 leading-relaxed">
                Pick your AI (Claude Code, Auggie, Codex, or OpenCode). It opens a
                real browser and does everything your most chaotic user would —
                rage-clicks, submits forms with emoji, resizes to 200px, finds
                your unlocked admin page.
              </p>
            </article>
            <article className="rounded-lg border border-emerald-500/15 bg-black/40 p-6">
              <h3 className="font-mono text-sm font-bold text-emerald-300">3. Read the Damage Report</h3>
              <p className="mt-3 font-mono text-xs text-emerald-500 leading-relaxed">
                You get an HTML report with screenshots, bug descriptions, XSS
                findings, and severity ratings. Fix the embarrassing stuff before
                your users find it. Ship with confidence (or at least fewer nightmares).
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Footer with nav */}
      <footer className="w-full border-t border-emerald-500/20 py-8">
        <nav className="flex flex-col items-center gap-3" aria-label="Footer navigation">
          <div className="flex gap-3">
            <a
              href="https://github.com/JaySym-ai/getwired"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
            >
              GitHub
            </a>
            <a
              href="/docs"
              className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
            >
              Docs
            </a>
          </div>
          <p className="font-mono text-[10px] text-emerald-600">
            &copy; 2026 GetWired &mdash; Open-source AI-powered testing CLI
          </p>
        </nav>
      </footer>
    </main>
  );
}
