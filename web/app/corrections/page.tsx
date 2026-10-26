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
    <section>
      <h1>Corrections</h1>
      <p className="muted">Every material change to a published review, newest first.</p>
      {entries.length === 0 ? (
        <p className="muted">No corrections have been published.</p>
      ) : (
        <ul className="list">
          {entries.map((e) => (
            <li key={`${e.slug}-${e._key}`}>
              <p className="small muted">{formatDate(e.date)}</p>
              <h3><Link href={`/reviews/${encodeURIComponent(e.slug)}`}>{e.question}</Link></h3>
              <p>{e.change}</p>
              {e.reason && <p className="small muted">Reason: {e.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
