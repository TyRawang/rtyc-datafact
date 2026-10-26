import MiniSearch, { type SearchResult } from "minisearch";
import type { SearchDoc } from "@/lib/sanity/types";
import { normalizeTerm, tokenize } from "./tokenizer";

/** Search document after array fields are flattened for indexing. */
export type IndexedDoc = SearchDoc & {
  keywordsText: string;
  topicTitlesText: string;
};

const FIELDS: (keyof IndexedDoc)[] = [
  "title",
  "question",
  "body",
  "claimText",
  "claimTranslation",
  "keywordsText",
  "shortAnswer",
  "evidenceText",
  "topicTitlesText",
];

/** Question titles and editor-supplied keywords outrank body text. */
const BOOST: Partial<Record<keyof IndexedDoc, number>> = {
  title: 4,
  question: 4,
  body: 1,
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
      "type",
      "url",
      "title",
      "subtitle",
      "body",
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
export function runSearch(
  index: MiniSearch<IndexedDoc>,
  query: string,
  topic?: string,
  type?: SearchDoc["type"],
) {
  const filter = (r: SearchResult) =>
    (!type || r.type === type) && (!topic || (Array.isArray(r.topics) && r.topics.includes(topic)));
  let hits = index.search(query, { combineWith: "AND", filter });
  if (hits.length === 0) hits = index.search(query, { combineWith: "OR", filter });
  return hits;
}
