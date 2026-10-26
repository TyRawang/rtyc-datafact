import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { revalidateSecret } from "@/lib/sanity/env";
import { CONTENT_TAG } from "@/lib/sanity/fetch";

/**
 * Sanity webhook target. Configure a GROQ-powered webhook in sanity.io/manage
 * for create/update/delete on all document types, with the same secret as
 * SANITY_REVALIDATE_SECRET. Published content is re-fetched on the next request.
 */
export async function POST(req: NextRequest) {
  if (!revalidateSecret) {
    return new Response("SANITY_REVALIDATE_SECRET is not configured", { status: 500 });
  }
  try {
    const { isValidSignature, body } = await parseBody<{ _type?: string; _id?: string }>(req, revalidateSecret);
    if (!isValidSignature) return new Response("Invalid signature", { status: 401 });
    // Expire immediately rather than stale-while-revalidate: a burst of publishes
    // otherwise regenerates pages from stale data and leaves them cached for an hour.
    revalidateTag(CONTENT_TAG, { expire: 0 });
    return NextResponse.json({ revalidated: true, type: body?._type, id: body?._id, at: Date.now() });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Bad request", { status: 400 });
  }
}
