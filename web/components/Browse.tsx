"use client";

import Link from "next/link";
import type MiniSearch from "minisearch";
import type { SearchResult } from "minisearch";
import { useEffect, useMemo, useRef, useState } from "react";
import { findingLabel } from "@/lib/findings";
import { createIndex, runSearch, type IndexedDoc } from "@/lib/search/index";
import type { ReviewSummary, SearchDoc, TopicRef } from "@/lib/sanity/types";

function excerptFor(doc: IndexedDoc, terms: string[]): { text: string; hit?: string } {
  const candidates = [doc.shortAnswer, doc.claimTranslation, doc.claimText, doc.evidenceText];
  for (const field of candidates) {
    if (!field) continue;
    const lower = field.toLowerCase();
    for (const term of terms) {
      const idx = lower.indexOf(term.toLowerCase());
      if (idx >= 0) {
        const start = Math.max(0, idx - 80);
        const end = Math.min(field.length, idx + term.length + 120);
        const text = (start > 0 ? "…" : "") + field.slice(start, end) + (end < field.length ? "…" : "");
        return { text, hit: field.slice(idx, idx + term.length) };
      }
    }
  }
  return { text: doc.shortAnswer ?? "" };
}

function Highlighted({ text, hit }: { text: string; hit?: string }) {
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

export function Browse({
  reviews,
  topics,
  initialTopic,
  initialQuery,
}: {
  reviews: ReviewSummary[];
  topics: TopicRef[];
  initialTopic?: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [topic, setTopic] = useState(initialTopic ?? "");
  const [results, setResults] = useState<(SearchResult & IndexedDoc)[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const indexRef = useRef<MiniSearch<IndexedDoc> | null>(null);

  // Keep the URL shareable without triggering a navigation.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (topic) params.set("topic", topic);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
  }, [query, topic]);

  // Load the published index the first time a query is typed.
  useEffect(() => {
    if (!query.trim() || indexRef.current || status === "loading") return;
    let cancelled = false;
    setStatus("loading");
    fetch("/search-index.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Index request failed: ${r.status}`);
        return r.json() as Promise<{ docs: SearchDoc[] }>;
      })
      .then(({ docs }) => {
        if (cancelled) return;
        indexRef.current = createIndex(docs);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [query, status]);

  // Run the search whenever the query, topic, or index readiness changes.
  useEffect(() => {
    const index = indexRef.current;
    const q = query.trim();
    if (!q || !index) {
      setResults(null);
      return;
    }
    setResults(runSearch(index, q, topic) as (SearchResult & IndexedDoc)[]);
  }, [query, topic, status]);

  const listed = useMemo(
    () => (topic ? reviews.filter((r) => r.topics?.some((t) => t.slug === topic)) : reviews),
    [reviews, topic],
  );

  const showingSearch = query.trim().length > 0;

  return (
    <section aria-labelledby="browse-heading">
      <h1 id="browse-heading">Claim reviews</h1>
      <p className="muted">
        Each review takes one specific statement, shows the evidence, and states a finding.
      </p>

      <div className="toolbar" role="search">
        <div className="grow">
          <label htmlFor="q">Search questions, claims, and answers</label>
          <input
            id="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. boarding schools, 寄宿制学校"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="chips" role="group" aria-label="Filter by topic">
        <button type="button" className="chip" aria-pressed={topic === ""} onClick={() => setTopic("")}>
          All topics
        </button>
        {topics.map((t) => (
          <button
            key={t._id}
            type="button"
            className="chip"
            aria-pressed={topic === t.slug}
            onClick={() => setTopic(topic === t.slug ? "" : t.slug)}
          >
            {t.title}
          </button>
        ))}
      </div>

      <p className="small muted" role="status" aria-live="polite">
        {showingSearch
          ? status === "loading"
            ? "Loading search index…"
            : status === "error"
              ? "Search is unavailable right now. Browse the list below instead."
              : `${results?.length ?? 0} result${results?.length === 1 ? "" : "s"}`
          : `${listed.length} review${listed.length === 1 ? "" : "s"}`}
      </p>

      {showingSearch && results ? (
        <ul className="list">
          {results.map((r) => {
            const ex = excerptFor(r, r.terms);
            return (
              <li key={r.id}>
                <h3>
                  <Link href={`/reviews/${encodeURIComponent(r.id)}`}>{r.question}</Link>
                </h3>
                <p className="small">
                  <Highlighted text={ex.text} hit={ex.hit} />
                </p>
                <p className="small muted">
                  <span className="badge">{findingLabel(r.finding)}</span>{" "}
                  {(r.topicTitles ?? []).map((t: string) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        !showingSearch && (
          <ul className="list">
            {listed.map((r) => (
              <li key={r._id}>
                <h3>
                  <Link href={`/reviews/${encodeURIComponent(r.slug)}`}>{r.question}</Link>
                </h3>
                {r.shortAnswer && <p className="small">{r.shortAnswer}</p>}
                <p className="small muted">
                  <span className="badge">{findingLabel(r.finding)}</span>{" "}
                  {(r.topics ?? []).map((t) => (
                    <span key={t._id} className="tag">{t.title}</span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}
