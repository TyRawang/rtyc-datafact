import type { Metadata } from "next";
import Link from "next/link";
import { sanityFetch } from "@/lib/sanity/fetch";
import { allDatasetsQuery } from "@/lib/sanity/queries";
import type { Dataset } from "@/lib/sanity/types";

export const metadata: Metadata = { title: "Datasets" };

export default async function DatasetsPage() {
  const datasets = (await sanityFetch<Dataset[]>({ query: allDatasetsQuery })) ?? [];
  return (
    <section>
      <h1>Datasets</h1>
      <p className="muted">
        Tabular data used in reviews, with the period, coverage, units, and known limitations stated. Files are
        provided as uploaded; figures have not been re-processed.
      </p>
      {datasets.length === 0 ? (
        <p className="muted">No datasets published yet.</p>
      ) : (
        <ul className="list">
          {datasets.map((d) => (
            <li key={d._id}>
              <h3>{d.title}</h3>
              {d.description && <p className="small">{d.description}</p>}
              <dl className="meta">
                {d.source && (<><dt>Source</dt><dd><Link href={`/sources/${encodeURIComponent(d.source._id)}`}>{d.source.title}</Link></dd></>)}
                {(d.periodStart || d.periodEnd) && (<><dt>Period</dt><dd>{d.periodStart ?? "?"} to {d.periodEnd ?? "?"}</dd></>)}
                {d.geographicCoverage && (<><dt>Coverage</dt><dd>{d.geographicCoverage}</dd></>)}
                {d.units && (<><dt>Units</dt><dd>{d.units}</dd></>)}
                {d.methodology && (<><dt>Methodology</dt><dd>{d.methodology}</dd></>)}
                {d.limitations && (<><dt>Limitations</dt><dd>{d.limitations}</dd></>)}
                <dt>Download</dt>
                <dd>{d.fileUrl ? <a href={d.fileUrl}>{d.fileName ?? "Download file"}</a> : <span className="muted">No file attached</span>}</dd>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
