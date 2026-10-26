import { defineField, defineType } from "sanity";

export const dataset = defineType({
  name: "dataset",
  title: "Dataset",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "description", type: "text", rows: 2 }),
    defineField({
      name: "source",
      type: "reference",
      to: [{ type: "source" }],
      description: "The document this data was taken from. Rights follow that source.",
      validation: (r) => r.required(),
    }),
    defineField({ name: "file", type: "file", options: { accept: ".csv,.tsv,.xlsx,.json" } }),
    defineField({ name: "periodStart", title: "Period start (year)", type: "string" }),
    defineField({ name: "periodEnd", title: "Period end (year)", type: "string" }),
    defineField({ name: "geographicCoverage", type: "string" }),
    defineField({ name: "units", type: "string" }),
    defineField({ name: "methodology", type: "text", rows: 3 }),
    defineField({ name: "limitations", type: "text", rows: 3 }),
  ],
});
