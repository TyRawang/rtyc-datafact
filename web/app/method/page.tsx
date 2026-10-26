import type { Metadata } from "next";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { CLAIM_TYPES, FINDINGS } from "@/lib/findings";
import { sanityFetch } from "@/lib/sanity/fetch";
import { pageBySlugQuery } from "@/lib/sanity/queries";
import type { PageDoc } from "@/lib/sanity/types";

export const metadata: Metadata = { title: "About and method" };

export default async function MethodPage() {
  const page = await sanityFetch<PageDoc | null>({ query: pageBySlugQuery, params: { slug: "method" } });
  return (
    <article className="wrap py-10 md:py-14">
      <div className="max-w-4xl mx-auto text-center pb-6">
        <p className="eyebrow muted">About</p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mt-3 mb-5">{page?.title ?? "About and method"}</h1>
        <p className="muted text-lg max-w-2xl mx-auto">
          How Factgaurd Tibet chooses claims, gathers evidence, grades findings, and corrects mistakes.
        </p>
      </div>
      <div className="article-body mx-auto">
        {page?.body?.length ? (
          <PortableText value={page.body} />
        ) : (
          <p className="muted">
            The editorial statement (who runs the site, funding, sourcing standards, translation practice, and contact
            details) is edited in the dashboard as the page with slug “method”. It has not been published yet.
          </p>
        )}

        <h2>Findings</h2>
        <p>Each review ends with one of these findings. Absence of evidence is never treated as proof that a claim is false.</p>
        <div className="table-wrap" style={{ fontFamily: "var(--font-sans)" }}>
          <table className="data">
            <thead><tr><th>Finding</th><th>Requirement</th></tr></thead>
            <tbody>
              {FINDINGS.map((f) => (
                <tr key={f.value}><td className="whitespace-nowrap"><strong>{f.label}</strong></td><td>{f.requirement}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Claim types</h2>
        <ul>
          {CLAIM_TYPES.map((c) => (<li key={c.value}>{c.label}</li>))}
        </ul>
        <p>
          Factual claims can be checked against records. Legal and interpretive claims are assessed against the
          documents and the range of credible readings, and are more likely to end in “Disputed interpretation”.
          Testimony is reported with its provenance rather than graded.
        </p>

        <h2>Original statements</h2>
        <p>
          Each review records the statement in its original language, the translation and translator, the date it was
          made, and an archived copy captured at review time. Where no archive could be made, the review says so.
        </p>

        <h2>Corrections</h2>
        <p>
          Material changes to a published review are recorded on that review and in the public{" "}
          <Link href="/corrections">corrections log</Link>.
        </p>
      </div>
    </article>
  );
}
