import Link from "next/link";

const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "GitHub", href: "https://github.com/getwired-dev", external: true },
];

export function Footer() {
  return (
    <footer className="border-t border-green-500/10 bg-black/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 sm:flex-row sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Made with{" "}
          <span className="font-medium text-[#00FF41]">Opus 4.6</span>
          {" · "}
          GetWired.dev © {new Date().getFullYear()}
        </p>
        <nav className="flex items-center gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-xs text-muted-foreground transition-colors hover:text-[#00FF41]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

