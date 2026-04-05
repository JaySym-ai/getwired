"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/docs", label: "INTRO" },
  { href: "/docs/getting-started", label: "GETTING-STARTED" },
  { href: "/docs/commands", label: "COMMANDS" },
  { href: "/docs/providers", label: "PROVIDERS" },
  { href: "/docs/test-modes", label: "TEST-MODES" },
  { href: "/docs/reports", label: "REPORTS" },
  { href: "/docs/mcp", label: "MCP" },
  { href: "/docs/configuration", label: "CONFIGURATION" },
  { href: "/docs/authentication", label: "AUTHENTICATION" },
  { href: "/docs/faq", label: "FAQ" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const activeLabel = NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "DOCS";

  return (
    <div className="flex min-h-screen bg-black">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-emerald-500/20 bg-black/95 p-6 overflow-y-auto md:block">
        <Link href="/" className="block mb-8">
          <span className="font-mono text-sm font-bold text-emerald-400 tracking-widest">
            GETWIRED
          </span>
          <span className="font-mono text-[10px] text-emerald-600 block mt-1">DOCS</span>
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Documentation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-2 font-mono text-xs transition ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/5 border border-transparent"
                }`}
              >
                [{item.label}]
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 pt-6 border-t border-emerald-500/10">
          <a
            href="https://github.com/JaySym-ai/getwired"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-emerald-600 hover:text-emerald-400 transition"
          >
            GitHub &rarr;
          </a>
        </div>
      </aside>

      {/* Mobile header + collapsible menu */}
      <div className="fixed inset-x-0 top-0 z-50 md:hidden">
        <div className="flex items-center justify-between border-b border-emerald-500/20 bg-black/95 px-4 py-3 backdrop-blur">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold text-emerald-400 tracking-widest">
              GETWIRED
            </span>
            <span className="font-mono text-[10px] text-emerald-600">DOCS</span>
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded border border-emerald-500/20 px-3 py-1.5 font-mono text-xs text-emerald-500 transition hover:border-emerald-400/50 hover:text-emerald-400"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            [{activeLabel}]
            <span
              className="inline-block transition-transform duration-200"
              style={{ transform: menuOpen ? "rotate(180deg)" : undefined }}
            >
              &#9662;
            </span>
          </button>
        </div>

        {menuOpen && (
          <nav
            id="mobile-nav"
            className="border-b border-emerald-500/20 bg-black/95 px-4 pb-4 pt-2 backdrop-blur"
            aria-label="Documentation"
          >
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded px-3 py-2 font-mono text-xs transition ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/5 border border-transparent"
                    }`}
                  >
                    [{item.label}]
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-emerald-500/10">
              <a
                href="https://github.com/JaySym-ai/getwired"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-emerald-600 hover:text-emerald-400 transition"
              >
                GitHub &rarr;
              </a>
            </div>
          </nav>
        )}
      </div>

      {/* Main content */}
      <main id="main-content" className="flex-1 overflow-y-auto">
        {/* Top banner */}
        <div
          className="w-full border-b border-emerald-500/20 py-2 text-center"
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
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          </div>
        </div>

        {/* Spacer for fixed mobile header */}
        <div className="h-12 md:hidden" />

        <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-12">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-emerald-500/10 py-6 text-center">
          <p className="font-mono text-[10px] text-emerald-600">
            &copy; 2026 GetWired &middot;{" "}
            <a
              href="https://github.com/JaySym-ai/getwired"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition"
            >
              Open Source
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
