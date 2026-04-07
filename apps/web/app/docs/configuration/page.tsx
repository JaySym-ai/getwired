import type { Metadata } from "next";
import Link from "next/link";

const minimalConfigExample = `{
  "provider": "claude-code",
  "auth": {},
  "authentication": {
    "cookies": [],
    "localStorage": {},
    "credentials": {}
  },
  "native": {
    "ios": {},
    "android": {},
    "electron": {}
  },
  "testing": {
    "deviceProfile": "both",
    "viewports": {
      "desktop": { "width": 1920, "height": 1080 },
      "mobile": { "width": 390, "height": 844 }
    },
    "screenshotFullPage": true,
    "screenshotDelay": 1000,
    "diffThreshold": 0.01,
    "maxConcurrency": 3,
    "showBrowser": true
  },
  "project": {
    "name": "my-app",
    "notes": [],
    "pages": [],
    "ignorePatterns": ["node_modules", ".git", "dist", ".next"]
  },
  "reporting": {
    "outputFormat": "json",
    "includeScreenshots": true,
    "autoOpen": false
  },
  "security": {
    "enabledCategories": [
      "xss",
      "sqli",
      "path-traversal",
      "template-injection",
      "header-injection"
    ],
    "injectPayloads": true
  }
}`;

const fullConfigReference = `{
  // Which AI provider to use for planning and execution
  "provider": "claude-code",

  // Saved provider credentials, keyed by provider name
  "auth": {
    // "claude-code": {
    //   "provider": "claude-code",
    //   "apiKey": "$ANTHROPIC_API_KEY",
    //   "envVar": "ANTHROPIC_API_KEY",
    //   "validated": false
    // }
  },

  // Browser/session bootstrap settings for your app auth
  "authentication": {
    "cookies": [],
    "localStorage": {},
    // "loginUrl": "http://localhost:3000/login",
    "credentials": {
      // "username": "$TEST_USER",
      // "password": "$TEST_PASSWORD"
    }
  },

  // Optional native launch settings for iOS, Android, and Electron
  "native": {
    "ios": {
      // "bundleId": "com.example.app",
      // "launchCommand": "npm run ios",
      // "launchUrl": "myapp://home",
      // "workingDirectory": "ios",
      // "source": "xcode"
    },
    "android": {
      // "packageName": "com.example.app",
      // "activity": ".MainActivity",
      // "launchCommand": "npm run android",
      // "launchUrl": "myapp://home",
      // "workingDirectory": "android",
      // "source": "android-studio"
    },
    "electron": {
      // "appPath": "dist/MyApp.app",
      // "launchCommand": "npm run electron",
      // "workingDirectory": ".",
      // "source": "electron"
    }
  },

  // Device profiles, viewports, screenshots, and concurrency
  "testing": {
    "deviceProfile": "both",
    "viewports": {
      "desktop": { "width": 1920, "height": 1080 },
      "mobile": { "width": 390, "height": 844 }
    },
    "screenshotFullPage": true,
    "screenshotDelay": 1000,
    "diffThreshold": 0.01,
    "maxConcurrency": 3,
    "showBrowser": true
  },

  // Project metadata plus note/page inputs
  "project": {
    "name": "my-app",
    // "url": "http://localhost:3000",
    "notes": [
      "notes/testing-notes.md"
    ],
    "pages": [
      "/",
      "/pricing",
      "/checkout"
    ],
    "ignorePatterns": ["node_modules", ".git", "dist", ".next"]
  },

  // Output format and report behavior
  "reporting": {
    "outputFormat": "json",
    "includeScreenshots": true,
    "autoOpen": false
  },

  // Security payload categories and custom payload controls
  "security": {
    "enabledCategories": [
      "xss",
      "sqli",
      "path-traversal",
      "template-injection",
      "header-injection"
    ],
    // "customPayloadsPath": ".getwired/custom-payloads.json",
    "injectPayloads": true
  }
}`;

const projectNotesExample = `// .getwired/config.json
{
  "project": {
    "notes": [
      "notes/testing-notes.md",
      "notes/checkout-focus.md"
    ]
  }
}`;

export const metadata: Metadata = {
  title: "Configuration",
  description:
    "Configure GetWired: .getwired directory structure, config.json schema, project notes, provider auth, and testing options.",
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
          <div className="mb-2 text-emerald-400">.getwired/</div>
          <div className="ml-4 flex flex-col gap-0.5">
            <div>config.json <span className="text-emerald-500/30">— main configuration file</span></div>
            <div>notes/ <span className="text-emerald-500/30">— testing notes for the AI</span></div>
            <div>baselines/ <span className="text-emerald-500/30">— baseline screenshots for regression</span></div>
            <div>reports/ <span className="text-emerald-500/30">— test reports</span></div>
            <div>memory.md <span className="text-emerald-500/30">— persistent memory for the AI across runs</span></div>
            <div>hybrid-scenarios.json <span className="text-emerald-500/30">— cached hybrid test scenarios</span></div>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Settings</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          Configure GetWired by editing <code className="text-emerald-400">.getwired/config.json</code>. The file uses a nested schema,
          with provider selection, auth, testing defaults, project settings, reporting, and security grouped into top-level sections.
        </p>
        <p className="mt-3 font-mono text-xs text-emerald-500/40 leading-relaxed">
          Most teams edit <code className="text-emerald-400">provider</code>, <code className="text-emerald-400">project.url</code>,
          <code className="text-emerald-400">project.notes</code>, <code className="text-emerald-400">testing.deviceProfile</code>,
          and <code className="text-emerald-400">reporting.outputFormat</code>. If you set <code className="text-emerald-400">project.url</code>
          manually, it must point to your local app on <code className="text-emerald-400">localhost</code> or another loopback address.
        </p>

        <h3 className="mt-6 font-mono text-xs font-bold text-emerald-400/80">Minimal config</h3>
        <p className="mt-2 font-mono text-xs text-emerald-500/60 leading-relaxed">
          This is the default shape created by <code className="text-emerald-400">getwired init</code> with a project name and no extra edits.
          The only value you supply up front is <code className="text-emerald-400">project.name</code>.
        </p>
        <p className="mt-2 font-mono text-xs text-emerald-500/40 leading-relaxed">
          Note: <code className="text-emerald-400">testing.showBrowser</code> is environment-sensitive and may default to
          <code className="text-emerald-400"> false</code> in CI or headless Linux.
        </p>
        <div className="mt-4 rounded-lg border border-emerald-500/15 bg-black/40 p-5 font-mono text-xs">
          <pre className="whitespace-pre leading-relaxed text-emerald-500/60">{minimalConfigExample}</pre>
        </div>

        <h3 className="mt-8 font-mono text-xs font-bold text-emerald-400/80">Full reference</h3>
        <p className="mt-2 font-mono text-xs text-emerald-500/60 leading-relaxed">
          Full top-level reference based on <code className="text-emerald-400">GetwiredSettings</code> and <code className="text-emerald-400">DEFAULT_SETTINGS</code>.
          Comments call out optional keys and what each section controls.
        </p>
        <div className="mt-4 rounded-lg border border-emerald-500/15 bg-black/40 p-5 font-mono text-xs">
          <pre className="whitespace-pre leading-relaxed text-emerald-500/60">{fullConfigReference}</pre>
        </div>

        <h3 className="mt-8 font-mono text-xs font-bold text-emerald-400/80">Config sections</h3>
        <div className="mt-4 grid gap-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          <div className="rounded border border-emerald-500/20 bg-black/30 px-4 py-3">
            <strong className="text-emerald-400">provider</strong> — which AI provider to use for planning and execution.
          </div>
          <div className="rounded border border-emerald-500/20 bg-black/30 px-4 py-3">
            <strong className="text-emerald-400">auth</strong> — API keys or provider auth metadata, stored per provider.
          </div>
          <div className="rounded border border-emerald-500/20 bg-black/30 px-4 py-3">
            <strong className="text-emerald-400">authentication</strong> — browser/session auth for your app, including cookies,
            localStorage, and login automation. See the <Link href="/docs/authentication" className="text-emerald-400 underline underline-offset-2">Authentication docs</Link>.
          </div>
          <div className="rounded border border-emerald-500/20 bg-black/30 px-4 py-3">
            <strong className="text-emerald-400">native</strong> — optional iOS, Android, and Electron launch settings for native or desktop app testing.
          </div>
          <div className="rounded border border-emerald-500/20 bg-black/30 px-4 py-3">
            <strong className="text-emerald-400">testing</strong> — device profiles, viewports, screenshot settings, diff threshold,
            browser visibility, and concurrency.
          </div>
          <div className="rounded border border-emerald-500/20 bg-black/30 px-4 py-3">
            <strong className="text-emerald-400">project</strong> — project name, local URL, notes, target pages, and ignore patterns.
          </div>
          <div className="rounded border border-emerald-500/20 bg-black/30 px-4 py-3">
            <strong className="text-emerald-400">reporting</strong> — output format, screenshot inclusion, and whether reports open automatically.
          </div>
          <div className="rounded border border-emerald-500/20 bg-black/30 px-4 py-3">
            <strong className="text-emerald-400">security</strong> — enabled payload categories, optional custom payload file, and payload injection toggle.
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-base font-bold text-emerald-300">Notes</h2>
        <p className="mt-3 font-mono text-xs text-emerald-500/60 leading-relaxed">
          Put reusable context files in <code className="text-emerald-400">.getwired/notes/</code>, not in a single
          <code className="text-emerald-400"> notes.md</code> file. The CLI loads note files from this directory before each run,
          and <code className="text-emerald-400">project.notes</code> is where you can store references such as
          <code className="text-emerald-400"> notes/testing-notes.md</code>.
        </p>
        <div className="mt-4 rounded border border-emerald-500/20 bg-black/80 px-4 py-3 font-mono text-xs text-emerald-500/50 leading-relaxed">
          <div className="text-emerald-400">notes/</div>
          <div className="mt-1 ml-4">testing-notes.md</div>
          <div className="ml-4">checkout-focus.md</div>
        </div>
        <div className="mt-4 rounded-lg border border-emerald-500/15 bg-black/40 p-5 font-mono text-xs">
          <pre className="whitespace-pre leading-relaxed text-emerald-500/60">{projectNotesExample}</pre>
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
