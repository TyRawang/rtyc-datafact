import { defineField, defineType } from "sanity";

export const topic = defineType({
  name: "topic",
  title: "Topic",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
      description: "Used in the URL filter. Do not change after publishing.",
    }),
    defineField({ name: "description", type: "text", rows: 2 }),
  ],
});
