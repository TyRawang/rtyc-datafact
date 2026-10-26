import type { Metadata } from "next";
import { Browse } from "@/components/Browse";
import { sanityFetch } from "@/lib/sanity/fetch";
import { allReviewsQuery, allTopicsQuery } from "@/lib/sanity/queries";
import type { ReviewSummary, TopicRef } from "@/lib/sanity/types";

export const metadata: Metadata = { title: "All reviews" };

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; q?: string }>;
}) {
  const { topic, q } = await searchParams;
  const [reviews, topics] = await Promise.all([
    sanityFetch<ReviewSummary[]>({ query: allReviewsQuery }),
    sanityFetch<TopicRef[]>({ query: allTopicsQuery }),
  ]);
  return (
    <Browse
      reviews={reviews ?? []}
      topics={(topics ?? []).filter((t) => (t.count ?? 0) > 0)}
      initialTopic={topic}
      initialQuery={q}
    />
  );
}
