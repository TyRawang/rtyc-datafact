import type { Metadata } from "next";
import Link from "next/link";
import { accessLabel } from "@/lib/access";
import { formatDate } from "@/lib/format";
import { sanityFetch } from "@/lib/sanity/fetch";
import { allSourcesQuery } from "@/lib/sanity/queries";
import type { SourceSummary } from "@/lib/sanity/types";

export const metadata: Metadata = { title: "Sources" };

export default async function SourcesPage() {
  const sources = (await sanityFetch<SourceSummary[]>({ query: allSourcesQuery })) ?? [];
  return (
    <div className="wrap py-10 md:py-14">
      <p className="eyebrow muted">The documents</p>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-3 mb-5">Sources.</h1>
      <p className="muted mb-10 max-w-2xl">
        Every document cited in a review, stored once. Where rights allow, the full document is hosted here; otherwise
        an excerpt and a link to the original location are provided.
      </p>
      {sources.length === 0 ? (
        <p className="muted">No sources published yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Title</th><th>Publisher</th><th>Date</th><th>Language</th><th>Access</th><th>Cited by</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s._id}>
                  <td><Link href={`/sources/${encodeURIComponent(s._id)}`} className="story-title">{s.title}</Link></td>
                  <td>{s.publisher}</td>
                  <td className="whitespace-nowrap">{formatDate(s.date)}</td>
                  <td>{s.language}</td>
                  <td>{accessLabel(s.hostingPolicy)}</td>
                  <td className="whitespace-nowrap">{s.citedByCount ?? 0} review{s.citedByCount === 1 ? "" : "s"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
