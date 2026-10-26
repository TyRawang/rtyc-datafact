import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { defineLocations, presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || "placeholder";
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const previewUrl = process.env.SANITY_STUDIO_PREVIEW_URL || "http://localhost:3000";

const publishedId = (id: string) => id.replace(/^drafts\./, "");

export default defineConfig({
  name: "tibet-evidence",
  title: "Tibet / Evidence",
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        initial: previewUrl,
        previewMode: { enable: "/api/draft/enable", disable: "/api/draft/disable" },
      },
      resolve: {
        locations: {
          claimReview: defineLocations({
            select: { question: "question", slug: "slug.current" },
            resolve: (doc) => ({
              locations: [
                { title: doc?.question || "Untitled review", href: `/reviews/${doc?.slug ?? ""}` },
                { title: "All reviews", href: "/" },
              ],
            }),
          }),
          source: defineLocations({
            select: { title: "title", id: "_id" },
            resolve: (doc) => ({
              locations: [
                { title: doc?.title || "Untitled source", href: `/sources/${publishedId(doc?.id ?? "")}` },
                { title: "All sources", href: "/sources" },
              ],
            }),
          }),
          dataset: { locations: [{ title: "Datasets", href: "/datasets" }] },
          page: { locations: [{ title: "About and method", href: "/method" }] },
        },
      },
    }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
});
