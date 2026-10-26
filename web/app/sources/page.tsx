import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { sanityFetch } from "@/lib/sanity/fetch";
import { allSourcesQuery } from "@/lib/sanity/queries";
import type { SourceSummary } from "@/lib/sanity/types";

export const metadata: Metadata = { title: "Sources" };

export function accessLabel(policy?: string): string {
  switch (policy) {
    case "full": return "Full copy hosted";
    case "excerpt": return "Excerpt and link only";
    case "private": return "Private capture";
    default: return "Not specified";
  }
}

export default async function SourcesPage() {
  const sources = (await sanityFetch<SourceSummary[]>({ query: allSourcesQuery })) ?? [];
  return (
    <section>
      <h1>Sources</h1>
      <p className="muted">
        Every document cited in a review, stored once. Where rights allow, the full document is hosted here;
        otherwise an excerpt and a link to the original location are provided.
      </p>
      {sources.length === 0 ? (
        <p className="muted">No sources published yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Publisher</th><th>Date</th><th>Language</th><th>Access</th><th>Cited by</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s._id}>
                  <td><Link href={`/sources/${encodeURIComponent(s._id)}`}>{s.title}</Link></td>
                  <td>{s.publisher}</td>
                  <td>{formatDate(s.date)}</td>
                  <td>{s.language}</td>
                  <td>{accessLabel(s.hostingPolicy)}</td>
                  <td>{s.citedByCount ?? 0} review{s.citedByCount === 1 ? "" : "s"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
