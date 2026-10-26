import { defineField, defineType } from "sanity";
import { LANGUAGES } from "../lib/findings";

export const source = defineType({
  name: "source",
  title: "Source",
  type: "document",
  description: "One record per document. Reviews cite it through citations; passages live on the citation, not here.",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "publisher", type: "string" }),
    defineField({ name: "date", title: "Publication date", type: "date" }),
    defineField({ name: "originalUrl", title: "Original URL", type: "url" }),
    defineField({
      name: "language",
      type: "string",
      options: { list: LANGUAGES.map((l) => ({ value: l.title, title: l.title })) },
    }),
    defineField({
      name: "rightsStatus",
      title: "Rights status",
      type: "string",
      description: "Who holds copyright and under what terms you may host or quote it.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "hostingPolicy",
      title: "Hosting policy",
      type: "string",
      options: {
        list: [
          { value: "full", title: "Full copy may be hosted publicly" },
          { value: "excerpt", title: "Excerpt and link only" },
          { value: "private", title: "Private capture (never published)" },
        ],
        layout: "radio",
      },
      initialValue: "excerpt",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "file",
      title: "Document file",
      type: "file",
      options: { accept: ".pdf,.html,.txt,.png,.jpg,.jpeg" },
      description:
        "Published on the website only when the hosting policy is “Full copy”. Do NOT upload restricted captures here: anything uploaded to Sanity has a public URL.",
      validation: (r) =>
        r.custom((file, ctx) => {
          const policy = (ctx.document as { hostingPolicy?: string } | undefined)?.hostingPolicy;
          if (policy === "private" && file) {
            return "Private captures must not be uploaded to Sanity. Store them outside the CMS and describe the location in Notes.";
          }
          return true;
        }),
    }),
    defineField({ name: "notes", title: "Context notes", type: "text", rows: 3, description: "Shown publicly on the source page." }),
    defineField({
      name: "relatedSources",
      title: "Related documents",
      type: "array",
      of: [{ type: "reference", to: [{ type: "source" }] }],
      description: "For example, the dataset this report is based on.",
    }),
  ],
  preview: {
    select: { title: "title", publisher: "publisher", date: "date", policy: "hostingPolicy" },
    prepare: ({ title, publisher, date, policy }) => ({
      title,
      subtitle: [publisher, date, policy && `[${policy}]`].filter(Boolean).join(" · "),
    }),
  },
});
