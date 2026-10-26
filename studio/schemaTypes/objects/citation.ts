import { defineField, defineType } from "sanity";
import { LANGUAGES } from "../../lib/findings";

/** Inline annotation inside a review's evidence text. One citation = one passage of one source. */
export const citation = defineType({
  name: "citation",
  title: "Citation",
  type: "object",
  fields: [
    defineField({
      name: "source",
      type: "reference",
      to: [{ type: "source" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "locator",
      title: "Page or section",
      type: "string",
      description: "e.g. p. 118, Table 4.2, para. 6, 00:12:30",
      validation: (r) => r.required(),
    }),
    defineField({ name: "quote", title: "Quoted passage", type: "text", rows: 3 }),
    defineField({
      name: "quoteLanguage",
      type: "string",
      options: { list: LANGUAGES },
    }),
    defineField({ name: "translation", title: "Translation of the passage", type: "text", rows: 3 }),
    defineField({
      name: "supports",
      title: "What this passage supports",
      type: "string",
      description: "One sentence: the specific point this citation is evidence for.",
    }),
  ],
  preview: {
    select: { title: "source.title", locator: "locator" },
    prepare: ({ title, locator }) => ({ title: title || "Citation", subtitle: locator }),
  },
});
