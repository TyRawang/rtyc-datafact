import { defineField, defineType } from "sanity";

export const correction = defineType({
  name: "correction",
  title: "Correction",
  type: "object",
  fields: [
    defineField({ name: "date", type: "date", validation: (r) => r.required() }),
    defineField({
      name: "change",
      title: "What changed",
      type: "text",
      rows: 2,
      validation: (r) => r.required(),
    }),
    defineField({ name: "reason", title: "Why", type: "text", rows: 2 }),
  ],
  preview: {
    select: { date: "date", change: "change" },
    prepare: ({ date, change }) => ({ title: change, subtitle: date }),
  },
});
