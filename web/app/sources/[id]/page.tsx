import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, hostOf } from "@/lib/format";
import { sanityFetch } from "@/lib/sanity/fetch";
import { sourceByIdQuery } from "@/lib/sanity/queries";
import type { SourceDetail } from "@/lib/sanity/types";
import { accessLabel } from "../page";

type Props = { params: Promise<{ id: string }> };

async function getSource(id: string) {
  return sanityFetch<SourceDetail | null>({ query: sourceByIdQuery, params: { id } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const source = await getSource(decodeURIComponent(id));
  return { title: source?.title ?? "Source not found" };
}

export default async function SourcePage({ params }: Props) {
  const { id } = await params;
  const source = await getSource(decodeURIComponent(id));
  if (!source) notFound();

  return (
    <article>
      <p className="small muted"><Link href="/sources">Sources</Link></p>
      <h1>{source.title}</h1>
      <dl className="meta">
        {source.publisher && (<><dt>Publisher</dt><dd>{source.publisher}</dd></>)}
        {source.date && (<><dt>Date</dt><dd>{formatDate(source.date)}</dd></>)}
        {source.language && (<><dt>Language</dt><dd>{source.language}</dd></>)}
        <dt>Access</dt><dd>{accessLabel(source.hostingPolicy)}</dd>
        {source.rightsStatus && (<><dt>Rights</dt><dd>{source.rightsStatus}</dd></>)}
        {source.originalUrl && (
          <><dt>Original location</dt><dd><a href={source.originalUrl} rel="noopener noreferrer">{hostOf(source.originalUrl)}</a></dd></>
        )}
      </dl>

      <div className="panel">
        {source.fileUrl ? (
          <p><a href={source.fileUrl}>Open the document</a></p>
        ) : source.hostingPolicy === "private" ? (
          <p className="muted">A private capture of this document is held by the editorial team and is not published. Quoted passages appear in the reviews that cite it.</p>
        ) : (
          <p className="muted">The full document is not hosted here. Quoted passages appear in the reviews that cite it; use the original location above.</p>
        )}
      </div>

      {source.notes && (<><h2>Context</h2><p>{source.notes}</p></>)}

      <h2>Cited in</h2>
      {source.citedBy?.length ? (
        <ul>
          {source.citedBy.map((r) => (
            <li key={r.slug}><Link href={`/reviews/${encodeURIComponent(r.slug)}`}>{r.question}</Link></li>
          ))}
        </ul>
      ) : (
        <p className="muted">Not cited by any published review.</p>
      )}

      {source.relatedSources?.length ? (
        <>
          <h2>Related documents</h2>
          <ul>
            {source.relatedSources.map((s) => (
              <li key={s._id}><Link href={`/sources/${encodeURIComponent(s._id)}`}>{s.title}</Link>{s.publisher && <> , {s.publisher}</>}</li>
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
}
