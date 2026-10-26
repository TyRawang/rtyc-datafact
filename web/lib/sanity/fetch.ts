import "server-only";
import { draftMode } from "next/headers";
import { evaluate, parse } from "groq-js";
import { client } from "./client";
import { readToken, useFixtures } from "./env";
import { loadFixtures } from "./fixtures";

/** Every published content fetch carries this tag; the publish webhook revalidates it. */
export const CONTENT_TAG = "content";

type FetchOptions = {
  query: string;
  params?: Record<string, unknown>;
  /** Ignore draft mode and always read published content (used for the search index). */
  publishedOnly?: boolean;
};

export async function sanityFetch<T>({
  query,
  params = {},
  publishedOnly = false,
}: FetchOptions): Promise<T> {
  if (useFixtures) {
    const docs = await loadFixtures();
    const value = await evaluate(parse(query), { dataset: docs, params });
    return (await value.get()) as T;
  }

  const isDraft = !publishedOnly && (await draftMode()).isEnabled;

  if (isDraft) {
    if (!readToken) {
      throw new Error("SANITY_API_READ_TOKEN is required for draft preview.");
    }
    return client.fetch<T>(query, params, {
      token: readToken,
      perspective: "drafts",
      useCdn: false,
      stega: true,
      cache: "no-store",
    });
  }

  return client.fetch<T>(query, params, {
    perspective: "published",
    stega: false,
    next: { revalidate: 3600, tags: [CONTENT_TAG] },
  });
}
