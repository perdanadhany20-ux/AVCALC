import Link from "next/link";
import { CALCULATORS } from "@/lib/present/registry";
import { ThemeToggle, UnitToggle } from "./toggles";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
            <rect x="1" y="4" width="20" height="12" rx="1" fill="none" stroke="var(--line-ink)" strokeWidth="1.6" />
            <path d="M1 19h20M1 17.5v3M21 17.5v3" stroke="var(--accent)" strokeWidth="1.4" />
          </svg>
          AVCalc
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <UnitToggle className="hidden sm:inline-flex" />
          <ThemeToggle />
          <Link href="/projects" className="rounded-md px-3 py-1.5 text-sm font-medium hover:bg-sunken">
            Proyek saya
          </Link>
        </div>
      </div>
      <nav aria-label="Kalkulator" className="mx-auto max-w-6xl overflow-x-auto px-4">
        <ul className="flex gap-1 pb-2 text-sm whitespace-nowrap">
          {CALCULATORS.map((c) => (
            <li key={c.id}>
              <Link href={`/kalkulator/${c.slug}`} className="block rounded-md px-2.5 py-1 text-muted hover:bg-sunken hover:text-ink">
                {c.navTitle}
              </Link>
            </li>
          ))}
          <li className="sm:hidden">
            <UnitToggle className="ml-2" />
          </li>
        </ul>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:justify-between">
        <p>Semua hasil adalah alat bantu desain. Verifikasi dengan datasheet dan standar AVIXA sebelum instalasi.</p>
        <Link href="/upgrade" className="hover:text-ink">
          Fitur Pro
        </Link>
      </div>
    </footer>
  );
}
