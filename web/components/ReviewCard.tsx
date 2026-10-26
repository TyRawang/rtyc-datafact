import Link from "next/link";
import { findingLabel } from "@/lib/findings";
import { formatDate } from "@/lib/format";
import type { ReviewSummary } from "@/lib/sanity/types";

/** Photograph when the review has one, otherwise a typographic plate with the finding. */
export function Plate({ review, className = "" }: { review: ReviewSummary; className?: string }) {
  if (review.image?.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`${review.image.url}?w=900&auto=format`} alt={review.image.alt ?? ""} className={`photo ${className}`} loading="lazy" />
    );
  }
  const topic = review.topics?.[0]?.title;
  return (
    <div className={`plate ${className}`} aria-hidden="true">
      <span className="eyebrow">{topic ?? "Claim review"}</span>
      <span className="finding">{findingLabel(review.finding)}</span>
    </div>
  );
}

export function ReviewCard({ review, size = "md" }: { review: ReviewSummary; size?: "md" | "sm" }) {
  const href = `/reviews/${encodeURIComponent(review.slug)}`;
  const topic = review.topics?.[0];
  return (
    <article>
      <Link href={href} className="block photo-wrap aspect-[16/11]" tabIndex={-1} aria-hidden="true">
        <Plate review={review} />
      </Link>
      <div className="eyebrow mt-5 mb-3">{topic?.title ?? "Claim review"}</div>
      <h3>
        <Link href={href} className={`story-title ${size === "sm" ? "text-lg" : "text-2xl"}`}>
          {review.question}
        </Link>
      </h3>
      {review.shortAnswer && <p className="text-sm muted mt-3 leading-6">{review.shortAnswer}</p>}
      <p className="meta mt-4">
        <span className="badge">{findingLabel(review.finding)}</span>
        {review.reviewDate && <> · {formatDate(review.reviewDate)}</>}
      </p>
    </article>
  );
}
