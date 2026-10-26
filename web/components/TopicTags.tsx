import Link from "next/link";
import type { TopicRef } from "@/lib/sanity/types";

export function TopicTags({ topics }: { topics?: TopicRef[] | null }) {
  if (!topics?.length) return null;
  return (
    <span>
      {topics.map((t) => (
        <Link key={t._id} className="tag" href={`/?topic=${encodeURIComponent(t.slug)}`}>
          {t.title}
        </Link>
      ))}
    </span>
  );
}
