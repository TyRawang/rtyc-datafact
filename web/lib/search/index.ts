import MiniSearch, { type SearchResult } from "minisearch";
import type { SearchDoc } from "@/lib/sanity/types";
import { normalizeTerm, tokenize } from "./tokenizer";

/** Search document after array fields are flattened for indexing. */
export type IndexedDoc = SearchDoc & {
  keywordsText: string;
  topicTitlesText: string;
};

const FIELDS: (keyof IndexedDoc)[] = [
  "question",
  "claimText",
  "claimTranslation",
  "keywordsText",
  "shortAnswer",
  "evidenceText",
  "topicTitlesText",
];

/** Question titles and editor-supplied keywords outrank body text. */
const BOOST: Partial<Record<keyof IndexedDoc, number>> = {
  question: 4,
  keywordsText: 3,
  claimText: 2,
  claimTranslation: 2,
  shortAnswer: 1.5,
  topicTitlesText: 1,
  evidenceText: 1,
};

export function toIndexedDoc(d: SearchDoc): IndexedDoc {
  return {
    ...d,
    keywordsText: (d.searchKeywords ?? []).join(" "),
    topicTitlesText: (d.topicTitles ?? []).join(" "),
  };
}

export function createIndex(docs: SearchDoc[] = []) {
  const index = new MiniSearch<IndexedDoc>({
    idField: "id",
    fields: FIELDS as string[],
    storeFields: [
      "id",
      "question",
      "claimText",
      "claimTranslation",
      "shortAnswer",
      "evidenceText",
      "finding",
      "topics",
      "topicTitles",
    ],
    tokenize,
    processTerm: normalizeTerm,
    searchOptions: { boost: BOOST as Record<string, number>, prefix: true, fuzzy: 0.15 },
  });
  index.addAll(docs.map(toIndexedDoc));
  return index;
}

/** AND first for precision; fall back to OR so a multi-word query never returns nothing. */
export function runSearch(index: MiniSearch<IndexedDoc>, query: string, topic?: string) {
  const filter = topic
    ? (r: SearchResult) => Array.isArray(r.topics) && r.topics.includes(topic)
    : undefined;
  let hits = index.search(query, { combineWith: "AND", filter });
  if (hits.length === 0) hits = index.search(query, { combineWith: "OR", filter });
  return hits;
}
