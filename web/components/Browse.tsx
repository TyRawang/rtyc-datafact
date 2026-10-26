"use client";

import Link from "next/link";
import type MiniSearch from "minisearch";
import type { SearchResult } from "minisearch";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  type Hits = (SearchResult & IndexedDoc)[];
  // Results are keyed by the query that produced them, so stale hits are never shown.
  const [results, setResults] = useState<{ q: string; topic: string; hits: Hits } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const indexPromise = useRef<Promise<MiniSearch<IndexedDoc>> | null>(null);

  // Loads the published index exactly once per page, no matter how fast the user types.
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
          indexPromise.current = null; // allow a retry on the next keystroke
          setStatus("error");
          throw err;
        });
    }
    return indexPromise.current;
  }, []);

  // Prefetch on mount so the first search is instant. The index is a few kilobytes.
  useEffect(() => {
    loadIndex().catch(() => {});
  }, [loadIndex]);

  // Keep the URL shareable without triggering a navigation.
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (topic) params.set("topic", topic);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
  }, [query, topic]);

  // Run the search whenever the query or topic changes, waiting for the index if needed.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let stale = false;
    loadIndex()
      .then((index) => {
        if (!stale) setResults({ q, topic, hits: runSearch(index, q, topic) as Hits });
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [query, topic, loadIndex]);

  const listed = useMemo(
    () => (topic ? reviews.filter((r) => r.topics?.some((t) => t.slug === topic)) : reviews),
    [reviews, topic],
  );

  const showingSearch = query.trim().length > 0;
  const hits = results && results.q === query.trim() && results.topic === topic ? results.hits : null;

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
          ? hits === null && status !== "error"
            ? "Searching…"
            : status === "error"
              ? "Search is unavailable right now. Browse the list below instead."
              : `${hits?.length ?? 0} result${hits?.length === 1 ? "" : "s"}`
          : `${listed.length} review${listed.length === 1 ? "" : "s"}`}
      </p>

      {showingSearch && hits ? (
        <ul className="list">
          {hits.map((r) => {
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
