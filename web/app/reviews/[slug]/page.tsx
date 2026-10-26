import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { CopyLink } from "@/components/CopyLink";
import { CitationList, Evidence, collectCitations } from "@/components/Evidence";
import { ReviewCard } from "@/components/ReviewCard";
import { claimTypeLabel, findingLabel, FINDINGS } from "@/lib/findings";
import { formatDate, hostOf } from "@/lib/format";
import { sanityFetch } from "@/lib/sanity/fetch";
import { latestReviewsQuery, relatedReviewsQuery, reviewBySlugQuery } from "@/lib/sanity/queries";
import type { ReviewDetail, ReviewSummary } from "@/lib/sanity/types";

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

  const topicIds = (review.topics ?? []).map((t) => t._id);
  let related = topicIds.length
    ? ((await sanityFetch<ReviewSummary[]>({ query: relatedReviewsQuery, params: { id: review._id, topicIds } })) ?? [])
    : [];
  if (related.length < 3) {
    const latest = (await sanityFetch<ReviewSummary[]>({ query: latestReviewsQuery, params: { id: review._id } })) ?? [];
    const seen = new Set(related.map((r) => r._id));
    related = [...related, ...latest.filter((r) => !seen.has(r._id))].slice(0, 3);
  }

  const citations = collectCitations(review.evidence);
  const capture = review.capture;
  const hasArchive = Boolean(capture?.captureFileUrl || capture?.waybackUrl);
  const topic = review.topics?.[0];
  const findingDef = FINDINGS.find((f) => f.value === review.finding);

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
    <>
      <article>
        <div className="wrap pt-10 md:pt-14">
          <Link href="/reviews" className="text-xs muted">
            ← All reviews
          </Link>
          <div className="max-w-4xl mx-auto py-8 text-center">
            {topic && (
              <Link href={`/reviews?topic=${encodeURIComponent(topic.slug)}`} className="label">
                {topic.title}
              </Link>
            )}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mt-6 mb-5">{review.question}</h1>
            {review.shortAnswer && <p className="muted text-lg max-w-2xl mx-auto">{review.shortAnswer}</p>}
            <p className="mt-6">
              <span className="badge text-base!">{findingLabel(review.finding)}</span>
            </p>
            <p className="meta mt-4">
              {review.reviewer ?? "Editorial team"} &nbsp; / &nbsp; {formatDate(review.reviewDate)} &nbsp; / &nbsp;{" "}
              {claimTypeLabel(review.claimType)} claim
            </p>
          </div>
          {review.image?.url && (
            <>
              <div className="photo-wrap aspect-[16/8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="photo" src={`${review.image.url}?w=1800&auto=format`} alt={review.image.alt ?? ""} />
              </div>
              {(review.image.alt || review.image.credit) && (
                <p className="meta mt-3">
                  {review.image.alt}
                  {review.image.credit && <span className="muted"> · {review.image.credit}</span>}
                </p>
              )}
            </>
          )}
        </div>

        <div className="wrap py-7">
          <div className="article-body mx-auto">
            <h2>The claim</h2>
            <div className="claim">
              {review.claimText && (
                <p className="original" lang={review.claimLanguage || undefined}>
                  “{review.claimText}”
                </p>
              )}
              {review.claimTranslation && review.claimTranslation !== review.claimText && (
                <p style={{ margin: "0 0 8px" }}>
                  <span className="muted">Translation:</span> “{review.claimTranslation}”
                  {review.translator && <span className="muted text-sm"> (translated by {review.translator})</span>}
                </p>
              )}
              <dl className="meta">
                {review.speaker && (<><dt>Speaker</dt><dd>{review.speaker}</dd></>)}
                {review.publisher && (<><dt>Published by</dt><dd>{review.publisher}</dd></>)}
                {review.statementDate && (<><dt>Date of statement</dt><dd>{formatDate(review.statementDate)}</dd></>)}
                {review.originalUrl && (
                  <><dt>Original location</dt><dd><a href={review.originalUrl} rel="noopener noreferrer">{hostOf(review.originalUrl)}</a> <span className="muted">(may have changed or been removed)</span></dd></>
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
                  {capture?.archiveUnavailable && <span className="muted">No archive could be made. {capture.archiveNote}</span>}
                  {!hasArchive && !capture?.archiveUnavailable && <span className="muted">No archived copy recorded.</span>}
                </dd>
              </dl>
            </div>

            <h2>Evidence</h2>
            <Evidence blocks={review.evidence} citations={citations} />

            <h2>Finding</h2>
            <p>
              <strong>{findingLabel(review.finding)}.</strong>{" "}
              {findingDef ? <span className="muted">{findingDef.requirement}</span> : null}
            </p>

            <h2>Limitations and uncertainty</h2>
            {review.limitations?.length ? <PortableText value={review.limitations} /> : <p className="muted">No limitations recorded.</p>}

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
              {review.topics?.length ? (<><dt>Topics</dt><dd>{review.topics.map((t) => t.title).join(", ")}</dd></>) : null}
            </dl>
            <p className="muted" style={{ fontFamily: "var(--font-sans)", fontSize: 14 }}>
              Findings follow the definitions on the <Link href="/method">Method</Link> page. To report an error, use the
              contact details there.
            </p>
          </div>

          <div className="max-w-[740px] mx-auto border-t borderline pt-6 mt-8 flex flex-wrap gap-5 items-center">
            <span className="eyebrow">Share this review</span>
            <CopyLink />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="wrap mt-10">
          <h2 className="section-heading">Keep reading</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {related.map((r) => (
              <ReviewCard key={r._id} review={r} />
            ))}
          </div>
        </section>
      )}

      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </>
  );
}
