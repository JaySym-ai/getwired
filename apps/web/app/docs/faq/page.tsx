import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about GetWired: supported frameworks, AI provider requirements, pricing, security, CI/CD integration, and more.",
  alternates: { canonical: "https://getwired.dev/docs/faq" },
};

const faqs = [
  {
    q: "Does GetWired need my app to be deployed?",
    a: "No. GetWired tests against your local dev server (localhost). Just run your dev server and GetWired will auto-detect it.",
  },
  {
    q: "Which frameworks are supported?",
    a: "GetWired works with any web app that runs on localhost — Next.js, React, Vue, Svelte, plain HTML, etc. It uses agent-browser under the hood, so if a browser can open it, GetWired can test it.",
  },
  {
    q: "Do I need an API key?",
    a: "You need credentials for your chosen AI provider (e.g. Claude Code, Auggie, Codex). GetWired itself is free and open source.",
  },
  {
    q: "Can I use this in CI/CD?",
    a: "Yes. The `getwired test` command is designed for non-interactive use. It exits with a non-zero code if critical issues are found, making it easy to integrate into your pipeline.",
  },
  {
    q: "What does it actually test?",
    a: "GetWired simulates a chaotic human user: clicking random elements, submitting malformed data, testing XSS payloads, rage-clicking, resizing to extreme dimensions, testing keyboard navigation, and more. It's designed to find the things unit tests miss.",
  },
  {
    q: "Is it safe to run against my app?",
    a: "GetWired only interacts with your app through a browser — it doesn't modify your code or database directly. However, it will submit forms and trigger API calls, so run it against a dev/staging environment, not production.",
  },
  {
    q: "Can I add my own AI provider?",
    a: "Yes. The provider system is a simple interface. Check the GitHub repo for the provider template and submit a PR.",
  },
  {
    q: "How is this different from Cypress or Playwright tests?",
    a: "Traditional E2E tests follow scripts you write. GetWired uses AI to explore your app unpredictably — like a real user who doesn't read the docs. It finds the bugs your scripted tests never cover.",
  },
];

export default function FAQ() {
  return (
    <div>
      <h1 className="font-mono text-2xl font-bold text-emerald-400 tracking-wider">
        [FAQ]
      </h1>
      <p className="mt-2 font-mono text-sm text-emerald-500/50">
        Common questions.
      </p>

      <div className="mt-10 flex flex-col gap-6">
        {faqs.map((faq) => (
          <div
            key={faq.q}
            className="rounded-lg border border-emerald-500/15 bg-black/40 p-5"
          >
            <h3 className="font-mono text-sm font-bold text-emerald-300">{faq.q}</h3>
            <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-between">
        <Link
          href="/docs/configuration"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          &larr; Configuration
        </Link>
        <Link
          href="/"
          className="rounded border border-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-500/60 transition hover:border-emerald-400/50 hover:bg-emerald-400 hover:text-black"
        >
          Back to Home &rarr;
        </Link>
      </div>
    </div>
  );
}
