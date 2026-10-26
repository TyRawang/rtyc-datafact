import { defineField, defineType } from "sanity";

type CaptureValue = {
  captureFile?: unknown;
  waybackUrl?: string;
  archiveUnavailable?: boolean;
  archiveNote?: string;
};

export const statementCapture = defineType({
  name: "statementCapture",
  title: "Preserved statement",
  type: "object",
  description: "Capture the original statement at review time. Original pages change or disappear.",
  fields: [
    defineField({ name: "captureDate", type: "date", description: "The date you captured it (not the date of the statement)." }),
    defineField({
      name: "captureMethod",
      type: "string",
      options: {
        list: ["Browser print to PDF", "Screenshot", "Wayback Save Page Now", "Other"],
      },
    }),
    defineField({
      name: "captureFile",
      title: "Captured copy (PDF or image)",
      type: "file",
      options: { accept: ".pdf,.png,.jpg,.jpeg" },
      description: "Published with the review. If the capture must stay private, leave this empty and explain in the note.",
    }),
    defineField({ name: "waybackUrl", title: "Wayback Machine URL", type: "url" }),
    defineField({
      name: "archiveUnavailable",
      title: "No archive could be made",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "archiveNote",
      title: "Archive note",
      type: "text",
      rows: 2,
      description: "Required when no archive could be made: say why, and where any private capture is held.",
    }),
  ],
  validation: (r) =>
    r.custom((value?: CaptureValue) => {
      if (!value) return "Record how the original statement was preserved.";
      const hasArchive = Boolean(value.captureFile || value.waybackUrl);
      if (!hasArchive && !value.archiveUnavailable) {
        return "Attach a captured copy or a Wayback URL, or tick “No archive could be made” and explain.";
      }
      if (value.archiveUnavailable && !value.archiveNote?.trim()) {
        return "Explain why no archive could be made.";
      }
      return true;
    }),
});
