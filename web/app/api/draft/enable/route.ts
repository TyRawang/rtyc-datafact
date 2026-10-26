import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/lib/sanity/client";
import { readToken } from "@/lib/sanity/env";

/**
 * Entered from the Studio's Presentation tool. Validates a Studio-issued
 * secret with the read token, then enables Next.js draft mode.
 */
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: readToken }),
});
