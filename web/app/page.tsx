import Link from "next/link";
import { Plate, ReviewCard } from "@/components/ReviewCard";
import { findingLabel } from "@/lib/findings";
import { formatDate } from "@/lib/format";
import { sanityFetch } from "@/lib/sanity/fetch";
import { allReviewsQuery } from "@/lib/sanity/queries";
import type { ReviewSummary } from "@/lib/sanity/types";

export default async function HomePage() {
  const reviews = (await sanityFetch<ReviewSummary[]>({ query: allReviewsQuery })) ?? [];
  const [lead, ...rest] = reviews;
  const side = rest.slice(0, 2);
  const latest = rest.slice(2, 8);
  const readingList = reviews.slice(0, 4);

  if (!lead) {
    return (
      <div className="wrap py-14">
        <h1 className="text-4xl font-extrabold tracking-tight">No reviews published yet.</h1>
      </div>
    );
  }

  return (
    <div className="wrap py-8 md:py-12">
      <div className="flex gap-3 items-center text-xs mb-8">
        <span className="label">Latest review</span>
        <span className="muted">One statement. The evidence. A finding you can trace.</span>
      </div>

      <section className="grid lg:grid-cols-[1.7fr_1fr] gap-8" aria-label="Featured reviews">
        <article className={`hero photo-wrap ${lead.image?.url ? "has-photo" : ""}`}>
          {lead.image?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="photo" src={`${lead.image.url}?w=1600&auto=format`} alt={lead.image.alt ?? ""} />
          )}
          <div className="hero-copy">
            <span className="label">{findingLabel(lead.finding)}</span>
            <h1 className="mt-5 mb-4">
              <Link className="story-title" href={`/reviews/${encodeURIComponent(lead.slug)}`}>
                {lead.question}
              </Link>
            </h1>
            {lead.shortAnswer && <p className="lede">{lead.shortAnswer}</p>}
            <p className="meta mt-4">
              {lead.topics?.[0]?.title ?? "Claim review"} &nbsp; / &nbsp; {formatDate(lead.reviewDate)}
            </p>
          </div>
        </article>
        <div className="grid gap-7">
          {side.map((r) => (
            <article key={r._id} className="grid grid-cols-[1fr_1.1fr] gap-5 items-center">
              <Link href={`/reviews/${encodeURIComponent(r.slug)}`} className="photo-wrap block h-48" tabIndex={-1} aria-hidden="true">
                <Plate review={r} />
              </Link>
              <div>
                <div className="eyebrow mb-3">{r.topics?.[0]?.title ?? "Claim review"}</div>
                <h2>
                  <Link href={`/reviews/${encodeURIComponent(r.slug)}`} className="story-title text-2xl">
                    {r.question}
                  </Link>
                </h2>
                <p className="meta mt-4">
                  <span className="badge">{findingLabel(r.finding)}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-[1fr_300px] gap-12 mt-16">
        <div>
          <div className="section-heading flex justify-between items-center">
            <h2>Latest reviews</h2>
            <Link href="/reviews" className="text-xs font-normal tracking-normal">
              View all ↗
            </Link>
          </div>
          {latest.length ? (
            <div className="grid sm:grid-cols-2 gap-x-7 gap-y-10">
              {latest.map((r) => (
                <ReviewCard key={r._id} review={r} />
              ))}
            </div>
          ) : (
            <p className="muted">More reviews are on the way.</p>
          )}
        </div>
        <aside>
          <h2 className="section-heading">Start here</h2>
          {readingList.map((r, i) => (
            <article key={r._id} className="flex gap-5 py-5 border-b borderline">
              <span className="text-3xl font-bold muted">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="eyebrow mb-2">{findingLabel(r.finding)}</p>
                <h3>
                  <Link className="story-title text-lg" href={`/reviews/${encodeURIComponent(r.slug)}`}>
                    {r.question}
                  </Link>
                </h3>
              </div>
            </article>
          ))}
          <div className="panel mt-8">
            <div className="eyebrow">How we work</div>
            <h3 className="text-3xl font-bold tracking-tight mt-4 mb-4">Every finding is traceable.</h3>
            <p className="muted text-sm mb-6">
              Each review quotes the exact statement, archives it, and cites the page of every document it relies on.
              Findings use a fixed vocabulary and corrections are logged publicly.
            </p>
            <Link href="/method" className="primary">
              Read the method ↗
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
