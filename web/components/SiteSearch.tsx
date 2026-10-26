"use client";

import Link from "next/link";
import type MiniSearch from "minisearch";
import type { SearchResult } from "minisearch";
import { useCallback, useEffect, useRef, useState } from "react";
import { findingLabel } from "@/lib/findings";
import { createIndex, runSearch, type IndexedDoc } from "@/lib/search/index";
import type { SearchDoc, SearchDocType } from "@/lib/sanity/types";

type Hit = SearchResult & IndexedDoc;

const GROUPS: { type: SearchDocType; title: string; all: string; href: string }[] = [
  { type: "review", title: "Claim reviews", all: "All reviews", href: "/reviews" },
  { type: "source", title: "Sources", all: "All sources", href: "/sources" },
  { type: "dataset", title: "Datasets", all: "All datasets", href: "/datasets" },
];

function excerpt(doc: IndexedDoc, terms: string[]): { text: string; hit?: string } {
  const fields = [doc.shortAnswer, doc.claimTranslation, doc.claimText, doc.body, doc.evidenceText];
  for (const field of fields) {
    if (!field) continue;
    const lower = field.toLowerCase();
    for (const term of terms) {
      const i = lower.indexOf(term.toLowerCase());
      if (i >= 0) {
        const start = Math.max(0, i - 80);
        const end = Math.min(field.length, i + term.length + 120);
        return { text: (start > 0 ? "…" : "") + field.slice(start, end) + (end < field.length ? "…" : ""), hit: field.slice(i, i + term.length) };
      }
    }
  }
  return { text: doc.shortAnswer ?? doc.subtitle ?? "" };
}

function Mark({ text, hit }: { text: string; hit?: string }) {
  if (!hit) return <>{text}</>;
  const i = text.toLowerCase().indexOf(hit.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + hit.length)}</mark>
      {text.slice(i + hit.length)}
    </>
  );
}

export function SiteSearch({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<{ q: string; hits: Hit[] } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const indexPromise = useRef<Promise<MiniSearch<IndexedDoc>> | null>(null);

  const loadIndex = useCallback(() => {
    if (!indexPromise.current) {
      setStatus("loading");
      indexPromise.current = fetch("/search-index.json")
        .then((r) => {
          if (!r.ok) throw new Error(`Index request failed: ${r.status}`);
          return r.json() as Promise<{ docs: SearchDoc[] }>;
        })
        .then(({ docs }) => {
          const index = createIndex(docs);
          setStatus("ready");
          return index;
        })
        .catch((err) => {
          indexPromise.current = null;
          setStatus("error");
          throw err;
        });
    }
    return indexPromise.current;
  }, []);

  useEffect(() => {
    loadIndex().catch(() => {});
  }, [loadIndex]);

  useEffect(() => {
    const q = query.trim();
    window.history.replaceState(null, "", q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    if (!q) return;
    let stale = false;
    loadIndex()
      .then((index) => {
        if (!stale) setResults({ q, hits: runSearch(index, q) as Hit[] });
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [query, loadIndex]);

  const q = query.trim();
  const hits = results && results.q === q ? results.hits : null;
  const grouped = GROUPS.map((g) => ({ ...g, hits: (hits ?? []).filter((h) => h.type === g.type) })).filter((g) => g.hits.length > 0);

  return (
    <div className="wrap py-10 md:py-14">
      <p className="eyebrow muted">Search</p>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-3 mb-5">
        {q ? <>Results for “{q}”</> : "Search the site."}
      </h1>
      <p className="muted mb-8 max-w-2xl">
        Searches claim reviews, source documents, and datasets. Try a question, the wording of a claim in any language,
        a publisher, or a place name.
      </p>
      <form className="mb-10" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="block">
          <span className="sr-only">Search</span>
          <input
            id="site-search-field"
            className="field"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. boarding schools, Human Rights Watch, 寄宿制学校"
            autoComplete="off"
            autoFocus
          />
        </label>
      </form>

      <p className="meta mb-6" aria-live="polite">
        {!q
          ? "Type to search."
          : hits === null
            ? status === "error"
              ? "Search is unavailable right now."
              : "Searching…"
            : `${hits.length} result${hits.length === 1 ? "" : "s"}`}
      </p>

      {q && hits && hits.length === 0 && (
        <div className="panel text-center py-14">
          <h2 className="text-2xl font-bold">Nothing found</h2>
          <p className="muted mt-3">Try a different word, or browse the lists directly.</p>
          <p className="mt-5 flex gap-3 justify-center flex-wrap">
            {GROUPS.map((g) => (
              <Link key={g.type} href={g.href} className="pill">{g.all}</Link>
            ))}
          </p>
        </div>
      )}

      {grouped.map((g) => (
        <section key={g.type} className="mb-12" aria-labelledby={`group-${g.type}`}>
          <div className="section-heading flex justify-between items-center">
            <h2 id={`group-${g.type}`}>{g.title} <span className="muted font-normal text-base">({g.hits.length})</span></h2>
            <Link href={g.href} className="text-xs font-normal tracking-normal">{g.all} ↗</Link>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 list-none p-0 m-0">
            {g.hits.map((h) => {
              const ex = excerpt(h, h.terms);
              return (
                <li key={h.id}>
                  <div className="eyebrow mb-3">{h.type === "review" ? (h.topicTitles?.[0] ?? "Claim review") : h.subtitle || g.title}</div>
                  <h3>
                    <Link href={h.url} className="story-title text-xl">{h.title}</Link>
                  </h3>
                  {ex.text && (
                    <p className="text-sm muted mt-3 leading-6"><Mark text={ex.text} hit={ex.hit} /></p>
                  )}
                  {h.type === "review" && (
                    <p className="meta mt-3"><span className="badge">{findingLabel(h.finding)}</span></p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
