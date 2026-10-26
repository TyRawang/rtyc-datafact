import Image from "next/image";
import Link from "next/link";
import type { TopicRef } from "@/lib/sanity/types";

export function SiteFooter({ topics }: { topics: TopicRef[] }) {
  return (
    <footer className="foot">
      <div className="wrap flex flex-wrap justify-between gap-6 items-center">
        <div>
          <Link href="/" aria-label="Factgaurd Tibet home">
            <Image src="/logo.png" alt="Factgaurd Tibet" width={2172} height={724} className="logo" />
          </Link>
          <p className="text-xs muted mt-3">
            Evidence-based reviews of specific claims about Tibet. A project by Tibetan Youth Congress.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-xs">
          <Link href="/reviews">All reviews</Link>
          {topics.slice(0, 4).map((t) => (
            <Link key={t._id} href={`/reviews?topic=${encodeURIComponent(t.slug)}`}>
              {t.title}
            </Link>
          ))}
          <Link href="/sources">Sources</Link>
          <Link href="/method">Method</Link>
          <Link href="/corrections">Corrections</Link>
        </div>
      </div>
      <div className="wrap text-xs muted mt-8">
        Every review links to the original statement and the documents behind the finding. No accounts, no
        tracking, no personal data collected.
      </div>
    </footer>
  );
}
