"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Reviews" },
  { href: "/sources", label: "Sources" },
  { href: "/datasets", label: "Datasets" },
  { href: "/method", label: "Method" },
  { href: "/corrections", label: "Corrections" },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary">
      <ul className="nav">
        {items.map((item) => {
          const current =
            item.href === "/"
              ? pathname === "/" || pathname.startsWith("/reviews")
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={current ? "page" : undefined}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
