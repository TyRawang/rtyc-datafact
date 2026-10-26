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
  return NextResponse.json(
    { generatedAt: new Date().toISOString(), docs },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } },
  );
}
