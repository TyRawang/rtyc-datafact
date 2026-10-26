"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import type { TopicRef } from "@/lib/sanity/types";

const primary = [
  { href: "/", label: "Home" },
  { href: "/reviews", label: "All reviews" },
];
const secondary = [
  { href: "/sources", label: "Sources" },
  { href: "/datasets", label: "Datasets" },
  { href: "/method", label: "Method" },
  { href: "/corrections", label: "Corrections" },
];

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/** The <html> class is the source of truth; ThemeScript sets it before hydration. */
function useTheme() {
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("fgt-theme", next ? "dark" : "light");
    } catch {}
  };
  return { dark, toggle };
}

export function SiteHeader({ topics }: { topics: TopicRef[] }) {
  const pathname = usePathname();
  const router = useRouter();
  // Disclosures remember the path they were opened on, so navigating closes them without an effect.
  const [ui, setUi] = useState({ path: pathname, menu: false, search: false });
  const menuOpen = ui.path === pathname && ui.menu;
  const searchOpen = ui.path === pathname && ui.search;
  const setMenuOpen = (menu: boolean) => setUi({ path: pathname, menu, search: false });
  const setSearchOpen = (search: boolean) => setUi({ path: pathname, menu: false, search });
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const { dark, toggle } = useTheme();

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <header>
      <div className="utility">
        <div className="wrap flex flex-wrap justify-between py-3 gap-x-6 gap-y-1">
          <span>Claims about Tibet, checked against the evidence</span>
          <span className="hidden md:flex gap-5">
            {secondary.map((i) => (
              <Link key={i.href} href={i.href} aria-current={isCurrent(i.href) ? "page" : undefined} className="no-underline hover:underline">
                {i.label}
              </Link>
            ))}
          </span>
        </div>
      </div>
      <div className="wrap masthead">
        <div className="hidden md:block text-xs muted leading-6">
          Find the claim.
          <br />
          Check the evidence.
        </div>
        <div>
          <Link href="/" aria-label="Factgaurd Tibet home">
            <Image src="/logo.png" alt="Factgaurd Tibet" width={2172} height={724} className="logo" priority />
          </Link>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="round"
            aria-expanded={searchOpen}
            aria-controls="site-search"
            aria-label="Open search"
            onClick={() => {
              const next = !searchOpen;
              setSearchOpen(next);
              if (next) setTimeout(() => searchRef.current?.focus(), 0);
            }}
          >
            <span aria-hidden="true">⌕</span>
          </button>
          <button type="button" className="round" aria-pressed={dark} aria-label="Toggle dark mode" onClick={toggle}>
            <span aria-hidden="true">{dark ? "☀" : "◐"}</span>
          </button>
          <button
            type="button"
            className="round md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>
      </div>
      <div className="navline">
        <nav className="wrap hidden md:flex flex-wrap items-center gap-x-8" aria-label="Main navigation">
          {primary.map((i) => (
            <Link key={i.href} className="navlink" href={i.href} aria-current={isCurrent(i.href) ? "page" : undefined}>
              {i.label}
            </Link>
          ))}
          {topics.map((t) => (
            <Link key={t._id} className="navlink whitespace-nowrap" href={`/reviews?topic=${encodeURIComponent(t.slug)}`}>
              {t.title}
            </Link>
          ))}
        </nav>
        {menuOpen && (
          <nav id="mobile-nav" className="mobile-nav md:hidden" aria-label="Mobile navigation">
            {[...primary, ...secondary].map((i) => (
              <Link key={i.href} href={i.href}>
                {i.label}
              </Link>
            ))}
            {topics.map((t) => (
              <Link key={t._id} href={`/reviews?topic=${encodeURIComponent(t.slug)}`}>
                {t.title}
              </Link>
            ))}
          </nav>
        )}
      </div>
      {searchOpen && (
        <form
          id="site-search"
          className="wrap flex gap-3 py-5"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            setSearchOpen(false);
            setQuery("");
            router.push(q ? `/reviews?q=${encodeURIComponent(q)}` : "/reviews");
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSearchOpen(false);
          }}
        >
          <label htmlFor="global-search" className="sr-only">
            Search claim reviews
          </label>
          <input
            id="global-search"
            ref={searchRef}
            className="field"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a claim, a question, or a keyword in any language"
          />
          <button className="primary" type="submit">
            Search
          </button>
        </form>
      )}
    </header>
  );
}
