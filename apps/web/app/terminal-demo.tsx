"use client";

import { useEffect, useState } from "react";

/* ───────────────────────── Terminal animation data ───────────────────────── */

const demoLines = [
  { type: "cmd", text: "user@dev:~/signup-app $ getwired" },
  { type: "info", text: "🔌 getwired v0.0.8 — Provider: auggie" },
  { type: "info", text: "🌐 Detected dev server at http://localhost:3000" },
  { type: "info", text: "🕵 Persona: Hacky Testing" },
  { type: "info", text: "   Probing routes, parameters, and unsafe assumptions..." },
  { type: "action", text: "→ Trying /admin — let's see if it's protected..." },
  { type: "warn", text: "⚠ Found: /admin returns 200 with no auth check!" },
  { type: "action", text: '→ Manipulating user ID in URL: /api/users/1 → /api/users/2...' },
  { type: "warn", text: "⚠ Found: IDOR — can access other users' data by changing ID" },
  { type: "action", text: '→ Entering "<script>alert(1)</script>" in name field...' },
  { type: "warn", text: "⚠ Found: XSS payload reflected in DOM!" },
  { type: "action", text: "→ Submitting form with negative quantity: -99..." },
  { type: "action", text: "→ Resubmitting same POST after hitting Back button..." },
  { type: "warn", text: "⚠ Found: No CSRF token — form can be replayed!" },
  { type: "action", text: "→ Adding ?role=admin to the signup URL..." },
  { type: "action", text: "→ Tampering with hidden price field in checkout form..." },
  { type: "warn", text: "⚠ Found: Client-side price accepted by server without validation" },
  { type: "info", text: "📸 Taking screenshot for regression analysis..." },
  { type: "result", text: "✅ Hacky Test complete: 5 issues found, 0 regressions" },
  { type: "result", text: "📄 Report saved to .getwired/reports/" },
];

const colorFor = (type: string) => {
  switch (type) {
    case "cmd":
      return "text-green-400";
    case "info":
      return "text-emerald-300";
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

/* ───────────────────────── Activity bar icons (SVG) ──────────────────────── */

function IconHome() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
}
function IconFiles() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>);
}
function IconSearch() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
}
function IconBell() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>);
}
function IconGit() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 009 9"/></svg>);
}
function IconSettings() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>);
}

/* ───────────────────────── Main widget ────────────────────────────────────── */

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleLines(demoLines.length);
      return;
    }
    if (isPaused) return;
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
  }, [visibleLines, isPaused, prefersReducedMotion]);

  const linesToShow = prefersReducedMotion ? demoLines : demoLines.slice(0, visibleLines);
  const lastLine = linesToShow.length > 0 ? linesToShow[linesToShow.length - 1] : null;

  return (
    <div
      className="w-full max-w-7xl rounded-xl border border-[#2a2a3a] overflow-hidden shadow-2xl"
      role="region"
      aria-label="Intent IDE demo showing GetWired AI testing in action"
      style={{
        boxShadow: "0 0 60px rgba(0,0,0,0.5), 0 0 120px rgba(16, 185, 129, 0.08)",
      }}
    >
      {/* ── Title bar ─────────────────────────────────────────────────── */}
      <div className="bg-[#1e1e2e] border-b border-[#2a2a3a] px-3 py-2 flex items-center">
        <div className="flex gap-2 shrink-0" aria-hidden="true">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        {/* Center command bar */}
        <div className="flex-1 flex justify-center px-4">
          <div className="hidden sm:flex items-center gap-2 bg-[#13131f] rounded-md px-3 py-1 text-[11px] text-gray-500 border border-[#2a2a3a] max-w-md w-full justify-center">
            Hacky Test — signup flow — my-app
          </div>
        </div>
        {!prefersReducedMotion && (
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="shrink-0 font-mono text-[10px] text-gray-500 hover:text-emerald-400 transition rounded px-2 py-0.5 border border-[#2a2a3a] hover:border-emerald-500/40"
            aria-label={isPaused ? "Resume terminal demo animation" : "Pause terminal demo animation"}
          >
            {isPaused ? "▶ Resume" : "⏸ Pause"}
          </button>
        )}
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────── */}
      <div className="bg-[#1a1a2a] border-b border-[#2a2a3a] flex items-stretch text-[11px] font-mono overflow-x-auto ide-scrollbar" aria-hidden="true">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#232336] text-gray-300 border-r border-[#2a2a3a] border-b-2 border-b-emerald-500 whitespace-nowrap">
          Coordinator <span className="text-gray-600 text-[9px] ml-1">×</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 border-r border-[#2a2a3a] whitespace-nowrap">
          chaos-spec... <span className="text-gray-700 text-[9px] ml-1">×</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 border-r border-[#2a2a3a] whitespace-nowrap">
          a8f3d2: Cha... <span className="text-gray-700 text-[9px] ml-1">×</span>
        </div>
        <div className="ml-4 flex items-center gap-1.5 px-3 py-1.5 bg-[#232336] text-gray-300 border-l border-r border-[#2a2a3a] border-b-2 border-b-blue-500 whitespace-nowrap">
          📄 Spec
        </div>
      </div>

      {/* ── Main IDE body ─────────────────────────────────────────────── */}
      <div className="flex bg-[#181825] min-h-0" style={{ height: 340 }}>

        {/* Activity bar (narrow icon strip) — hidden on mobile */}
        <div className="hidden md:flex flex-col items-center gap-1 bg-[#13131f] py-3 px-2 border-r border-[#2a2a3a] text-gray-600 shrink-0" aria-hidden="true">
          <div className="p-1 hover:text-gray-400 cursor-default"><IconHome /></div>
          <div className="p-1 hover:text-gray-400 cursor-default"><IconFiles /></div>
          <div className="p-1 text-gray-400 cursor-default"><IconSearch /></div>
          <div className="p-1 hover:text-gray-400 cursor-default relative">
            <IconBell />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>
          <div className="p-1 hover:text-gray-400 cursor-default"><IconGit /></div>
          <div className="mt-auto p-1 hover:text-gray-400 cursor-default"><IconSettings /></div>
        </div>

        {/* ── Left panel — Coordinator / Agent Chat — hidden below md ── */}
        <div className="hidden md:flex flex-col w-[280px] lg:w-[320px] border-r border-[#2a2a3a] overflow-hidden shrink-0">
          {/* Breadcrumb */}
          <div className="px-3 py-1.5 text-[10px] text-gray-500 border-b border-[#2a2a3a] tracking-wide">
            AGENTS / COORDINATOR / <span className="text-gray-400">COORDINATOR AGENT</span>
          </div>
          {/* Chat content */}
          <div className="flex-1 overflow-y-auto ide-scrollbar px-4 py-3 space-y-3 text-[11px] leading-relaxed">
            {/* Coordinator message */}
            <p className="text-gray-400">I&apos;ll probe the signup flow for security weaknesses. Let me check auth, injection, and parameter tampering.</p>
            <p className="text-gray-600 text-[10px]">2m ago</p>
            {/* User bubble */}
            <div className="rounded-lg bg-emerald-900/30 border border-emerald-500/20 px-3 py-2 text-emerald-300 text-[11px]">
              Run a hacky test on the signup flow. Try to break auth, inject payloads, and tamper with parameters.
            </div>
            {/* Coordinator reply */}
            <p className="text-gray-400">I&apos;ll coordinate across the signup flow. Spawning specialist agents now:</p>
            {/* Agent card 1 */}
            <div className="rounded border border-[#2a2a3a] bg-[#1e1e30] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2a3a]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /><span className="text-gray-300 font-medium">XSS Injection Agent</span></span>
                <span className="text-gray-600 text-[10px]">Running...</span>
              </div>
              <div className="px-3 py-1.5 text-gray-500 text-[10px]">Injecting payloads into every text input and URL parameter.</div>
              <div className="bg-[#13131f] px-3 py-1.5 font-mono text-[10px] text-gray-500 border-t border-[#2a2a3a]">
                <span className="text-gray-600">// xss-injection.test.ts</span><br />
                <span className="text-purple-400">await</span> <span className="text-blue-300">page</span>.fill(<span className="text-emerald-300">&apos;#name&apos;</span>, <span className="text-emerald-300">&apos;&lt;script&gt;alert(1)&lt;/script&gt;&apos;</span>);
              </div>
            </div>
            {/* Agent card 2 */}
            <div className="rounded border border-[#2a2a3a] bg-[#1e1e30] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a2a3a]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /><span className="text-gray-300 font-medium">Auth Bypass Agent</span></span>
                <span className="text-gray-600 text-[10px]">Running...</span>
              </div>
              <div className="px-3 py-1.5 text-gray-500 text-[10px]">Probing unprotected routes and IDOR vulnerabilities.</div>
              <div className="bg-[#13131f] px-3 py-1.5 font-mono text-[10px] text-gray-500 border-t border-[#2a2a3a]">
                <span className="text-gray-600">// auth-bypass.test.ts</span><br />
                <span className="text-purple-400">const</span> <span className="text-blue-300">res</span> = <span className="text-purple-400">await</span> <span className="text-blue-300">fetch</span>(<span className="text-emerald-300">&apos;/api/users/2&apos;</span>);
              </div>
            </div>
            <p className="text-gray-500 text-[10px]">Both agents are working in parallel. Current progress:</p>
            <p className="text-gray-500 text-[10px]">· <span className="text-gray-400">XSS Injection Agent</span>: Found reflected XSS in name field</p>
            <p className="text-gray-500 text-[10px]">· <span className="text-gray-400">Auth Bypass Agent</span>: /admin returns 200 with no auth!</p>
            <p className="text-gray-600 text-[10px]">Just now</p>
          </div>
          {/* Input bar */}
          <div className="border-t border-[#2a2a3a] px-3 py-2">
            <div className="rounded-lg border border-[#2a2a3a] bg-[#13131f] px-3 py-1.5 text-[11px] text-gray-600">Type a message...</div>
          </div>
          {/* Model badge bar */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-t border-[#2a2a3a] text-[10px] text-gray-600">
            <span className="flex items-center gap-1">Select your model</span>
            <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
            <span className="ml-auto flex items-center gap-2">
            </span>
          </div>
        </div>


        {/* ── Center panel — Spec document ────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r border-[#2a2a3a]">
          {/* Spec breadcrumb */}
          <div className="px-3 py-1.5 text-[10px] text-gray-500 border-b border-[#2a2a3a] tracking-wide">
            NOTES / <span className="text-gray-400">SPEC</span>
          </div>
          <div className="flex-1 overflow-y-auto ide-scrollbar px-5 py-4 text-[11px] leading-relaxed text-gray-400">
            <h3 className="text-gray-200 font-semibold text-sm mb-3">Hacky Testing — Signup Flow</h3>

            <p className="font-semibold text-gray-300 mb-1">Overview</p>
            <p className="text-gray-500 mb-3 text-[11px]">Probe the signup flow like a malicious user. Test for injection vulnerabilities, auth bypass, parameter tampering, IDOR, CSRF, and other common web security issues.</p>

            <p className="font-semibold text-gray-300 mb-1">Attack Surface</p>
            <ul className="text-gray-500 text-[11px] space-y-0.5 mb-3 list-none">
              <li>· Form inputs: name, email, password — XSS, SQLi</li>
              <li>· API routes: /api/users/:id — IDOR, auth bypass</li>
              <li>· Hidden fields: price, role — parameter tampering</li>
              <li>· Session: CSRF tokens, cookie flags, replay attacks</li>
            </ul>

            <p className="font-semibold text-gray-300 mb-1">Target</p>
            <ul className="text-gray-500 text-[11px] space-y-0.5 mb-3 list-none">
              <li>· GET /signup, POST /api/signup, GET /admin</li>
              <li>· Persona: hacky (adversarial, security-focused)</li>
              <li>· Provider: auggie</li>
            </ul>

            <p className="font-semibold text-gray-300 mb-1.5">Tasks</p>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded border border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[9px]">✓</span><span className="text-gray-400">Probe /admin route — is it auth-protected?</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded border border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[9px]">✓</span><span className="text-gray-400">Test IDOR on /api/users/:id</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded border border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[9px]">✓</span><span className="text-gray-400">Inject XSS payloads in all text inputs</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded border border-emerald-500 bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[9px]">✓</span><span className="text-gray-400">Check CSRF token on form submissions</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded border border-blue-500 bg-blue-500/20 flex items-center justify-center text-[9px]" /><span className="text-gray-400">Tamper with hidden price field <span className="text-[9px] text-blue-400 bg-blue-500/10 rounded px-1 py-0.5 ml-1">in progress</span></span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded border border-[#2a2a3a] flex items-center justify-center text-[9px]" /><span className="text-gray-500">Submit negative quantities</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded border border-[#2a2a3a] flex items-center justify-center text-[9px]" /><span className="text-gray-500">Add ?role=admin to signup URL</span></div>
              <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded border border-[#2a2a3a] flex items-center justify-center text-[9px]" /><span className="text-gray-500">Check cookie security flags (HttpOnly, Secure)</span></div>
            </div>
          </div>
        </div>

        {/* ── Right panel — hidden below lg ────────────────────────────── */}
        <div className="hidden lg:flex flex-col w-[250px] overflow-hidden shrink-0">
          {/* Task header */}
          <div className="px-4 py-3 border-b border-[#2a2a3a]">
            <p className="text-gray-200 font-semibold text-[12px]">Hacky Test — signup</p>
            <p className="text-gray-600 text-[10px]">my-app/signup</p>
          </div>
          {/* Tabs */}
          <div className="flex border-b border-[#2a2a3a] text-[10px]">
            <span className="px-3 py-1.5 text-gray-300 border-b border-emerald-500">Agents</span>
            <span className="px-3 py-1.5 text-gray-600">Context</span>
            <span className="px-3 py-1.5 text-gray-600">Changes <span className="text-emerald-500">5</span></span>
            <span className="px-3 py-1.5 text-gray-600">Files</span>
          </div>
          <div className="flex-1 overflow-y-auto ide-scrollbar px-4 py-3 space-y-3 text-[11px]">
            {/* Agent orchestration */}
            <p className="text-gray-300 font-semibold text-[11px]">Agent orchestration <span className="text-gray-600 text-[10px] font-normal">↗</span></p>
            <p className="text-gray-500 text-[10px]">A coordinator agent breaks down your task into a spec, then delegates work to specialist agents that run in parallel.</p>
            {/* Coordinator */}
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 mt-0.5 rounded-sm bg-purple-500 shrink-0" />
              <div>
                <p className="text-gray-300 font-medium text-[11px]">Coordinator <span className="text-gray-600 text-[10px] font-normal ml-2">2m</span></p>
                <p className="text-gray-500 text-[10px]">I&apos;ll probe the signup for security weaknesses…</p>
                <p className="text-gray-600 text-[10px]"><span className="text-emerald-400">●</span> <span className="text-yellow-400">●</span> 2 delegated agents</p>
              </div>
            </div>
            {/* Agent list */}
            <div className="flex items-center gap-2 pl-4 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />XSS Injection Agent <span className="text-gray-600 ml-auto text-[10px]">running</span>
            </div>
            <div className="flex items-center gap-2 pl-4 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />Auth Bypass Agent <span className="text-gray-600 ml-auto text-[10px]">running</span>
            </div>
            {/* Background agents */}
            <p className="text-gray-300 font-semibold text-[11px] pt-1">Background agents <span className="text-gray-600 font-normal">3</span></p>
            <div className="flex items-center gap-2 text-gray-500 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />CSRF Checker</div>
            <div className="flex items-center gap-2 text-gray-500 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Parameter Tamper</div>
            <div className="flex items-center gap-2 text-gray-500 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Report Generator</div>

            {/* Context */}
            <p className="text-gray-300 font-semibold text-[11px] pt-1">Context <span className="text-gray-600 text-[10px] font-normal">↗</span></p>
            <p className="text-gray-500 text-[10px]">Context about the task, shared with all agents in this space.</p>
            <div className="flex items-center gap-1.5 text-gray-400 text-[10px]">📄 Spec</div>

            {/* Changes */}
            <p className="text-gray-300 font-semibold text-[11px] pt-1">Changes <span className="text-gray-600 text-[10px] font-normal">↗</span> <span className="text-emerald-500 text-[10px]">5</span></p>
            <p className="text-gray-500 text-[10px]">Changes made to files by agents working in this space.</p>
            <p className="text-gray-600 text-[10px] font-mono">⤴ test/hacky-signup → main</p>
            <div className="space-y-0.5 font-mono text-[10px]">
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-yellow-500" /><span className="text-gray-400">xss-injection.test.ts</span> <span className="text-gray-600">tests/</span> <span className="text-emerald-500 ml-auto">+97</span> <span className="text-red-400">-0</span></div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-yellow-500" /><span className="text-gray-400">auth-bypass.test.ts</span> <span className="text-gray-600">tests/</span> <span className="text-emerald-500 ml-auto">+64</span> <span className="text-red-400">-0</span></div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-blue-500" /><span className="text-gray-400">getwired.config.ts</span> <span className="text-gray-600">src/</span> <span className="text-emerald-500 ml-auto">+5</span> <span className="text-red-400">-1</span></div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-yellow-500" /><span className="text-gray-400">csrf-check.test.ts</span> <span className="text-gray-600">tests/</span> <span className="text-emerald-500 ml-auto">+38</span> <span className="text-red-400">-0</span></div>
              <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-sm bg-yellow-500" /><span className="text-gray-400">report.html</span> <span className="text-gray-600">.getwired/</span> <span className="text-emerald-500 ml-auto">+112</span> <span className="text-red-400">-0</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom status bar ─────────────────────────────────────────── */}
      <div className="bg-[#13131f] border-t border-[#2a2a3a] flex items-center gap-2 px-2 py-1 text-[10px] font-mono text-gray-500 overflow-x-auto ide-scrollbar" aria-hidden="true">
        <span className="text-gray-500">p 3000</span>
        <span className="text-gray-400">Terminal</span>
        <span className="text-gray-600">ls</span>
        <span className="text-gray-600 truncate">getwired --persona hacky</span>
      </div>

      {/* ── Terminal panel (animated) ─────────────────────────────────── */}
      <div
        className="bg-[#0d0d14] p-4 font-mono text-[11px] sm:text-xs leading-relaxed relative overflow-hidden border-t border-[#2a2a3a]"
        style={{ height: 180 }}
      >
        <div className="absolute bottom-4 left-4 right-4">
          {linesToShow.map((line, i) => (
            <div key={i} className={colorFor(line.type)}>
              {line.text}
            </div>
          ))}
          {!prefersReducedMotion && visibleLines < demoLines.length && (
            <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse mt-1" aria-hidden="true" />
          )}
        </div>
        {/* Screen reader announcement */}
        <div className="sr-only" aria-live="polite" aria-atomic="false">
          {lastLine ? lastLine.text : ""}
        </div>
      </div>
    </div>
  );
}