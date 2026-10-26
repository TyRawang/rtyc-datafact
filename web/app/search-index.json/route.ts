import { NextResponse } from "next/server";
import { sanityFetch } from "@/lib/sanity/fetch";
import { searchDocsQuery } from "@/lib/sanity/queries";
import type { SearchDoc } from "@/lib/sanity/types";

/**
 * Published content only. Never reads drafts, private notes, or file URLs,
 * so nothing unpublished can leak through search.
 */
export async function GET() {
  const docs = (await sanityFetch<SearchDoc[]>({ query: searchDocsQuery, publishedOnly: true })) ?? [];
  // No CDN cache header on purpose: the Sanity fetch behind this is cached and
  // tagged in Next's data cache, which the publish webhook invalidates. A CDN
  // max-age here would keep serving the old index after a publish.
  return NextResponse.json({ generatedAt: new Date().toISOString(), docs });
}
