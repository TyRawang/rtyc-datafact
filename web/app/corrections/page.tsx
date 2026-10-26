import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { sanityFetch } from "@/lib/sanity/fetch";
import { correctionsQuery } from "@/lib/sanity/queries";
import type { Correction, CorrectionEntry } from "@/lib/sanity/types";

export const metadata: Metadata = { title: "Corrections" };

type Row = { question: string; slug: string; corrections: Correction[] };

export default async function CorrectionsPage() {
  const rows = (await sanityFetch<Row[]>({ query: correctionsQuery })) ?? [];
  const entries: CorrectionEntry[] = rows
    .flatMap((r) => (r.corrections ?? []).map((c) => ({ ...c, question: r.question, slug: r.slug })))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return (
    <div className="wrap py-10 md:py-14">
      <p className="eyebrow muted">The record</p>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-3 mb-5">Corrections.</h1>
      <p className="muted mb-10 max-w-2xl">Every material change to a published review, newest first.</p>
      {entries.length === 0 ? (
        <p className="muted">No corrections have been published.</p>
      ) : (
        <div className="max-w-3xl">
          {entries.map((e) => (
            <article key={`${e.slug}-${e._key}`} className="py-6 border-b borderline">
              <p className="eyebrow muted">{formatDate(e.date)}</p>
              <h2 className="mt-2 mb-3">
                <Link href={`/reviews/${encodeURIComponent(e.slug)}`} className="story-title text-xl">{e.question}</Link>
              </h2>
              <p>{e.change}</p>
              {e.reason && <p className="text-sm muted mt-2">Reason: {e.reason}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
