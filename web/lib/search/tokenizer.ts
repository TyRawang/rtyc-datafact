/**
 * Tokenizer shared by index building and querying.
 *
 * MiniSearch's default tokenizer splits on non-word characters, which turns a
 * Chinese sentence into a single token. Intl.Segmenter uses ICU dictionaries
 * for Chinese word boundaries. Tibetan syllables are additionally split on the
 * tsheg (U+0F0B, U+0F0C) so a query for one syllable matches.
 */
const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "word" })
    : null;

const TSHEG = /[་༌]+  /u;
const FALLBACK_SPLIT = /[\s\p{P}\p{S}]+/u;

export function tokenize(text: string): string[] {
  if (!text) return [];
  const tokens: string[] = [];
  if (segmenter) {
    for (const seg of segmenter.segment(text)) {
      if (!seg.isWordLike) continue;
      for (const part of seg.segment.split(TSHEG)) {
        if (part) tokens.push(part);
      }
    }
  } else {
    for (const part of text.split(FALLBACK_SPLIT)) {
      for (const sub of part.split(TSHEG)) {
        if (sub) tokens.push(sub);
      }
    }
  }
  return tokens;
}

export function normalizeTerm(term: string): string {
  return term.normalize("NFKC").toLowerCase();
}
