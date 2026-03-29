import { TerminalDemo } from "./terminal-demo";
import { InstallCommand } from "./install-command";
import Image from "next/image";

function ProviderLogo({ name, src, alt }: { name: string; src: string; alt: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-500/10 bg-black/40 px-8 py-5 transition hover:border-emerald-500/30 hover:bg-emerald-950/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]">
      <div className="h-10 w-10 flex items-center justify-center text-emerald-400">
        <Image src={src} alt={alt} width={32} height={32} />
      </div>
      <span className="font-mono text-xs text-emerald-500/70">{name}</span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black">
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
          <span className="rounded border border-emerald-400/40 bg-black/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
            Alpha
          </span>
          <span className="font-mono text-xs text-emerald-500/60">
            Early preview — features may change
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
          Human-Like AI Testing CLI
        </h1>
        <p className="mt-2 max-w-lg text-center font-mono text-sm text-emerald-500/50">
          Break your app before your users do. Harness AI to test like a real
          (chaotic) human — find bugs, XSS vulnerabilities, broken layouts, and
          edge cases automatically.
        </p>
        <p className="mt-4 font-mono text-[11px] text-emerald-500/30">
          Community-driven &middot; Built with Intent from Augment Code
        </p>
      </header>

      {/* Install command */}
      <section className="w-full px-4 pb-10 flex flex-col items-center">
        <InstallCommand />
      </section>

      {/* Supported AI Providers */}
      <section className="w-full border-t border-emerald-500/10 py-16 flex flex-col items-center">
        <h2 className="mb-8 font-mono text-xs uppercase tracking-widest text-emerald-500/40">
          Supported AI Providers
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <ProviderLogo name="Claude Code" src="/logos/claude-code.svg" alt="Claude Code by Anthropic — AI testing provider" />
          <ProviderLogo name="Auggie" src="/logos/auggie.svg" alt="Auggie by Augment Code — AI testing provider" />
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
        <TerminalDemo />
      </section>

      {/* How it works — SEO-rich content section */}
      <section className="w-full border-t border-emerald-500/10 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-mono text-lg font-bold text-emerald-400 tracking-wider text-center mb-10">
            How GetWired Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <article className="rounded-lg border border-emerald-500/15 bg-black/40 p-6">
              <h3 className="font-mono text-sm font-bold text-emerald-300">1. Install &amp; Init</h3>
              <p className="mt-3 font-mono text-xs text-emerald-500/50 leading-relaxed">
                Run <code className="text-emerald-400">npx getwired init</code> in your project.
                GetWired detects your framework, dev server, and routes automatically.
              </p>
            </article>
            <article className="rounded-lg border border-emerald-500/15 bg-black/40 p-6">
              <h3 className="font-mono text-sm font-bold text-emerald-300">2. AI Tests Like a Human</h3>
              <p className="mt-3 font-mono text-xs text-emerald-500/50 leading-relaxed">
                Your chosen AI provider (Claude Code, Auggie, Codex, or OpenCode)
                explores your app like a chaotic real user — clicking, typing garbage,
                rage-clicking, and testing edge cases.
              </p>
            </article>
            <article className="rounded-lg border border-emerald-500/15 bg-black/40 p-6">
              <h3 className="font-mono text-sm font-bold text-emerald-300">3. Get a Report</h3>
              <p className="mt-3 font-mono text-xs text-emerald-500/50 leading-relaxed">
                GetWired generates detailed HTML reports with screenshots, bug
                descriptions, XSS findings, and regression comparisons saved to
                your project.
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
              className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
            >
              GitHub
            </a>
            <a
              href="/docs"
              className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
            >
              Docs
            </a>
          </div>
          <p className="font-mono text-[10px] text-emerald-500/30">
            &copy; 2026 GetWired &mdash; Open-source AI-powered testing CLI
          </p>
        </nav>
      </footer>
    </main>
  );
}
