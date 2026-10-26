import { defineArrayMember, defineField, defineType } from "sanity";
import { CLAIM_TYPES, FINDINGS, LANGUAGES } from "../lib/findings";

type ReviewDoc = { claimLanguage?: string };

export const claimReview = defineType({
  name: "claimReview",
  title: "Claim review",
  type: "document",
  groups: [
    { name: "question", title: "Question", default: true },
    { name: "claim", title: "The claim" },
    { name: "assessment", title: "Assessment" },
    { name: "meta", title: "Publication" },
  ],
  fields: [
    // Question
    defineField({
      name: "question",
      type: "string",
      group: "question",
      description: "Plain-language question a reader would ask, e.g. “Did … ?”",
      validation: (r) => r.required().max(200),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "question",
      options: { source: "question", maxLength: 80 },
      description: "The permanent URL. Do not change after publishing.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "topics",
      type: "array",
      group: "question",
      of: [{ type: "reference", to: [{ type: "topic" }] }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "claimType",
      type: "string",
      group: "question",
      options: { list: CLAIM_TYPES, layout: "radio" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "image",
      title: "Lead image (optional)",
      type: "image",
      group: "question",
      options: { hotspot: true },
      description: "Shown on cards and at the top of the review. Without one, a typographic plate with the finding is used. Only upload images you have the right to publish.",
      fields: [
        defineField({
          name: "alt",
          title: "Alternative text",
          type: "string",
          validation: (r) =>
            r.custom((value, ctx) => {
              const parent = ctx.parent as { asset?: unknown } | undefined;
              return parent?.asset && !value?.trim() ? "Describe the image for screen readers." : true;
            }),
        }),
        defineField({ name: "credit", title: "Credit / licence", type: "string" }),
      ],
    }),
    defineField({
      name: "searchKeywords",
      title: "Search keywords",
      type: "array",
      group: "question",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description: "Alternate names and phrases readers might search for, in any language (e.g. residential schools, 寄宿制学校).",
    }),

    // The claim
    defineField({
      name: "claimText",
      title: "Exact claim (original language)",
      type: "text",
      group: "claim",
      rows: 3,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "claimLanguage",
      type: "string",
      group: "claim",
      options: { list: LANGUAGES, layout: "radio", direction: "horizontal" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "claimTranslation",
      title: "English translation",
      type: "text",
      group: "claim",
      rows: 3,
      validation: (r) =>
        r.custom((value, ctx) => {
          const lang = (ctx.document as ReviewDoc | undefined)?.claimLanguage;
          if (lang && lang !== "en" && !value?.trim()) return "Provide an English translation.";
          return true;
        }),
    }),
    defineField({ name: "translator", type: "string", group: "claim", description: "Public credit, may be a role rather than a name." }),
    defineField({ name: "speaker", type: "string", group: "claim", description: "Who said it, and in what capacity." }),
    defineField({ name: "publisher", type: "string", group: "claim", description: "Where it was published (ministry, outlet, account)." }),
    defineField({ name: "statementDate", title: "Date of statement", type: "date", group: "claim", validation: (r) => r.required() }),
    defineField({ name: "originalUrl", title: "Original URL", type: "url", group: "claim" }),
    defineField({ name: "capture", title: "Preserved statement", type: "statementCapture", group: "claim", validation: (r) => r.required() }),

    // Assessment
    defineField({
      name: "shortAnswer",
      type: "text",
      group: "assessment",
      rows: 3,
      description: "Two or three sentences a reader can stop at.",
      validation: (r) => r.required().max(500),
    }),
    defineField({
      name: "finding",
      type: "string",
      group: "assessment",
      options: { list: FINDINGS, layout: "radio" },
      description: "Definitions are on the Method page. Absence of evidence is not proof a claim is false.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "evidence",
      type: "array",
      group: "assessment",
      description: "Select text and add a Citation to tie it to a passage of a source.",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
            ],
            annotations: [
              { type: "citation" },
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [{ name: "href", type: "url", validation: (r) => r.required() }],
              },
            ],
          },
        }),
      ],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "limitations",
      title: "Limitations and uncertainty",
      type: "array",
      group: "assessment",
      of: [{ type: "block", styles: [{ title: "Normal", value: "normal" }], marks: { annotations: [] } }],
      description: "What the evidence cannot settle: dates, coverage, definitions, missing data.",
    }),

    // Publication
    defineField({ name: "reviewer", title: "Public byline", type: "string", group: "meta", description: "May be a name, a pseudonym, or “Editorial team”." }),
    defineField({ name: "reviewDate", type: "date", group: "meta", validation: (r) => r.required() }),
    defineField({
      name: "corrections",
      type: "array",
      group: "meta",
      of: [{ type: "correction" }],
      description: "Add an entry for every material change after publication. Shown on the review and in the public log.",
    }),
  ],
  orderings: [
    { title: "Review date, newest", name: "reviewDateDesc", by: [{ field: "reviewDate", direction: "desc" }] },
  ],
  preview: {
    select: { title: "question", finding: "finding", date: "reviewDate" },
    prepare: ({ title, finding, date }) => ({
      title,
      subtitle: [FINDINGS.find((f) => f.value === finding)?.title, date].filter(Boolean).join(" · "),
    }),
  },
});
