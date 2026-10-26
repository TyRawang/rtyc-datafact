import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, studioUrl } from "./env";

export const client = createClient({
  projectId: projectId || "placeholder",
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
  stega: { studioUrl },
});
