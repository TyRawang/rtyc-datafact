import { Browse } from "@/components/Browse";
import { sanityFetch } from "@/lib/sanity/fetch";
import { allReviewsQuery, allTopicsQuery } from "@/lib/sanity/queries";
import type { ReviewSummary, TopicRef } from "@/lib/sanity/types";

export default async function HomePage({
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
      topics={topics ?? []}
      initialTopic={topic}
      initialQuery={q}
    />
  );
}
