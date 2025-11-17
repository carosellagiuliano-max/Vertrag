import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { label: "Start", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Öffnungszeiten", href: "/contact#anreise" },
  { label: "Booking", href: "/booking" },
  { label: "Shop", href: "/shop" },
  { label: "Admin", href: "/admin" },
  { label: "Designsystem", href: "/#designsystem" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex max-w-content items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-white shadow-surface">
              <span className="text-lg font-semibold">S</span>
            </div>
            <div className="leading-tight">
              <p className="text-lg font-semibold">Schnittwerk</p>
              <p className="text-sm text-muted">Salon OS für St. Gallen</p>
            </div>
          </div>
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1 transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-accent-strong">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-ink">Phase 7</span>
            <span className="hidden text-muted sm:inline">Analytics, Hardening & Tests</span>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-content flex-1 flex-col gap-8 px-6 py-10 md:py-14">
        {children}
      </main>
      <footer className="border-t border-border/60 bg-card/80 py-6 text-sm text-muted">
        <div className="mx-auto flex max-w-content flex-col gap-3 px-6 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Schnittwerk by Vanessa Carosella. Schweizer Datenräume, klare Prozesse.
          </p>
          <div className="flex items-center gap-4">
            <Link className="hover:text-ink" href="mailto:hallo@schnittwerk.ch">
              hallo@schnittwerk.ch
            </Link>
            <span className="hidden h-1 w-1 rounded-full bg-muted/60 md:inline" aria-hidden />
            <span>St. Gallen · Europe/Zurich</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
