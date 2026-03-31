import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "./providers";
import { PostHogPageView } from "./posthog-pageview";

const SITE_URL = "https://getwired.dev";
const SITE_NAME = "GetWired";
const SITE_DESCRIPTION =
  "GetWired is an open-source AI-powered testing CLI that simulates chaotic human behavior to find bugs, broken layouts, XSS vulnerabilities, and edge cases in your web apps before your users do.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GetWired — AI-Powered Human-Like Testing CLI for Web Apps",
    template: "%s | GetWired",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI testing",
    "automated testing",
    "CLI testing tool",
    "regression testing",
    "web app testing",
    "bug detection",
    "XSS testing",
    "chaos testing",
    "human-like testing",
    "open source testing",
    "developer tools",
    "QA automation",
    "GetWired",
    "AI QA",
    "end-to-end testing",
    "Claude Code",
    "Augment Code",
    "Codex CLI",
    "Next.js testing",
    "React testing",
  ],
  authors: [{ name: "GetWired", url: SITE_URL }],
  creator: "GetWired",
  publisher: "GetWired",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "GetWired — AI-Powered Human-Like Testing CLI for Web Apps",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "GetWired — AI-Powered Human-Like Testing CLI for Web Apps",
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "Developer Tools",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GetWired",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "macOS, Linux, Windows",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "GetWired",
    url: SITE_URL,
  },
  license: "https://opensource.org/licenses/MIT",
  isAccessibleForFree: true,
  softwareVersion: "0.1.0",
  programmingLanguage: "TypeScript",
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is GetWired?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GetWired is an open-source AI-powered CLI tool that tests your web applications by simulating chaotic human-like behavior. It finds bugs, broken layouts, XSS vulnerabilities, and edge cases before your users do.",
      },
    },
    {
      "@type": "Question",
      name: "Which AI providers does GetWired support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GetWired supports Claude Code by Anthropic, Auggie by Augment Code, Codex by OpenAI, and OpenCode. You can configure your preferred provider during initialization.",
      },
    },
    {
      "@type": "Question",
      name: "Does GetWired work with any web framework?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. GetWired works with any web app running on localhost — Next.js, React, Vue, Svelte, plain HTML, and more. If a browser can open it, GetWired can test it.",
      },
    },
    {
      "@type": "Question",
      name: "Is GetWired free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, GetWired is free and open source. You only need credentials for your chosen AI provider (e.g. Claude Code, Auggie, Codex).",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body className="bg-black text-white antialiased">
        <PostHogProvider>
          <PostHogPageView />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-emerald-400 focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-black"
          >
            Skip to main content
          </a>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
