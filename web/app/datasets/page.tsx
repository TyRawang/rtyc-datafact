import type { Metadata } from "next";
import Link from "next/link";
import { sanityFetch } from "@/lib/sanity/fetch";
import { allDatasetsQuery } from "@/lib/sanity/queries";
import type { Dataset } from "@/lib/sanity/types";

export const metadata: Metadata = { title: "Datasets" };

export default async function DatasetsPage() {
  const datasets = (await sanityFetch<Dataset[]>({ query: allDatasetsQuery })) ?? [];
  return (
    <div className="wrap py-10 md:py-14">
      <p className="eyebrow muted">The numbers</p>
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-3 mb-5">Datasets.</h1>
      <p className="muted mb-10 max-w-2xl">
        Tabular data used in reviews, with the period, coverage, units, and known limitations stated. Files are provided
        as uploaded; figures have not been re-processed.
      </p>
      {datasets.length === 0 ? (
        <p className="muted">No datasets published yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {datasets.map((d) => (
            <article key={d._id} className="panel">
              <h2 className="text-2xl font-extrabold tracking-tight mb-2">{d.title}</h2>
              {d.description && <p className="text-sm muted mb-4">{d.description}</p>}
              <dl className="meta grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm" style={{ color: "var(--ink)" }}>
                {d.source && (<><dt className="muted">Source</dt><dd><Link href={`/sources/${encodeURIComponent(d.source._id)}`}>{d.source.title}</Link></dd></>)}
                {(d.periodStart || d.periodEnd) && (<><dt className="muted">Period</dt><dd>{d.periodStart ?? "?"} to {d.periodEnd ?? "?"}</dd></>)}
                {d.geographicCoverage && (<><dt className="muted">Coverage</dt><dd>{d.geographicCoverage}</dd></>)}
                {d.units && (<><dt className="muted">Units</dt><dd>{d.units}</dd></>)}
                {d.methodology && (<><dt className="muted">Methodology</dt><dd>{d.methodology}</dd></>)}
                {d.limitations && (<><dt className="muted">Limitations</dt><dd>{d.limitations}</dd></>)}
              </dl>
              <p className="mt-5">
                {d.fileUrl ? <a href={d.fileUrl} className="primary">Download {d.fileName ?? "file"} ↗</a> : <span className="muted text-sm">No file attached</span>}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
