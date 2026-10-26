"use client";

import Link from "next/link";
import type MiniSearch from "minisearch";
import type { SearchResult } from "minisearch";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReviewCard } from "@/components/ReviewCard";
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
  type Hits = (SearchResult & IndexedDoc)[];
  const [query, setQuery] = useState(initialQuery ?? "");
  const [topic, setTopic] = useState(initialTopic ?? "");
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
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (topic) params.set("topic", topic);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/reviews?${qs}` : "/reviews");
  }, [query, topic]);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let stale = false;
    loadIndex()
      .then((index) => {
        if (!stale) setResults({ q, topic, hits: runSearch(index, q, topic, "review") as Hits });
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
  const bySlug = useMemo(() => new Map(reviews.map((r) => [r.slug, r])), [reviews]);

  const showingSearch = query.trim().length > 0;
  const hits = results && results.q === query.trim() && results.topic === topic ? results.hits : null;
  const activeTopic = topics.find((t) => t.slug === topic);
  const count = showingSearch ? hits?.length : listed.length;
  const empty = showingSearch ? hits !== null && hits.length === 0 : listed.length === 0;

  return (
    <div className="wrap py-10 md:py-14">
      <p className="eyebrow muted">{activeTopic ? activeTopic.title : "All reviews"}</p>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-3 mb-5">Find a claim review.</h1>
      <p className="muted mb-8 max-w-2xl">
        {activeTopic?.description ??
          "Search by question, by the wording of the claim in any language, or by a keyword. Filter by topic."}
      </p>

      <div className="mb-10" role="search">
        <label className="block">
          <span className="sr-only">Search claim reviews</span>
          <input
            id="reviews-search"
            className="field"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. boarding schools, 寄宿制学校, relocation…"
            autoComplete="off"
            autoFocus={Boolean(initialQuery)}
          />
        </label>
        <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label="Filter by topic">
          <button type="button" className="pill" aria-pressed={topic === ""} onClick={() => setTopic("")}>
            All
          </button>
          {topics.map((t) => (
            <button
              key={t._id}
              type="button"
              className="pill"
              aria-pressed={topic === t.slug}
              onClick={() => setTopic(topic === t.slug ? "" : t.slug)}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      <p className="meta mb-6" aria-live="polite">
        {showingSearch && hits === null
          ? status === "error"
            ? "Search is unavailable right now. Browse the list below instead."
            : "Searching…"
          : `${count ?? 0} review${count === 1 ? "" : "s"} found`}
      </p>

      {showingSearch && hits ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {hits.map((r) => {
            const ex = excerptFor(r, r.terms);
            const slug = r.id.replace(/^review:/, "");
            const summary = bySlug.get(slug);
            return (
              <article key={r.id}>
                <div className="eyebrow mb-3">{r.topicTitles?.[0] ?? "Claim review"}</div>
                <h3>
                  <Link href={`/reviews/${encodeURIComponent(slug)}`} className="story-title text-2xl">
                    {r.question}
                  </Link>
                </h3>
                <p className="text-sm muted mt-3 leading-6">
                  <Highlighted text={ex.text} hit={ex.hit} />
                </p>
                <p className="meta mt-4">
                  <span className="badge">{findingLabel(r.finding ?? summary?.finding)}</span>
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        !showingSearch && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {listed.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </div>
        )
      )}

      {empty && (
        <div className="panel text-center py-14">
          <h2 className="text-2xl font-bold">No reviews found</h2>
          <p className="muted mt-3">Try another phrase or clear the topic filter.</p>
          <button
            type="button"
            className="primary mt-5"
            onClick={() => {
              setQuery("");
              setTopic("");
            }}
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
