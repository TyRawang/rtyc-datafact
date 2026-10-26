import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { CitationList, Evidence, collectCitations } from "@/components/Evidence";
import { FindingBadge } from "@/components/FindingBadge";
import { TopicTags } from "@/components/TopicTags";
import { claimTypeLabel, findingLabel } from "@/lib/findings";
import { formatDate, hostOf } from "@/lib/format";
import { sanityFetch } from "@/lib/sanity/fetch";
import { reviewBySlugQuery } from "@/lib/sanity/queries";
import type { ReviewDetail } from "@/lib/sanity/types";

type Props = { params: Promise<{ slug: string }> };

async function getReview(slug: string) {
  return sanityFetch<ReviewDetail | null>({ query: reviewBySlugQuery, params: { slug } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review) return { title: "Not found" };
  return { title: review.question, description: review.shortAnswer };
}

export default async function ReviewPage({ params }: Props) {
  const { slug } = await params;
  const review = await getReview(slug);
  if (!review) notFound();

  const citations = collectCitations(review.evidence);
  const capture = review.capture;
  const hasArchive = Boolean(capture?.captureFileUrl || capture?.waybackUrl);

  const jsonLd = review.finding
    ? {
        "@context": "https://schema.org",
        "@type": "ClaimReview",
        url: `/reviews/${review.slug}`,
        datePublished: review.reviewDate,
        claimReviewed: review.claimTranslation || review.claimText,
        itemReviewed: {
          "@type": "Claim",
          author: review.speaker || review.publisher ? { "@type": "Organization", name: review.speaker || review.publisher } : undefined,
          datePublished: review.statementDate,
          appearance: review.originalUrl ? { "@type": "CreativeWork", url: review.originalUrl } : undefined,
        },
        reviewRating: { "@type": "Rating", alternateName: findingLabel(review.finding) },
      }
    : null;

  return (
    <article>
      <p className="small muted">
        <TopicTags topics={review.topics} /> {claimTypeLabel(review.claimType)} claim
      </p>
      <h1>{review.question}</h1>

      <div className="panel">
        <FindingBadge finding={review.finding} />
        {review.shortAnswer ? <p>{review.shortAnswer}</p> : <p className="muted">No short answer yet.</p>}
      </div>

      <h2>The claim</h2>
      <div className="claim">
        {review.claimText && (
          <p className="original" lang={review.claimLanguage || undefined}>
            “{review.claimText}”
          </p>
        )}
        {review.claimTranslation && review.claimTranslation !== review.claimText && (
          <p>
            Translation: “{review.claimTranslation}”
            {review.translator && <span className="muted small"> (translated by {review.translator})</span>}
          </p>
        )}
        <dl className="meta">
          {review.speaker && (<><dt>Speaker</dt><dd>{review.speaker}</dd></>)}
          {review.publisher && (<><dt>Published by</dt><dd>{review.publisher}</dd></>)}
          {review.statementDate && (<><dt>Date of statement</dt><dd>{formatDate(review.statementDate)}</dd></>)}
          {review.originalUrl && (
            <><dt>Original location</dt><dd><a href={review.originalUrl} rel="noopener noreferrer">{hostOf(review.originalUrl)}</a> <span className="muted small">(may have changed or been removed)</span></dd></>
          )}
          <dt>Archived copy</dt>
          <dd>
            {capture?.captureFileUrl && (
              <>
                <a href={capture.captureFileUrl}>Captured copy</a>
                {capture.captureMethod && <> ({capture.captureMethod})</>}
                {capture.captureDate && <>, captured {formatDate(capture.captureDate)}</>}
                <br />
              </>
            )}
            {capture?.waybackUrl && (
              <>
                <a href={capture.waybackUrl} rel="noopener noreferrer">Wayback Machine snapshot</a>
                <br />
              </>
            )}
            {capture?.archiveUnavailable && (
              <span className="muted">No archive could be made. {capture.archiveNote}</span>
            )}
            {!hasArchive && !capture?.archiveUnavailable && (
              <span className="muted">No archived copy recorded.</span>
            )}
          </dd>
        </dl>
      </div>

      <h2>Evidence</h2>
      <Evidence blocks={review.evidence} citations={citations} />

      <h2>Limitations and uncertainty</h2>
      {review.limitations?.length ? (
        <PortableText value={review.limitations} />
      ) : (
        <p className="muted">No limitations recorded.</p>
      )}

      <h2>Citations</h2>
      <CitationList citations={citations} />

      <h2>Corrections</h2>
      {review.corrections?.length ? (
        <ul>
          {[...review.corrections].sort((a, b) => (a.date < b.date ? 1 : -1)).map((c) => (
            <li key={c._key}>
              <strong>{formatDate(c.date)}</strong>: {c.change}
              {c.reason && <span className="muted"> Reason: {c.reason}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No corrections have been made to this review.</p>
      )}

      <h2>About this review</h2>
      <dl className="meta">
        <dt>Finding</dt><dd>{findingLabel(review.finding)}</dd>
        <dt>Claim type</dt><dd>{claimTypeLabel(review.claimType)}</dd>
        {review.reviewer && (<><dt>Reviewed by</dt><dd>{review.reviewer}</dd></>)}
        {review.reviewDate && (<><dt>Review date</dt><dd>{formatDate(review.reviewDate)}</dd></>)}
        {review._updatedAt && (<><dt>Last updated</dt><dd>{formatDate(review._updatedAt)}</dd></>)}
      </dl>
      <p className="small muted">
        Findings follow the definitions on the <a href="/method">Method</a> page. Report an error via the
        contact details there.
      </p>

      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
    </article>
  );
}
