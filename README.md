<p align="center">
  <strong>🔌 GetWired</strong><br/>
  <em>Human-Like AI Testing CLI</em>
</p>

<p align="center">
  Driven by the <a href="https://pxllnk.co/intent-getwired"><strong>Augment Code Community</strong></a> · Built with <a href="https://pxllnk.co/intent-getwired"><strong>Intent</strong></a>
</p>

---

Break your app before your users do. GetWired uses AI to test your web app like a chaotic real human — clicking random links, typing garbage, rage-clicking buttons, and hunting for bugs, XSS vulnerabilities, and broken layouts.

## Install

```bash
npm install -g getwired
```

## Quick Start

```bash
cd /path/to/your-app
npm run dev
getwired init
getwired test
```

Run GetWired from your project folder directly. It only tests local apps on `localhost` or other loopback addresses, and it will not target remote `.com` or other online websites.

## Commands

| Command | Description |
| --- | --- |
| `getwired` | Do everything from there |
| `getwired init` | Initialize GetWired and configure your AI provider |
| `getwired test` | Run AI-driven chaotic testing against your local dev server |
| `getwired report` | View test reports |

### Test Flags

```
-u, --url <url>          Local URL to test (optional; localhost/loopback only)
-c, --commit <id>        Test against a specific commit for regression
-p, --pr <id>            Test against a specific pull request
--scope <scope>          Scope of testing (e.g. auth, checkout)
--persona <mode>         Test persona: standard, hacky, or old-man
-d, --device <profile>   Device profile: desktop, mobile, or both
--provider <provider>    Override AI provider for this run
```

## Supported Providers

| Provider | ID | Description |
| --- | --- | --- |
| **Claude Code** | `claude-code` | Anthropic's Claude — excellent at understanding complex UIs |
| **Auggie** | `auggie` | Augment Code's agent — fast, context-aware testing |
| **Codex** | `codex` | OpenAI's Codex CLI — lightweight and scriptable |
| **OpenCode** | `opencode` | Open-source provider — fully local, no API key needed |

```bash
npx getwired init --provider auggie
```

## How It Works

1. **Init** — Run GetWired from your project folder so it can scan that project, detect your framework, and find the dev server
2. **Test** — Your chosen AI explores your app like a chaotic human user
3. **Report** — Detailed HTML reports with screenshots and bug descriptions saved to `.getwired/reports/`

## Thanks

Special thanks to [AXe](https://github.com/cameroncooke/AXe) for native iOS Simulator interaction, and the Android `adb` toolchain for powering native emulator testing in GetWired.

## License

MIT
