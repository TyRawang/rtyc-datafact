import Link from "next/link";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponents,
} from "@portabletext/react";
import type { Citation } from "@/lib/sanity/types";
import { formatDate } from "@/lib/format";

type Span = { _type: string; marks?: string[]; text?: string };
type Block = PortableTextBlock & {
  children?: Span[];
  markDefs?: ({ _key: string; _type: string } & Record<string, unknown>)[];
};

/** Numbers citation annotations in reading order so footnotes match the text. */
export function collectCitations(blocks: PortableTextBlock[] | undefined): Citation[] {
  const ordered: Citation[] = [];
  const seen = new Set<string>();
  for (const block of (blocks ?? []) as Block[]) {
    if (block._type !== "block") continue;
    const defs = new Map((block.markDefs ?? []).map((d) => [d._key, d]));
    for (const child of block.children ?? []) {
      for (const mark of child.marks ?? []) {
        const def = defs.get(mark);
        if (def && def._type === "citation" && !seen.has(def._key)) {
          seen.add(def._key);
          ordered.push(def as unknown as Citation);
        }
      }
    }
  }
  return ordered;
}

function buildComponents(numbering: Map<string, number>): PortableTextComponents {
  return {
    marks: {
      citation: ({ children, value }) => {
        const n = value?._key ? numbering.get(value._key) : undefined;
        return (
          <>
            {children}
            {n !== undefined && (
              <a
                className="cite-ref"
                href={`#cite-${n}`}
                id={`ref-${n}`}
                aria-label={`Citation ${n}`}
              >
                [{n}]
              </a>
            )}
          </>
        );
      },
      link: ({ children, value }) => (
        <a href={value?.href} rel="noopener noreferrer">
          {children}
        </a>
      ),
    },
  };
}

export function Evidence({
  blocks,
  citations,
}: {
  blocks?: PortableTextBlock[];
  citations: Citation[];
}) {
  if (!blocks?.length) return <p className="muted">No evidence recorded.</p>;
  const numbering = new Map(citations.map((c, i) => [c._key, i + 1]));
  return <PortableText value={blocks} components={buildComponents(numbering)} />;
}

export function CitationList({ citations }: { citations: Citation[] }) {
  if (!citations.length) {
    return <p className="muted">This review does not yet cite any sources.</p>;
  }
  return (
    <ol className="citations">
      {citations.map((c, i) => {
        const n = i + 1;
        const src = c.source;
        return (
          <li key={c._key} id={`cite-${n}`}>
            {src ? (
              <>
                <Link href={`/sources/${encodeURIComponent(src._id)}`}>{src.title}</Link>
                {src.publisher && <>, {src.publisher}</>}
                {src.date && <>, {formatDate(src.date)}</>}
              </>
            ) : (
              <span className="muted">Source missing</span>
            )}
            {c.locator && <> · {c.locator}</>}
            {c.quote && (
              <blockquote lang={c.quoteLanguage || undefined}>
                <p>{c.quote}</p>
                {c.translation && <p className="muted small">Translation: {c.translation}</p>}
              </blockquote>
            )}
            {c.supports && <p className="small">Supports: {c.supports}</p>}
            <p className="small">
              {src?.fileUrl && (
                <>
                  <a href={src.fileUrl}>Open document</a> ·{" "}
                </>
              )}
              {src?.originalUrl && <a href={src.originalUrl}>Original location</a>}{" "}
              <a href={`#ref-${n}`} aria-label={`Back to reference ${n}`}>↩</a>
            </p>
          </li>
        );
      })}
    </ol>
  );
}
